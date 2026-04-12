"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  carNumber: string | null;
  notes: string | null;
  role: { name: string };
}

interface ArtistFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

interface ArtistTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  stage: { name: string } | null;
}

interface ArtistVehicle {
  id: string;
  plateNumber: string;
  vehicleType: string | null;
  arrivalTime: string | null;
}

interface Artist {
  id: string;
  name: string;
  genre: string | null;
  status: string;
  fee: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  agentName: string | null;
  agentPhone: string | null;
  files: ArtistFile[];
  vehicles: ArtistVehicle[];
  timeSlots: ArtistTimeSlot[];
}

interface VendorVehicle {
  id: string;
  plateNumber: string;
  vehicleType: string | null;
  arrivalTime: string | null;
}

interface VendorFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  files: VendorFile[];
  vehicles: VendorVehicle[];
}

interface StageFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

interface StageTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  artist: { name: string } | null;
}

interface Stage {
  id: string;
  name: string;
  location: string | null;
  soundcheckStart: string | null;
  soundcheckEnd: string | null;
  performancesStart: string | null;
  performancesEnd: string | null;
  manager: { firstName: string; lastName: string } | null;
  files: StageFile[];
  timeSlots: StageTimeSlot[];
}

interface FestivalFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

interface Festival {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
}

interface Props {
  festivalId: string;
  festival: Festival;
  teamMembers: TeamMember[];
  artists: Artist[];
  vendors: Vendor[];
  stages: Stage[];
  festivalFiles: FestivalFile[];
  isAdmin: boolean;
  createFestivalFile: (festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteFestivalFile: (id: string, festivalId: string) => Promise<void>;
}

// ─── Aggregated file type ─────────────────────────────────────────────────────

type SourceType = "festival" | "artist" | "vendor" | "stage";

interface AggregatedFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
  source: SourceType;
  sourceName: string;
  sourceId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(s: string) {
  return s === "confirmed" ? "מאושר" : s === "pending" ? "ממתין" : s === "cancelled" ? "מבוטל" : s;
}

// ─── Document HTML generators ─────────────────────────────────────────────────

const docStyle = `
  body { font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 24px; color: #111; font-size: 13px; }
  h1 { font-size: 22px; margin-bottom: 4px; color: #4c1d95; }
  h2 { font-size: 15px; margin: 20px 0 8px; color: #6d28d9; border-bottom: 2px solid #ede9fe; padding-bottom: 4px; }
  .meta { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #6d28d9; color: white; padding: 6px 10px; text-align: right; font-size: 12px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  tr:nth-child(even) td { background: #f5f3ff; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 12px; font-size: 10px; font-weight: bold; }
  .confirmed { background: #d1fae5; color: #065f46; }
  .pending { background: #fef3c7; color: #92400e; }
  .cancelled { background: #fee2e2; color: #991b1b; }
  @media print { body { padding: 12px; } }
`;

function printDoc(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${docStyle}</style></head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function buildTeamDoc(festival: Festival, members: TeamMember[]) {
  const rows = members
    .map(
      (m) =>
        `<tr>
          <td>${m.firstName} ${m.lastName}</td>
          <td>${m.role.name}</td>
          <td>${m.phone ?? "—"}</td>
          <td>${m.email ?? "—"}</td>
          <td>${m.carNumber ?? "—"}</td>
        </tr>`
    )
    .join("");
  return `
    <h1>📋 רשימת צוות</h1>
    <div class="meta">${festival.name} · ${fmtDate(festival.startDate)} · ${festival.location} · הופק ב-${fmtDate(new Date().toISOString())}</div>
    <table>
      <thead><tr><th>שם</th><th>תפקיד</th><th>טלפון</th><th>אימייל</th><th>מספר רכב</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildCarsDoc(festival: Festival, members: TeamMember[], artists: Artist[], vendors: Vendor[]) {
  const teamRows = members
    .filter((m) => m.carNumber)
    .map((m) => `<tr><td>${m.firstName} ${m.lastName}</td><td>${m.role.name}</td><td>${m.carNumber}</td><td>—</td><td>—</td><td>צוות</td></tr>`)
    .join("");

  const artistRows = artists
    .flatMap((a) =>
      a.vehicles.map(
        (v) =>
          `<tr><td>${a.name}</td><td>אמן</td><td>${v.plateNumber}</td><td>${v.vehicleType ?? "—"}</td><td>${v.arrivalTime ?? "—"}</td><td>אמנים</td></tr>`
      )
    )
    .join("");

  const vendorRows = vendors
    .flatMap((v) =>
      v.vehicles.map(
        (vv) =>
          `<tr><td>${v.name}</td><td>${v.category}</td><td>${vv.plateNumber}</td><td>${vv.vehicleType ?? "—"}</td><td>${vv.arrivalTime ?? "—"}</td><td>ספקים</td></tr>`
      )
    )
    .join("");

  return `
    <h1>🚗 רשימת רכבים</h1>
    <div class="meta">${festival.name} · ${fmtDate(festival.startDate)} · הופק ב-${fmtDate(new Date().toISOString())}</div>
    <table>
      <thead><tr><th>שם</th><th>תפקיד / קטגוריה</th><th>מספר רכב</th><th>סוג רכב</th><th>שעת הגעה</th><th>מקור</th></tr></thead>
      <tbody>${teamRows}${artistRows}${vendorRows}</tbody>
    </table>`;
}

function buildArtistsDoc(festival: Festival, artists: Artist[]) {
  const rows = artists
    .map((a) => {
      const slot = a.timeSlots[0];
      const stageInfo = slot ? `${fmtTime(slot.startTime)}–${fmtTime(slot.endTime)} · ${slot.stage?.name ?? "—"}` : "—";
      return `<tr>
        <td>${a.name}</td>
        <td>${a.genre ?? "—"}</td>
        <td><span class="badge ${a.status}">${statusLabel(a.status)}</span></td>
        <td>${stageInfo}</td>
        <td>${a.fee != null ? `₪${a.fee.toLocaleString()}` : "—"}</td>
        <td>${a.contactPhone ?? a.agentPhone ?? "—"}</td>
      </tr>`;
    })
    .join("");
  return `
    <h1>🎤 רשימת אמנים</h1>
    <div class="meta">${festival.name} · ${fmtDate(festival.startDate)} · הופק ב-${fmtDate(new Date().toISOString())}</div>
    <table>
      <thead><tr><th>שם</th><th>ז'אנר</th><th>סטטוס</th><th>הופעה</th><th>שכר</th><th>טלפון</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildScheduleDoc(festival: Festival, stages: Stage[]) {
  const stageSections = stages
    .map((s) => {
      const slots = s.timeSlots.filter((ts) => ts.status !== "CANCELLED");
      const slotRows = slots
        .map(
          (ts) =>
            `<tr>
              <td>${fmtTime(ts.startTime)}</td>
              <td>${fmtTime(ts.endTime)}</td>
              <td>${ts.artist?.name ?? "—"}</td>
              <td>${ts.status === "COMPLETED" ? "הסתיים" : "מתוכנן"}</td>
            </tr>`
        )
        .join("");

      const meta = [
        s.soundcheckStart ? `בלאנסים: ${s.soundcheckStart}–${s.soundcheckEnd ?? "?"}` : null,
        s.performancesStart ? `הופעות: ${s.performancesStart}–${s.performancesEnd ?? "?"}` : null,
        s.manager ? `מנהל: ${s.manager.firstName} ${s.manager.lastName}` : null,
        s.location ? `מיקום: ${s.location}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return `
        <h2>🎪 ${s.name}</h2>
        ${meta ? `<div class="meta">${meta}</div>` : ""}
        ${
          slotRows
            ? `<table>
                <thead><tr><th>התחלה</th><th>סיום</th><th>אמן</th><th>סטטוס</th></tr></thead>
                <tbody>${slotRows}</tbody>
               </table>`
            : "<p style='color:#9ca3af;font-size:12px'>אין הופעות</p>"
        }`;
    })
    .join("");

  return `
    <h1>📅 לוז מסודר</h1>
    <div class="meta">${festival.name} · ${fmtDate(festival.startDate)}–${fmtDate(festival.endDate)} · ${festival.location} · הופק ב-${fmtDate(new Date().toISOString())}</div>
    ${stageSections}`;
}

// ─── Generate buttons section ──────────────────────────────────────────────────

function GenerateSection({
  festival,
  teamMembers,
  artists,
  vendors,
  stages,
}: {
  festival: Festival;
  teamMembers: TeamMember[];
  artists: Artist[];
  vendors: Vendor[];
  stages: Stage[];
}) {
  const docs = [
    {
      icon: "📋",
      label: "רשימת צוות",
      desc: `${teamMembers.length} אנשי צוות`,
      action: () => printDoc(buildTeamDoc(festival, teamMembers)),
    },
    {
      icon: "🚗",
      label: "רשימת רכבים",
      desc: `${
        teamMembers.filter((m) => m.carNumber).length +
        artists.reduce((s, a) => s + a.vehicles.length, 0) +
        vendors.reduce((s, v) => s + v.vehicles.length, 0)
      } רכבים`,
      action: () => printDoc(buildCarsDoc(festival, teamMembers, artists, vendors)),
    },
    {
      icon: "🎤",
      label: "רשימת אמנים",
      desc: `${artists.length} אמנים`,
      action: () => printDoc(buildArtistsDoc(festival, artists)),
    },
    {
      icon: "📅",
      label: "לוז מסודר",
      desc: `${stages.length} במות`,
      action: () => printDoc(buildScheduleDoc(festival, stages)),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-1">יצירת מסמכים</h2>
      <p className="text-xs text-gray-500 mb-5">לחץ על מסמך להדפסה / שמירה כ-PDF</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {docs.map((d) => (
          <button
            key={d.label}
            onClick={d.action}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-violet-100 hover:border-violet-300 hover:bg-violet-50 transition group"
          >
            <span className="text-3xl">{d.icon}</span>
            <span className="font-medium text-sm text-gray-800 group-hover:text-violet-700">{d.label}</span>
            <span className="text-xs text-gray-400">{d.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── All Documents section ─────────────────────────────────────────────────────

const SOURCE_LABELS: Record<SourceType, string> = {
  festival: "פסטיבל",
  artist: "אמנים",
  vendor: "ספקים",
  stage: "במות",
};

const SOURCE_ICONS: Record<SourceType, string> = {
  festival: "🎪",
  artist: "🎤",
  vendor: "🏢",
  stage: "🎪",
};

const FILE_TYPE_ICONS: Record<string, string> = {
  contract: "📄",
  technical: "🔧",
  map: "🗺️",
  other: "📎",
};

function AllDocsSection({
  files,
  festivalId,
  isAdmin,
  onAddFestivalFile,
  onDeleteFestivalFile,
}: {
  files: AggregatedFile[];
  festivalId: string;
  isAdmin: boolean;
  onAddFestivalFile: (name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  onDeleteFestivalFile: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<SourceType | "all">("all");
  const [addingLink, setAddingLink] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const confirm = useConfirm();

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchSource = filterSource === "all" || f.source === filterSource;
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.sourceName.toLowerCase().includes(search.toLowerCase());
      return matchSource && matchSearch;
    });
  }, [files, search, filterSource]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: files.length, festival: 0, artist: 0, vendor: 0, stage: 0 };
    files.forEach((f) => { c[f.source] = (c[f.source] ?? 0) + 1; });
    return c;
  }, [files]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=festival", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const fileType = ext === "pdf" ? "contract" : ["doc", "docx"].includes(ext) ? "technical" : "other";
        await onAddFestivalFile(file.name, data.url, false, fileType);
        toast("הקובץ הועלה");
      } else {
        toast(data.error ?? "שגיאה בהעלאה", "error");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleAddLink() {
    if (!linkName || !linkUrl) return;
    await onAddFestivalFile(linkName, linkUrl, true, "other");
    setLinkName(""); setLinkUrl(""); setAddingLink(false);
    toast("הקישור נוסף");
  }

  async function handleDelete(file: AggregatedFile) {
    if (file.source !== "festival") return;
    const ok = await confirm(`למחוק את "${file.name}"?`);
    if (!ok) return;
    await onDeleteFestivalFile(file.id);
    toast("הקובץ נמחק");
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">כל המסמכים</h2>
          <p className="text-xs text-gray-500">{files.length} קבצים מכל המקורות</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <label className="text-xs text-violet-600 cursor-pointer hover:text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition">
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file).finally(() => { e.target.value = ""; });
                }}
              />
              {uploading ? "⏳ מעלה..." : "📎 העלה קובץ לפסטיבל"}
            </label>
            <button
              onClick={() => setAddingLink(!addingLink)}
              className="text-xs text-gray-500 hover:text-violet-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-violet-200 transition"
            >
              + קישור
            </button>
          </div>
        )}
      </div>

      {/* Add link form */}
      {addingLink && (
        <div className="mb-4 p-3 bg-violet-50 rounded-xl space-y-2">
          <input
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="שם המסמך"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            dir="ltr"
          />
          <div className="flex gap-2">
            <button onClick={handleAddLink} className="bg-violet-600 text-white px-3 py-1 rounded-lg text-xs">הוסף</button>
            <button onClick={() => { setAddingLink(false); setLinkName(""); setLinkUrl(""); }} className="text-gray-400 text-xs px-2">ביטול</button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם..."
          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
        />
        <div className="flex gap-1 flex-wrap">
          {(["all", "festival", "artist", "vendor", "stage"] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                filterSource === src
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              {src === "all" ? "הכל" : SOURCE_LABELS[src]} ({counts[src] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm">{search || filterSource !== "all" ? "לא נמצאו תוצאות" : "אין מסמכים עדיין"}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((f) => (
            <div key={`${f.source}-${f.id}`} className="flex items-center gap-3 py-2.5">
              <span className="text-xl shrink-0">{FILE_TYPE_ICONS[f.fileType ?? "other"] ?? "📎"}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-violet-600 hover:underline truncate block"
                >
                  {f.name}
                </a>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {SOURCE_ICONS[f.source]} {f.sourceName}
                  </span>
                  {f.isExternal && (
                    <span className="text-xs text-blue-400">קישור חיצוני</span>
                  )}
                  <span className="text-xs text-gray-300">{new Date(f.createdAt).toLocaleDateString("he-IL")}</span>
                </div>
              </div>
              {isAdmin && f.source === "festival" && (
                <button
                  onClick={() => handleDelete(f)}
                  className="text-gray-300 hover:text-red-400 transition text-sm shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentsClient({
  festivalId,
  festival,
  teamMembers,
  artists,
  vendors,
  stages,
  festivalFiles,
  isAdmin,
  createFestivalFile,
  deleteFestivalFile,
}: Props) {
  const { toast } = useToast();

  // Aggregate all files
  const allFiles: AggregatedFile[] = useMemo(() => {
    const list: AggregatedFile[] = [];

    festivalFiles.forEach((f) =>
      list.push({ ...f, source: "festival", sourceName: festival.name })
    );
    artists.forEach((a) =>
      a.files.forEach((f) =>
        list.push({ ...f, source: "artist", sourceName: a.name, sourceId: a.id })
      )
    );
    vendors.forEach((v) =>
      v.files.forEach((f) =>
        list.push({ ...f, source: "vendor", sourceName: v.name, sourceId: v.id })
      )
    );
    stages.forEach((s) =>
      s.files.forEach((f) =>
        list.push({ ...f, source: "stage", sourceName: s.name, sourceId: s.id })
      )
    );

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [festivalFiles, artists, vendors, stages, festival.name]);

  async function handleAddFestivalFile(name: string, url: string, isExternal: boolean, fileType: string) {
    await createFestivalFile(festivalId, name, url, isExternal, fileType);
  }

  async function handleDeleteFestivalFile(id: string) {
    await deleteFestivalFile(id, festivalId);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📁 מסמכים</h1>
        <p className="text-sm text-gray-500 mt-0.5">{allFiles.length} מסמכים סה"כ</p>
      </div>

      <GenerateSection
        festival={festival}
        teamMembers={teamMembers}
        artists={artists}
        vendors={vendors}
        stages={stages}
      />

      <AllDocsSection
        files={allFiles}
        festivalId={festivalId}
        isAdmin={isAdmin}
        onAddFestivalFile={handleAddFestivalFile}
        onDeleteFestivalFile={handleDeleteFestivalFile}
      />
    </div>
  );
}
