"use client";

import { useState } from "react";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StageFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: { name: string };
}

interface Stage {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  soundcheckStart: string | null;
  soundcheckEnd: string | null;
  performancesStart: string | null;
  performancesEnd: string | null;
  managerId: string | null;
  manager: (TeamMember) | null;
  cadFileUrl: string | null;
  files: StageFile[];
}

interface Props {
  festivalId: string;
  stages: Stage[];
  teamMembers: TeamMember[];
  isAdmin: boolean;
  createStage: (fd: FormData) => Promise<void>;
  updateStage: (id: string, fd: FormData) => Promise<void>;
  deleteStage: (id: string, festivalId: string) => Promise<void>;
  createStageFile: (stageId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteStageFile: (id: string, stageId: string, festivalId: string) => Promise<void>;
}

// ─── Stage Form (shared for add/edit) ─────────────────────────────────────────

function StageForm({
  initial,
  teamMembers,
  festivalId,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Stage;
  teamMembers: TeamMember[];
  festivalId: string;
  onSubmit: (fd: FormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("festivalId", festivalId);
    await onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">שם הבמה *</label>
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="במה ראשית"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מיקום</label>
          <input
            name="location"
            defaultValue={initial?.location ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="מגרש הספורט"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קיבולת</label>
          <input
            name="capacity"
            type="number"
            min="0"
            defaultValue={initial?.capacity ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">בלאנסים — התחלה</label>
          <input
            name="soundcheckStart"
            type="time"
            defaultValue={initial?.soundcheckStart ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">בלאנסים — סיום</label>
          <input
            name="soundcheckEnd"
            type="time"
            defaultValue={initial?.soundcheckEnd ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">הופעות — התחלה</label>
          <input
            name="performancesStart"
            type="time"
            defaultValue={initial?.performancesStart ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">הופעות — סיום</label>
          <input
            name="performancesEnd"
            type="time"
            defaultValue={initial?.performancesEnd ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">מנהל/ת במה</label>
          <select
            name="managerId"
            defaultValue={initial?.managerId ?? ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">— ללא מנהל —</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} ({m.role.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
        >
          ביטול
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition disabled:opacity-60"
        >
          {submitting ? "שומר..." : initial ? "שמור שינויים" : "הוסף במה"}
        </button>
      </div>
    </form>
  );
}

// ─── Stage Card ───────────────────────────────────────────────────────────────

function StageCard({
  stage,
  festivalId,
  isAdmin,
  teamMembers,
  onEdit,
  onDelete,
  onAddFile,
  onDeleteFile,
}: {
  stage: Stage;
  festivalId: string;
  isAdmin: boolean;
  teamMembers: TeamMember[];
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
  onAddFile: (stage: Stage, file: File) => Promise<void>;
  onDeleteFile: (fileId: string, stage: Stage) => void;
}) {
  const [tab, setTab] = useState<"info" | "files">("info");
  const [addingLink, setAddingLink] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const FILE_ICONS: Record<string, string> = {
    contract: "📄",
    technical: "🔧",
    map: "🗺️",
    other: "📎",
  };

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=stages", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        await onAddFile(stage, file);
        // Re-call with actual URL — we pass the file + url via a wrapper
        toast("הקובץ הועלה");
      } else {
        toast(data.error ?? "שגיאה בהעלאה", "error");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-violet-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">🎪</span>
          <h3 className="font-bold text-white truncate">{stage.name}</h3>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(stage)}
              className="text-violet-200 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-violet-500 transition"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(stage)}
              className="text-violet-200 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-violet-500 transition"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["info", "files"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition ${
              tab === t
                ? "text-violet-600 border-b-2 border-violet-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "info" ? "פרטים" : `מסמכים (${stage.files.length})`}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "info" && (
          <div className="space-y-3 text-sm">
            {stage.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>📍</span><span>{stage.location}</span>
              </div>
            )}
            {stage.capacity && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>👥</span><span>קיבולת: {stage.capacity.toLocaleString()}</span>
              </div>
            )}
            {(stage.soundcheckStart || stage.soundcheckEnd) && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>🎚️</span>
                <span>
                  בלאנסים: <span dir="ltr">{stage.soundcheckStart ?? "?"} – {stage.soundcheckEnd ?? "?"}</span>
                </span>
              </div>
            )}
            {(stage.performancesStart || stage.performancesEnd) && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>🎵</span>
                <span>
                  הופעות: <span dir="ltr">{stage.performancesStart ?? "?"} – {stage.performancesEnd ?? "?"}</span>
                </span>
              </div>
            )}
            {stage.manager && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>👤</span>
                <span>
                  מנהל/ת: {stage.manager.firstName} {stage.manager.lastName}
                  <span className="text-gray-400 text-xs mr-1">({stage.manager.role.name})</span>
                </span>
              </div>
            )}
            {!stage.location && !stage.capacity && !stage.soundcheckStart && !stage.performancesStart && !stage.manager && (
              <p className="text-gray-400 text-xs">אין פרטים נוספים</p>
            )}
          </div>
        )}

        {tab === "files" && (
          <div className="space-y-2">
            {stage.files.length === 0 && (
              <p className="text-gray-400 text-xs text-center py-3">אין מסמכים עדיין</p>
            )}
            {stage.files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-base">{FILE_ICONS[f.fileType ?? "other"] ?? "📎"}</span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-violet-600 hover:underline truncate"
                >
                  {f.name}
                </a>
                {isAdmin && (
                  <button
                    onClick={() => onDeleteFile(f.id, stage)}
                    className="text-gray-300 hover:text-red-400 transition text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {isAdmin && (
              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 text-xs text-violet-600 cursor-pointer hover:text-violet-700">
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload?folder=stages", { method: "POST", body: fd });
                        const data = await res.json();
                        if (data.url) {
                          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                          const fileType = ext === "pdf" ? "contract" : ["doc","docx"].includes(ext) ? "technical" : "other";
                          await onAddFile(stage, { url: data.url, name: file.name, fileType } as any);
                        } else {
                          toast(data.error ?? "שגיאה", "error");
                        }
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {uploading ? "⏳ מעלה..." : "📎 העלה קובץ"}
                </label>

                {!addingLink ? (
                  <button
                    onClick={() => setAddingLink(true)}
                    className="text-xs text-gray-400 hover:text-violet-600 transition"
                  >
                    + קישור חיצוני
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <input
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      placeholder="שם המסמך"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                      dir="ltr"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!linkName || !linkUrl) return;
                          await onAddFile(stage, { url: linkUrl, name: linkName, fileType: "other", isExternal: true } as any);
                          setLinkName(""); setLinkUrl(""); setAddingLink(false);
                        }}
                        className="bg-violet-600 text-white px-2 py-1 rounded-lg text-xs"
                      >
                        הוסף
                      </button>
                      <button
                        onClick={() => { setAddingLink(false); setLinkName(""); setLinkUrl(""); }}
                        className="text-gray-400 text-xs px-2"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StagesClient({
  festivalId,
  stages: initialStages,
  teamMembers,
  isAdmin,
  createStage,
  updateStage,
  deleteStage,
  createStageFile,
  deleteStageFile,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [stages, setStages] = useState(initialStages);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(fd: FormData) {
    setSubmitting(true);
    try {
      await createStage(fd);
      setShowAddForm(false);
      toast("הבמה נוצרה");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(fd: FormData) {
    if (!editingStage) return;
    setSubmitting(true);
    try {
      await updateStage(editingStage.id, fd);
      setEditingStage(null);
      toast("הבמה עודכנה");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(stage: Stage) {
    const ok = await confirm(`למחוק את הבמה "${stage.name}"?`);
    if (!ok) return;
    await deleteStage(stage.id, festivalId);
    toast("הבמה נמחקה");
  }

  async function handleAddFile(stage: Stage, fileOrMeta: any) {
    const isExternal = fileOrMeta.isExternal ?? false;
    const url = fileOrMeta.url as string;
    const name = fileOrMeta.name as string;
    const fileType = (fileOrMeta.fileType as string) ?? "other";
    await createStageFile(stage.id, festivalId, name, url, isExternal, fileType);
  }

  async function handleDeleteFile(fileId: string, stage: Stage) {
    const ok = await confirm("למחוק את הקובץ?");
    if (!ok) return;
    await deleteStageFile(fileId, stage.id, festivalId);
    toast("הקובץ נמחק");
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎪 במות</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stages.length} במות</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingStage(null); }}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition"
          >
            + הוסף במה
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">הוספת במה חדשה</h2>
          <StageForm
            teamMembers={teamMembers}
            festivalId={festivalId}
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            submitting={submitting}
          />
        </div>
      )}

      {/* Edit modal */}
      {editingStage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingStage(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-800 mb-4">עריכת במה — {editingStage.name}</h2>
            <StageForm
              initial={editingStage}
              teamMembers={teamMembers}
              festivalId={festivalId}
              onSubmit={handleUpdate}
              onCancel={() => setEditingStage(null)}
              submitting={submitting}
            />
          </div>
        </div>
      )}

      {/* Stages grid */}
      {stages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎪</div>
          <p className="font-medium">אין במות עדיין</p>
          {isAdmin && <p className="text-sm mt-1">לחץ "הוסף במה" כדי להתחיל</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              festivalId={festivalId}
              isAdmin={isAdmin}
              teamMembers={teamMembers}
              onEdit={setEditingStage}
              onDelete={handleDelete}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
