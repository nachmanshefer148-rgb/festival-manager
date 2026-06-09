"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { Search, X, Pencil, Trash2, Link2, Plus, Check, LayoutGrid, List } from "lucide-react";

// ─── Normalized types ─────────────────────────────────────────────────────────

export interface EntityContact { id: string; name: string; role: string | null; phone: string | null; email: string | null; }
export interface EntityVehicle { id: string; plateNumber: string; vehicleType: string | null; arrivalTime: string | null; }
export interface EntityPayment { id: string; description: string; amount: number; dueDate: string | null; isPaid: boolean; budgetItemId: string | null; }
export interface EntityFile { id: string; name: string; url: string; isExternal: boolean; fileType: string | null; createdAt: string; }

export interface EntitySummary {
  id: string; name: string; category: string; notes: string | null; token: string;
  createdAt: string; festivalId: string;
  _count: { contacts: number; vehicles: number; payments: number; files: number };
}

export interface EntityDetails extends EntitySummary {
  contacts: EntityContact[];
  vehicles: EntityVehicle[];
  payments: EntityPayment[];
  files: EntityFile[];
}

export interface EntityApplication {
  id: string; name: string; category: string;
  contactName: string | null; contactPhone: string | null; contactEmail: string | null;
  notes: string | null; createdAt: string;
}

export interface EntityConfig {
  singularLabel: string;
  pluralLabel: string;
  emptyIcon: string;
  tokenPathPrefix: string;
  uploadFolder: string;
  categories: Record<string, { label: string; color: string }>;
}

export interface EntityActions {
  create: (fd: FormData) => Promise<void>;
  update: (id: string, fd: FormData) => Promise<void>;
  delete: (id: string, festivalId: string) => Promise<void>;
  getDetails: (id: string, festivalId: string) => Promise<EntityDetails | null>;
  createContact: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteContact: (id: string, festivalId: string) => Promise<void>;
  createVehicle: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVehicle: (id: string, festivalId: string) => Promise<void>;
  createPayment: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  togglePayment: (id: string, festivalId: string) => Promise<void>;
  deletePayment: (id: string, festivalId: string) => Promise<void>;
  createFile: (entityId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteFile: (id: string, festivalId: string) => Promise<void>;
}

interface Props {
  festivalId: string;
  items: EntitySummary[];
  isAdmin: boolean;
  canAccessFiles?: boolean;
  showFinancials?: boolean;
  config: EntityConfig;
  actions: EntityActions;
  applications?: EntityApplication[];
  registrationToken?: string | null;
  generateRegistrationToken?: (festivalId: string) => Promise<string>;
  approveApplication?: (id: string, festivalId: string) => Promise<void>;
  rejectApplication?: (id: string, festivalId: string) => Promise<void>;
  extraHeaderButtons?: React.ReactNode;
}

type DetailTab = "contacts" | "vehicles" | "payments" | "files";

// ─── Main component ───────────────────────────────────────────────────────────

export default function EntityClient({
  festivalId, items, isAdmin,
  canAccessFiles = true, showFinancials = true,
  config, actions,
  applications = [], registrationToken: initialRegToken,
  generateRegistrationToken, approveApplication, rejectApplication,
  extraHeaderButtons,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  useEffect(() => {
    const stored = localStorage.getItem(`viewMode:${config.singularLabel}`);
    if (stored === "list" || stored === "cards") setViewMode(stored);
  }, [config.singularLabel]);

  function toggleView(mode: "cards" | "list") {
    setViewMode(mode);
    localStorage.setItem(`viewMode:${config.singularLabel}`, mode);
  }
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<EntitySummary | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<EntityDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("contacts");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [regToken, setRegToken] = useState<string | null>(initialRegToken ?? null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const addFormRef = useRef<HTMLFormElement>(null);

  const { singularLabel, pluralLabel, emptyIcon, tokenPathPrefix, categories } = config;

  const filtered = items
    .filter((i) => categoryFilter === "all" || i.category === categoryFilter)
    .filter((i) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return i.name.toLowerCase().includes(q) || (i.notes ?? "").toLowerCase().includes(q);
    });

  async function openDetail(item: EntitySummary) {
    setDetailId(item.id);
    setDetailTab("contacts");
    setDetailData(null);
    setDetailLoading(true);
    try {
      const data = await actions.getDetails(item.id, festivalId);
      setDetailData(data);
    } catch {
      toast(`שגיאה בטעינת פרטי ה${singularLabel}`, "error");
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshDetail() {
    if (!detailId) return;
    const data = await actions.getDetails(detailId, festivalId);
    setDetailData(data);
  }

  function copyLink(item: EntitySummary) {
    const url = `${window.location.origin}${tokenPathPrefix}${item.token}`;
    navigator.clipboard?.writeText(url).catch(() => fallbackCopy(url)) ?? fallbackCopy(url);
    setCopiedToken(item.id);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function handleCopyRegLink() {
    let token = regToken;
    if (!token && generateRegistrationToken) {
      token = await generateRegistrationToken(festivalId);
      setRegToken(token);
    }
    if (!token) return;
    const url = `${window.location.origin}/${singularLabel === "דוכן" ? "booth-register" : "vendor-register"}/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { fallbackCopy(url); }
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2000);
  }

  const detailSummary = detailId ? items.find((i) => i.id === detailId) : null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{pluralLabel}</h1>
          {isAdmin && applications.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{applications.length}</span>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            {extraHeaderButtons}
            {generateRegistrationToken && (
              <button onClick={handleCopyRegLink} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                {copiedGeneral ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
                {copiedGeneral ? "הועתק!" : "לינק רישום"}
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Plus size={16} />
              הוסף {singularLabel}
            </button>
          </div>
        )}
      </div>

      {/* Pending applications */}
      {isAdmin && applications.length > 0 && approveApplication && rejectApplication && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold text-amber-800 text-sm">בקשות רישום ממתינות ({applications.length})</h2>
          {applications.map((app) => {
            const cat = categories[app.category];
            return (
              <div key={app.id} className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{app.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ml-2 ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>{cat?.label ?? app.category}</span>
                    {app.contactName && <span>{app.contactName}</span>}
                    {app.contactPhone && <span className="mr-2" dir="ltr"> · {app.contactPhone}</span>}
                  </div>
                  {app.notes && <div className="text-xs text-gray-400 mt-0.5 truncate">{app.notes}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={async () => { await approveApplication(app.id, festivalId); toast(`ה${singularLabel} אושר ונוסף לרשימה`); }} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">אשר</button>
                  <button onClick={async () => {
                    const ok = await confirm({ message: `לדחות את בקשת "${app.name}"?`, danger: true, confirmLabel: "דחה" });
                    if (!ok) return;
                    await rejectApplication(app.id, festivalId);
                    toast("הבקשה נדחתה");
                  }} className="border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">דחה</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + Category filter + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder={`חפש ${pluralLabel}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-1.5 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap flex-1">
          {[{ key: "all", label: "הכל" }, ...Object.entries(categories).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
            <button key={key} onClick={() => setCategoryFilter(key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${categoryFilter === key ? "bg-violet-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden shrink-0">
          <button onClick={() => toggleView("cards")} title="תצוגת כרטיסים" className={`p-2 transition-colors ${viewMode === "cards" ? "bg-violet-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => toggleView("list")} title="תצוגת רשימה" className={`p-2 transition-colors border-r border-gray-200 ${viewMode === "list" ? "bg-violet-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Cards / List */}
      {filtered.length === 0 ? (
        isAdmin ? (
          <button onClick={() => setShowAdd(true)} className="w-full bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group">
            <div className="text-5xl mb-3">{emptyIcon}</div>
            <p className="text-sm font-medium">אין {pluralLabel} עדיין</p>
            <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספת {singularLabel} ראשון</p>
          </button>
        ) : (
          <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">{emptyIcon}</div><p className="text-sm">אין {pluralLabel} עדיין</p></div>
        )
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const cat = categories[item.category];
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(item)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base">{item.name}</h2>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>{cat?.label ?? item.category}</span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => copyLink(item)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-violet-100 text-gray-600 hover:text-violet-700 transition-colors" title="העתק לינק שאלון">
                      {copiedToken === item.id ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
                    </button>
                    {isAdmin && (
                      <button onClick={() => setEditItem(item)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="עריכה">
                        <Pencil size={14} />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={async () => {
                        const ok = await confirm({ message: `למחוק את ${item.name}?`, danger: true, confirmLabel: "מחק" });
                        if (!ok) return;
                        await actions.delete(item.id, festivalId);
                        toast(`ה${singularLabel} נמחק`);
                      }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors" title="מחיקה">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {item.notes && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.notes}</p>}
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{item._count.contacts} אנשי קשר</span>
                  <span>{item._count.vehicles} רכבים</span>
                  {showFinancials && item._count.payments > 0 && <span>{item._count.payments} תשלומים</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">שם</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">קטגוריה</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">אנשי קשר</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">רכבים</th>
                  {showFinancials && <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">תשלומים</th>}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const cat = categories[item.category];
                  return (
                    <tr key={item.id} onClick={() => openDetail(item)} className={`border-b border-gray-100 hover:bg-violet-50 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.name}
                        {item.notes && <p className="text-xs text-gray-400 font-normal truncate max-w-[200px]">{item.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>{cat?.label ?? item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item._count.contacts}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{item._count.vehicles}</td>
                      {showFinancials && <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item._count.payments}</td>}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => copyLink(item)} className="p-1.5 rounded-lg hover:bg-violet-100 text-gray-400 hover:text-violet-700 transition-colors" title="העתק לינק">
                            {copiedToken === item.id ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
                          </button>
                          {isAdmin && <button onClick={() => setEditItem(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="עריכה"><Pencil size={14} /></button>}
                          {isAdmin && <button onClick={async () => {
                            const ok = await confirm({ message: `למחוק את ${item.name}?`, danger: true, confirmLabel: "מחק" });
                            if (!ok) return;
                            await actions.delete(item.id, festivalId);
                            toast(`ה${singularLabel} נמחק`);
                          }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="מחיקה"><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal title={`הוסף ${singularLabel}`} onClose={() => setShowAdd(false)}>
          <form ref={addFormRef} action={async (fd) => {
            fd.set("festivalId", festivalId);
            try { await actions.create(fd); setShowAdd(false); addFormRef.current?.reset(); toast(`ה${singularLabel} נוסף`); }
            catch { toast(`שגיאה בהוספת ה${singularLabel}`, "error"); }
          }} className="space-y-4">
            <EntityForm categories={categories} />
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className={cancelBtnCls}>ביטול</button>
              <button type="submit" className={submitBtnCls}>הוסף {singularLabel}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title={`עריכת ${editItem.name}`} onClose={() => setEditItem(null)}>
          <form action={async (fd) => {
            try { await actions.update(editItem.id, fd); setEditItem(null); toast(`ה${singularLabel} עודכן`); }
            catch { toast(`שגיאה בעדכון ה${singularLabel}`, "error"); }
          }} className="space-y-4">
            <EntityForm categories={categories} defaults={editItem} />
            <div className="flex gap-2 justify-between pt-2">
              <button type="button" onClick={async () => {
                const ok = await confirm({ message: `למחוק את ${editItem.name}?`, danger: true, confirmLabel: "מחק" });
                if (!ok) return;
                await actions.delete(editItem.id, festivalId);
                setEditItem(null);
                toast(`ה${singularLabel} נמחק`);
              }} className="text-sm text-red-600 hover:text-red-700">מחק {singularLabel}</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditItem(null)} className={cancelBtnCls}>ביטול</button>
                <button type="submit" className={submitBtnCls}>שמור</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailSummary && (
        <Modal title={detailSummary.name} onClose={() => { setDetailId(null); setDetailData(null); }} wide>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <svg className="animate-spin h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              טוען...
            </div>
          ) : detailData ? (
            <>
              <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
                {([
                  { key: "contacts", label: `👤 אנשי קשר (${detailData.contacts.length})` },
                  { key: "vehicles", label: `🚗 רכבים (${detailData.vehicles.length})` },
                  ...(showFinancials ? [{ key: "payments" as DetailTab, label: `💳 תשלומים (${detailData.payments.length})` }] : []),
                  ...(canAccessFiles ? [{ key: "files" as DetailTab, label: `📎 קבצים (${detailData.files.length})` }] : []),
                ] as { key: DetailTab; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => setDetailTab(key)} className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${detailTab === key ? "bg-violet-50 text-violet-700 border-b-2 border-violet-600" : "text-gray-500 hover:text-gray-700"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {detailTab === "contacts" && <ContactsTab entity={detailData} festivalId={festivalId} isAdmin={isAdmin} createContact={async (id, fid, fd) => { await actions.createContact(id, fid, fd); await refreshDetail(); }} deleteContact={async (id, fid) => { await actions.deleteContact(id, fid); await refreshDetail(); }} />}
              {detailTab === "vehicles" && <VehiclesTab entity={detailData} festivalId={festivalId} isAdmin={isAdmin} createVehicle={async (id, fid, fd) => { await actions.createVehicle(id, fid, fd); await refreshDetail(); }} deleteVehicle={async (id, fid) => { await actions.deleteVehicle(id, fid); await refreshDetail(); }} />}
              {detailTab === "payments" && <PaymentsTab entity={detailData} festivalId={festivalId} isAdmin={isAdmin} createPayment={async (id, fid, fd) => { await actions.createPayment(id, fid, fd); await refreshDetail(); }} togglePayment={async (id, fid) => { await actions.togglePayment(id, fid); await refreshDetail(); }} deletePayment={async (id, fid) => { await actions.deletePayment(id, fid); await refreshDetail(); }} />}
              {canAccessFiles && detailTab === "files" && <FilesTab entity={detailData} festivalId={festivalId} isAdmin={isAdmin} uploadFolder={config.uploadFolder} createFile={async (id, fid, n, u, e, t) => { await actions.createFile(id, fid, n, u, e, t); await refreshDetail(); }} deleteFile={async (id, fid) => { await actions.deleteFile(id, fid); await refreshDetail(); }} />}
            </>
          ) : null}
        </Modal>
      )}
    </div>
  );
}

// ─── EntityForm (shared add/edit form) ───────────────────────────────────────

function EntityForm({ categories, defaults }: { categories: EntityConfig["categories"]; defaults?: EntitySummary }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם *</label>
        <input name="name" required placeholder="שם" defaultValue={defaults?.name} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה *</label>
        <select name="category" required defaultValue={defaults?.category} className={inputCls}>
          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
        <textarea name="notes" rows={2} className={inputCls} placeholder="מידע נוסף..." defaultValue={defaults?.notes ?? ""} />
      </div>
    </>
  );
}

// ─── ContactsTab ──────────────────────────────────────────────────────────────

function ContactsTab({ entity, festivalId, isAdmin, createContact, deleteContact }: {
  entity: EntityDetails; festivalId: string; isAdmin: boolean;
  createContact: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteContact: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      {entity.contacts.length === 0 && (isAdmin
        ? <button onClick={() => setShowForm(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">אין אנשי קשר — לחץ להוספה</button>
        : <p className="text-sm text-gray-400 text-center py-4">אין אנשי קשר</p>
      )}
      {entity.contacts.map((c) => (
        <div key={c.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div>
            <div className="font-medium text-sm text-gray-900">{c.name}</div>
            {c.role && <div className="text-xs text-gray-500">{c.role}</div>}
            <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
              {c.phone && <a href={`tel:${c.phone}`} className="hover:text-violet-600" dir="ltr">{c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="hover:text-violet-600">{c.email}</a>}
            </div>
          </div>
          {isAdmin && <button onClick={async () => {
            const ok = await confirm({ message: `למחוק את ${c.name}?`, danger: true, confirmLabel: "מחק" });
            if (!ok) return;
            await deleteContact(c.id, festivalId);
            toast("איש הקשר נמחק");
          }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" aria-label="מחק איש קשר"><X size={14} /></button>}
        </div>
      ))}
      {isAdmin && !showForm && <button onClick={() => setShowForm(true)} className={addRowBtnCls}>+ הוסף איש קשר</button>}
      {isAdmin && showForm && (
        <form ref={formRef} action={async (fd) => { await createContact(entity.id, festivalId, fd); formRef.current?.reset(); setShowForm(false); toast("איש הקשר נוסף"); }} className="bg-violet-50 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input name="name" required placeholder="שם *" className={inputSmCls} />
            <input name="role" placeholder="תפקיד" className={inputSmCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input name="phone" placeholder="טלפון" className={inputSmCls} dir="ltr" />
            <input name="email" type="email" placeholder="מייל" className={inputSmCls} dir="ltr" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className={cancelBtnCls}>ביטול</button>
            <button type="submit" className={submitBtnCls}>הוסף</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── VehiclesTab ──────────────────────────────────────────────────────────────

function VehiclesTab({ entity, festivalId, isAdmin, createVehicle, deleteVehicle }: {
  entity: EntityDetails; festivalId: string; isAdmin: boolean;
  createVehicle: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVehicle: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      {entity.vehicles.length === 0 && (isAdmin
        ? <button onClick={() => setShowForm(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">אין רכבים — לחץ להוספה</button>
        : <p className="text-sm text-gray-400 text-center py-4">אין רכבים</p>
      )}
      {entity.vehicles.map((v) => (
        <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div className="text-sm">
            <span className="font-mono font-medium text-gray-900" dir="ltr">{v.plateNumber}</span>
            {v.vehicleType && <span className="text-gray-500 mr-2">· {v.vehicleType}</span>}
            {v.arrivalTime && <span className="text-gray-500 mr-2">· הגעה: {v.arrivalTime}</span>}
          </div>
          {isAdmin && <button onClick={async () => {
            const ok = await confirm({ message: `למחוק רכב ${v.plateNumber}?`, danger: true, confirmLabel: "מחק" });
            if (!ok) return;
            await deleteVehicle(v.id, festivalId);
            toast("הרכב נמחק");
          }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" aria-label="מחק רכב"><X size={14} /></button>}
        </div>
      ))}
      {isAdmin && !showForm && <button onClick={() => setShowForm(true)} className={addRowBtnCls}>+ הוסף רכב</button>}
      {isAdmin && showForm && (
        <form ref={formRef} action={async (fd) => { await createVehicle(entity.id, festivalId, fd); formRef.current?.reset(); setShowForm(false); toast("הרכב נוסף"); }} className="bg-violet-50 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input name="plateNumber" required placeholder="מספר רישוי *" className={inputSmCls} dir="ltr" />
            <input name="vehicleType" placeholder="סוג (משאית, ואן...)" className={inputSmCls} />
            <input name="arrivalTime" placeholder="שעת הגעה" className={inputSmCls} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className={cancelBtnCls}>ביטול</button>
            <button type="submit" className={submitBtnCls}>הוסף</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── PaymentsTab ──────────────────────────────────────────────────────────────

function PaymentsTab({ entity, festivalId, isAdmin, createPayment, togglePayment, deletePayment }: {
  entity: EntityDetails; festivalId: string; isAdmin: boolean;
  createPayment: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  togglePayment: (id: string, festivalId: string) => Promise<void>;
  deletePayment: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const total = entity.payments.reduce((s, p) => s + p.amount, 0);
  const paid = entity.payments.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      {entity.payments.length === 0 && (isAdmin
        ? <button onClick={() => setShowForm(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">אין תשלומים — לחץ להוספה</button>
        : <p className="text-sm text-gray-400 text-center py-4">אין תשלומים</p>
      )}
      {entity.payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div className="flex items-center gap-3">
            {isAdmin && <input type="checkbox" checked={p.isPaid} onChange={async () => {
              if (!p.isPaid) { const ok = await confirm({ message: `לסמן "${p.description}" כשולם?`, confirmLabel: "סמן כשולם" }); if (!ok) return; }
              await togglePayment(p.id, festivalId);
              toast(p.isPaid ? "סומן כלא שולם" : "סומן כשולם");
            }} className="w-4 h-4 accent-violet-600 cursor-pointer" />}
            <div>
              <div className="text-sm font-medium text-gray-900">{p.description}</div>
              {p.dueDate && <div className="text-xs text-gray-400">{new Date(p.dueDate).toLocaleDateString("he-IL")}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${p.isPaid ? "text-green-600" : "text-gray-700"}`}>₪{p.amount.toLocaleString()}</span>
            {p.isPaid && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">שולם</span>}
            {isAdmin && <button onClick={async () => {
              const ok = await confirm({ message: `למחוק תשלום "${p.description}"?`, danger: true, confirmLabel: "מחק" });
              if (!ok) return;
              await deletePayment(p.id, festivalId);
              toast("התשלום נמחק");
            }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" aria-label="מחק תשלום"><X size={14} /></button>}
          </div>
        </div>
      ))}
      {entity.payments.length > 0 && (
        <div className="bg-violet-50 rounded-xl px-3 py-2 flex justify-between text-sm">
          <span className="text-gray-600">שולם: <strong className="text-green-600">₪{paid.toLocaleString()}</strong></span>
          <span className="text-gray-600">נותר: <strong className="text-red-600">₪{(total - paid).toLocaleString()}</strong></span>
          <span className="text-gray-600">סה"כ: <strong>₪{total.toLocaleString()}</strong></span>
        </div>
      )}
      {isAdmin && !showForm && <button onClick={() => setShowForm(true)} className={addRowBtnCls}>+ הוסף תשלום</button>}
      {isAdmin && showForm && (
        <form ref={formRef} action={async (fd) => { await createPayment(entity.id, festivalId, fd); formRef.current?.reset(); setShowForm(false); toast("התשלום נוסף"); }} className="bg-violet-50 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input name="description" required placeholder="תיאור *" className={inputSmCls} />
            <input name="amount" required type="number" min="0" step="0.01" placeholder="סכום ₪ *" className={inputSmCls} dir="ltr" />
            <input name="dueDate" type="date" className={inputSmCls} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className={cancelBtnCls}>ביטול</button>
            <button type="submit" className={submitBtnCls}>הוסף</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── FilesTab ─────────────────────────────────────────────────────────────────

function FilesTab({ entity, festivalId, isAdmin, uploadFolder, createFile, deleteFile }: {
  entity: EntityDetails; festivalId: string; isAdmin: boolean; uploadFolder: string;
  createFile: (entityId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteFile: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showUpload, setShowUpload] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkNameRef = useRef<HTMLInputElement>(null);
  const linkUrlRef = useRef<HTMLInputElement>(null);
  const linkTypeRef = useRef<HTMLSelectElement>(null);

  async function handleFileUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/upload?folder=${uploadFolder}`, { method: "POST", body: fd });
      if (!res.ok) { const { error } = await res.json(); alert(error); return; }
      const { url } = await res.json();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const fileType = ext === "pdf" ? "contract" : ["xls", "xlsx"].includes(ext) ? "equipment" : "other";
      await createFile(entity.id, festivalId, file.name, url, false, fileType);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast("הקובץ הועלה");
    } finally { setUploading(false); }
  }

  async function handleAddLink() {
    const name = linkNameRef.current?.value.trim();
    const url = linkUrlRef.current?.value.trim();
    const fileType = linkTypeRef.current?.value ?? "other";
    if (!name || !url) return;
    await createFile(entity.id, festivalId, name, url, true, fileType);
    setShowLink(false);
    if (linkNameRef.current) linkNameRef.current.value = "";
    if (linkUrlRef.current) linkUrlRef.current.value = "";
    toast("הקישור נוסף");
  }

  const FILE_ICONS: Record<string, string> = { contract: "📄", equipment: "📋", other: "📎" };

  return (
    <div className="space-y-3">
      {entity.files.length === 0 && (isAdmin
        ? <button onClick={() => setShowUpload(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">אין קבצים — לחץ להעלאה</button>
        : <p className="text-sm text-gray-400 text-center py-4">אין קבצים</p>
      )}
      {entity.files.map((f) => (
        <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 hover:underline">
            <span>{FILE_ICONS[f.fileType ?? ""] ?? "📎"}</span>
            <span>{f.name}</span>
            {f.isExternal && <span className="text-xs text-gray-400">(קישור חיצוני)</span>}
          </a>
          {isAdmin && <button onClick={async () => {
            const ok = await confirm({ message: `למחוק את הקובץ "${f.name}"?`, danger: true, confirmLabel: "מחק" });
            if (!ok) return;
            await deleteFile(f.id, festivalId);
            toast("הקובץ נמחק");
          }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" aria-label="מחק קובץ"><X size={14} /></button>}
        </div>
      ))}
      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={() => { setShowUpload(!showUpload); setShowLink(false); }} className={addRowBtnCls}>📤 העלה קובץ</button>
          <button onClick={() => { setShowLink(!showLink); setShowUpload(false); }} className={addRowBtnCls}>🔗 הוסף קישור</button>
        </div>
      )}
      {showUpload && (
        <div className="bg-violet-50 rounded-xl p-3 space-y-2">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="text-sm w-full" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowUpload(false)} className={cancelBtnCls}>ביטול</button>
            <button type="button" onClick={handleFileUpload} disabled={uploading} className={submitBtnCls}>{uploading ? "מעלה..." : "העלה"}</button>
          </div>
        </div>
      )}
      {showLink && (
        <div className="bg-violet-50 rounded-xl p-3 space-y-2">
          <input ref={linkNameRef} placeholder="שם הקובץ" className={inputSmCls} />
          <input ref={linkUrlRef} type="url" placeholder="קישור (https://...)" className={inputSmCls} dir="ltr" />
          <select ref={linkTypeRef} className={inputSmCls}>
            <option value="contract">חוזה</option>
            <option value="equipment">רשימת ציוד</option>
            <option value="other">אחר</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowLink(false)} className={cancelBtnCls}>ביטול</button>
            <button type="button" onClick={handleAddLink} className={submitBtnCls}>הוסף</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-[95vw] sm:max-w-2xl" : "max-w-[95vw] sm:max-w-md"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" aria-label="סגור"><X size={18} /></button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); document.execCommand("copy");
  document.body.removeChild(ta);
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";
const inputSmCls = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition";
const submitBtnCls = "bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors";
const cancelBtnCls = "text-gray-500 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors";
const addRowBtnCls = "text-sm text-violet-600 hover:text-violet-700 font-medium border border-dashed border-violet-300 hover:border-violet-400 px-3 py-1.5 rounded-lg transition-colors";
