"use client";

import { useState } from "react";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

const ROLE_BADGE_COLORS = [
  "bg-violet-100 text-violet-800",
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-orange-100 text-orange-800",
  "bg-red-100 text-red-800",
  "bg-teal-100 text-teal-800",
];

interface TeamMemberRole {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: TeamMemberRole;
  email: string | null;
  phone: string | null;
  carNumber: string | null;
  notes: string | null;
}

interface TeamApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  carNumber: string | null;
  notes: string | null;
  createdAt: Date;
}

interface Props {
  festivalId: string;
  members: TeamMember[];
  roles: TeamMemberRole[];
  isAdmin: boolean;
  inviteToken: string | null;
  applications: TeamApplication[];
  createTeamMember: (formData: FormData) => Promise<void>;
  deleteTeamMember: (id: string, festivalId: string) => Promise<void>;
  updateTeamMember: (id: string, formData: FormData) => Promise<void>;
  createTeamRole: (formData: FormData) => Promise<void>;
  deleteTeamRole: (id: string, festivalId: string) => Promise<void>;
  generateInviteToken: (festivalId: string) => Promise<string>;
  approveTeamApplication: (applicationId: string, roleId: string) => Promise<void>;
  rejectTeamApplication: (applicationId: string) => Promise<void>;
}

export default function TeamClient({
  festivalId,
  members,
  roles,
  isAdmin,
  inviteToken: initialInviteToken,
  applications,
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
  createTeamRole,
  deleteTeamRole,
  generateInviteToken,
  approveTeamApplication,
  rejectTeamApplication,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [filterRoleId, setFilterRoleId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(initialInviteToken);
  const [copied, setCopied] = useState(false);
  const [approvingApplication, setApprovingApplication] = useState<TeamApplication | null>(null);
  const [approveRoleId, setApproveRoleId] = useState<string>("");

  const filtered = members.filter((m) => {
    if (filterRoleId !== "ALL" && m.role.id !== filterRoleId) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        (m.phone ?? "").includes(q) ||
        (m.carNumber ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.role.id] = (acc[m.role.id] || 0) + 1;
    return acc;
  }, {});

  const roleColorMap = Object.fromEntries(
    roles.map((r, i) => [r.id, ROLE_BADGE_COLORS[i % ROLE_BADGE_COLORS.length]])
  );

  const handleCopyLink = async () => {
    let token = inviteToken;
    if (!token) {
      token = await generateInviteToken(festivalId);
      setInviteToken(token);
    }
    const url = `${window.location.origin}/join/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!approvingApplication || !approveRoleId) return;
    await approveTeamApplication(approvingApplication.id, approveRoleId);
    setApprovingApplication(null);
    setApproveRoleId("");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">👥 צוות</h1>
          {isAdmin && applications.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {applications.length}
            </span>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyLink}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {copied ? "✓ הועתק!" : "🔗 לינק הצטרפות"}
            </button>
            <button
              onClick={() => setShowRoleManager(true)}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ⚙️ תפקידים
            </button>
            <button
              onClick={() => { setEditMember(null); setShowForm(true); }}
              className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              + הוסף איש צוות
            </button>
          </div>
        )}
      </div>

      {/* Pending Applications (admin only) */}
      {isAdmin && applications.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-amber-100 border-b border-amber-200">
            <h2 className="text-sm font-semibold text-amber-800">ממתינים לאישור ({applications.length})</h2>
          </div>
          <div className="divide-y divide-amber-100">
            {applications.map((app) => (
              <div key={app.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{app.firstName} {app.lastName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[app.phone, app.email, app.carNumber].filter(Boolean).join(" · ") || "אין פרטי קשר"}
                  </p>
                  {app.notes && <p className="text-xs text-gray-400 truncate max-w-xs">{app.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setApprovingApplication(app);
                      setApproveRoleId(roles[0]?.id ?? "");
                    }}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    אשר
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ message: `לדחות את ${app.firstName} ${app.lastName}?`, danger: true, confirmLabel: "דחה" });
                      if (ok) { await rejectTeamApplication(app.id); toast("הבקשה נדחתה"); }
                    }}
                    className="border border-red-200 text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    דחה
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterRoleId("ALL")}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterRoleId === "ALL" ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          הכל ({members.length})
        </button>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setFilterRoleId(role.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterRoleId === role.id ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {role.name} {roleCounts[role.id] ? `(${roleCounts[role.id]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או מס' רכב..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        isAdmin && members.length === 0 ? (
          <button
            onClick={() => roles.length === 0 ? setShowRoleManager(true) : (setEditMember(null), setShowForm(true))}
            className="w-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group"
          >
            <div className="text-4xl mb-2">👤</div>
            <p className="font-medium">
              {roles.length === 0 ? "הוסף תפקידים קודם דרך ⚙️ תפקידים" : "עדיין אין אנשי צוות"}
            </p>
            <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {roles.length === 0 ? "+ לחץ לניהול תפקידים" : "+ לחץ להוספת איש צוות"}
            </p>
          </button>
        ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">👤</div>
          <p className="font-medium">
            {members.length === 0 ? (roles.length === 0 ? "הוסף תפקידים קודם" : "עדיין אין אנשי צוות") : "לא נמצאו תוצאות"}
          </p>
        </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">שם</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">תפקיד</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">טלפון</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">אימייל</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">מס' רכב</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.firstName} {m.lastName}
                    {m.notes && <p className="text-xs text-gray-400 font-normal truncate max-w-[180px]">{m.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${roleColorMap[m.role.id] ?? "bg-gray-100 text-gray-600"}`}>
                      {m.role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{m.phone ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell truncate max-w-[160px]">{m.email ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono hidden sm:table-cell">{m.carNumber ?? <span className="text-gray-300">—</span>}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditMember(m); setShowForm(true); }}
                          className="text-gray-400 hover:text-violet-600 transition-colors text-sm px-2 py-1 rounded hover:bg-violet-50"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await confirm({ message: `למחוק את ${m.firstName} ${m.lastName}?`, danger: true, confirmLabel: "מחק" });
                            if (ok) { await deleteTeamMember(m.id, festivalId); toast("חבר הצוות נמחק"); }
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors text-sm px-2 py-1 rounded hover:bg-red-50"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Approve Application Modal */}
      {approvingApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovingApplication(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-sm p-4 sm:p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">אישור מועמד</h2>
              <button onClick={() => setApprovingApplication(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-700">
              <p className="font-medium">{approvingApplication.firstName} {approvingApplication.lastName}</p>
              {approvingApplication.phone && <p className="text-gray-500">{approvingApplication.phone}</p>}
              {approvingApplication.email && <p className="text-gray-500">{approvingApplication.email}</p>}
            </div>

            {roles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">יש להוסיף תפקידים קודם</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">בחר תפקיד *</label>
                  <select
                    value={approveRoleId}
                    onChange={(e) => setApproveRoleId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setApprovingApplication(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                  >
                    אשר והוסף לצוות
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Role Manager Modal */}
      {showRoleManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRoleManager(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-sm p-4 sm:p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">⚙️ ניהול תפקידים</h2>
              <button onClick={() => setShowRoleManager(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-2 mb-4">
              {roles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">אין תפקידים עדיין</p>
              ) : (
                roles.map((role) => {
                  const inUse = (roleCounts[role.id] ?? 0) > 0;
                  return (
                    <div key={role.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">{role.name}</span>
                      <div className="flex items-center gap-2">
                        {inUse && (
                          <span className="text-xs text-gray-400">{roleCounts[role.id]} אנשים</span>
                        )}
                        <button
                          onClick={async () => {
                            if (inUse) return;
                            const ok = await confirm({ message: `למחוק את התפקיד "${role.name}"?`, danger: true, confirmLabel: "מחק" });
                            if (ok) { await deleteTeamRole(role.id, festivalId); toast("התפקיד נמחק"); }
                          }}
                          disabled={inUse}
                          title={inUse ? "לא ניתן למחוק תפקיד עם אנשי צוות" : "מחק תפקיד"}
                          className={`text-sm px-2 py-1 rounded transition-colors ${inUse ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              action={async (fd) => {
                await createTeamRole(fd);
              }}
              className="flex gap-2"
            >
              <input type="hidden" name="festivalId" value={festivalId} />
              <input
                name="name"
                required
                placeholder="שם תפקיד חדש..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
              />
              <button
                type="submit"
                className="bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap"
              >
                + הוסף
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editMember ? "עריכת איש צוות" : "הוסף איש צוות"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {roles.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">יש להוסיף תפקידים קודם</p>
                <button
                  onClick={() => { setShowForm(false); setShowRoleManager(true); }}
                  className="mt-3 text-violet-600 text-sm font-medium hover:underline"
                >
                  פתח ניהול תפקידים ←
                </button>
              </div>
            ) : (
              <form
                action={async (fd) => {
                  if (editMember) {
                    await updateTeamMember(editMember.id, fd);
                  } else {
                    await createTeamMember(fd);
                  }
                  setShowForm(false);
                  setEditMember(null);
                }}
                className="space-y-4"
              >
                <input type="hidden" name="festivalId" value={festivalId} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי *</label>
                    <input
                      name="firstName"
                      required
                      defaultValue={editMember?.firstName ?? ""}
                      autoFocus
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה *</label>
                    <input
                      name="lastName"
                      required
                      defaultValue={editMember?.lastName ?? ""}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד *</label>
                  <select
                    name="roleId"
                    required
                    defaultValue={editMember?.role.id ?? roles[0]?.id ?? ""}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editMember?.phone ?? ""}
                    placeholder="050-0000000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editMember?.email ?? ""}
                    placeholder="name@email.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מספר רכב</label>
                  <input
                    name="carNumber"
                    defaultValue={editMember?.carNumber ?? ""}
                    placeholder="12-345-67"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={editMember?.notes ?? ""}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition">
                    {editMember ? "שמור שינויים" : "הוסף"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
