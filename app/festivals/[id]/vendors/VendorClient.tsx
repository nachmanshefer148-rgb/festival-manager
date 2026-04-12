"use client";

import { useState, useRef } from "react";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  production: { label: "הפקה", color: "bg-violet-100 text-violet-700" },
  logistics: { label: "לוגיסטיקה", color: "bg-blue-100 text-blue-700" },
  food: { label: "מזון ומשקאות", color: "bg-green-100 text-green-700" },
  security: { label: "אבטחה/רפואה", color: "bg-red-100 text-red-700" },
};

interface VendorContact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
}

interface VendorVehicle {
  id: string;
  plateNumber: string;
  vehicleType: string | null;
  arrivalTime: string | null;
}

interface VendorPayment {
  id: string;
  description: string;
  amount: number;
  dueDate: string | null;
  isPaid: boolean;
  budgetItemId: string | null;
  vendorId: string;
}

interface VendorFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

// Summary vendor — only what's needed for the card list
interface Vendor {
  id: string;
  name: string;
  category: string;
  notes: string | null;
  vendorToken: string;
  createdAt: string;
  festivalId: string;
  _count: { contacts: number; vehicles: number; payments: number; files: number };
}

// Full vendor details — loaded on demand when modal opens
interface VendorDetails {
  id: string;
  name: string;
  category: string;
  notes: string | null;
  vendorToken: string;
  createdAt: string;
  festivalId: string;
  contacts: VendorContact[];
  vehicles: VendorVehicle[];
  payments: VendorPayment[];
  files: VendorFile[];
}

interface Props {
  festivalId: string;
  vendors: Vendor[];
  isAdmin: boolean;
  showFinancials?: boolean;
  createVendor: (fd: FormData) => Promise<void>;
  updateVendor: (id: string, fd: FormData) => Promise<void>;
  deleteVendor: (id: string, festivalId: string) => Promise<void>;
  getVendorDetails: (vendorId: string, festivalId: string) => Promise<VendorDetails | null>;
  createVendorContact: (vendorId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorContact: (id: string, festivalId: string) => Promise<void>;
  createVendorVehicle: (vendorId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorVehicle: (id: string, festivalId: string) => Promise<void>;
  createVendorPayment: (vendorId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleVendorPayment: (id: string, festivalId: string) => Promise<void>;
  deleteVendorPayment: (id: string, festivalId: string) => Promise<void>;
  createVendorFile: (vendorId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteVendorFile: (id: string, festivalId: string) => Promise<void>;
}

type DetailTab = "contacts" | "vehicles" | "payments" | "files";

export default function VendorClient({
  festivalId,
  vendors,
  isAdmin,
  showFinancials = true,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorDetails,
  createVendorContact,
  deleteVendorContact,
  createVendorVehicle,
  deleteVendorVehicle,
  createVendorPayment,
  toggleVendorPayment,
  deleteVendorPayment,
  createVendorFile,
  deleteVendorFile,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [detailVendorId, setDetailVendorId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<VendorDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("contacts");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const addFormRef = useRef<HTMLFormElement>(null);

  const filtered = categoryFilter === "all"
    ? vendors
    : vendors.filter((v) => v.category === categoryFilter);

  async function openDetail(vendor: Vendor) {
    setDetailVendorId(vendor.id);
    setDetailTab("contacts");
    setDetailData(null);
    setDetailLoading(true);
    try {
      const data = await getVendorDetails(vendor.id, festivalId);
      setDetailData(data);
    } catch {
      toast("שגיאה בטעינת פרטי הספק", "error");
      setDetailVendorId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshDetail() {
    if (!detailVendorId) return;
    const data = await getVendorDetails(detailVendorId, festivalId);
    setDetailData(data);
  }

  function closeDetail() {
    setDetailVendorId(null);
    setDetailData(null);
  }

  function copyLink(vendor: Vendor) {
    const url = `${window.location.origin}/vendor/${vendor.vendorToken}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
    setCopiedToken(vendor.id);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy");
    document.body.removeChild(ta);
  }

  const detailVendorSummary = detailVendorId ? vendors.find((v) => v.id === detailVendorId) : null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ספקים</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddVendor(true)}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            + הוסף ספק
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: "all", label: "הכל" }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v.label }))].map(
          ({ key, label }) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === key
                  ? "bg-violet-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Vendor cards */}
      {filtered.length === 0 ? (
        isAdmin ? (
          <button
            onClick={() => setShowAddVendor(true)}
            className="w-full bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group"
          >
            <div className="text-5xl mb-3">🏢</div>
            <p className="text-sm font-medium">אין ספקים עדיין</p>
            <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספת ספק ראשון</p>
          </button>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🏢</div>
            <p className="text-sm">אין ספקים עדיין</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => {
            const cat = CATEGORIES[vendor.category];

            return (
              <div
                key={vendor.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetail(vendor)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base">{vendor.name}</h2>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {cat?.label ?? vendor.category}
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyLink(vendor)}
                      className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-violet-100 text-gray-600 hover:text-violet-700 transition-colors"
                      title="העתק לינק שאלון"
                    >
                      {copiedToken === vendor.id ? "✓ הועתק" : "🔗 לינק"}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setEditVendor(vendor)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>

                {vendor.notes && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{vendor.notes}</p>
                )}

                <div className="flex gap-3 text-xs text-gray-500">
                  <span>👤 {vendor._count.contacts} אנשי קשר</span>
                  <span>🚗 {vendor._count.vehicles} רכבים</span>
                  {showFinancials && vendor._count.payments > 0 && (
                    <span>💳 {vendor._count.payments} תשלומים</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <Modal title="הוסף ספק" onClose={() => setShowAddVendor(false)}>
          <form
            ref={addFormRef}
            action={async (fd) => {
              fd.set("festivalId", festivalId);
              try {
                await createVendor(fd);
                setShowAddVendor(false);
                addFormRef.current?.reset();
                toast("הספק נוסף");
              } catch {
                toast("שגיאה בהוספת הספק", "error");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם הספק *</label>
              <input name="name" required placeholder="שם החברה" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה *</label>
              <select name="category" required className={inputCls}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea name="notes" rows={2} className={inputCls} placeholder="מידע נוסף..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddVendor(false)} className={cancelBtnCls}>ביטול</button>
              <button type="submit" className={submitBtnCls}>הוסף ספק</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Vendor Modal */}
      {editVendor && (
        <Modal title={`עריכת ${editVendor.name}`} onClose={() => setEditVendor(null)}>
          <form
            action={async (fd) => {
              try {
                await updateVendor(editVendor.id, fd);
                setEditVendor(null);
                toast("הספק עודכן");
              } catch {
                toast("שגיאה בעדכון הספק", "error");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם הספק *</label>
              <input name="name" required defaultValue={editVendor.name} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה *</label>
              <select name="category" required defaultValue={editVendor.category} className={inputCls}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea name="notes" rows={2} className={inputCls} defaultValue={editVendor.notes ?? ""} />
            </div>
            <div className="flex gap-2 justify-between pt-2">
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({ message: `למחוק את ${editVendor.name}?`, danger: true, confirmLabel: "מחק" });
                  if (!ok) return;
                  await deleteVendor(editVendor.id, festivalId);
                  setEditVendor(null);
                  toast("הספק נמחק");
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                מחק ספק
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditVendor(null)} className={cancelBtnCls}>ביטול</button>
                <button type="submit" className={submitBtnCls}>שמור</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailVendorSummary && (
        <Modal title={detailVendorSummary.name} onClose={closeDetail} wide>
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
              {/* Tabs */}
              <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
                {([
                  { key: "contacts", label: `👤 אנשי קשר (${detailData.contacts.length})` },
                  { key: "vehicles", label: `🚗 רכבים (${detailData.vehicles.length})` },
                  ...(showFinancials ? [{ key: "payments" as DetailTab, label: `💳 תשלומים (${detailData.payments.length})` }] : []),
                  { key: "files", label: `📎 קבצים (${detailData.files.length})` },
                ] as { key: DetailTab; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      detailTab === key
                        ? "bg-violet-50 text-violet-700 border-b-2 border-violet-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {detailTab === "contacts" && (
                <ContactsTab
                  vendor={detailData}
                  festivalId={festivalId}
                  isAdmin={isAdmin}
                  createVendorContact={async (vid, fid, fd) => { await createVendorContact(vid, fid, fd); await refreshDetail(); }}
                  deleteVendorContact={async (id, fid) => { await deleteVendorContact(id, fid); await refreshDetail(); }}
                />
              )}
              {detailTab === "vehicles" && (
                <VehiclesTab
                  vendor={detailData}
                  festivalId={festivalId}
                  isAdmin={isAdmin}
                  createVendorVehicle={async (vid, fid, fd) => { await createVendorVehicle(vid, fid, fd); await refreshDetail(); }}
                  deleteVendorVehicle={async (id, fid) => { await deleteVendorVehicle(id, fid); await refreshDetail(); }}
                />
              )}
              {detailTab === "payments" && (
                <PaymentsTab
                  vendor={detailData}
                  festivalId={festivalId}
                  isAdmin={isAdmin}
                  createVendorPayment={async (vid, fid, fd) => { await createVendorPayment(vid, fid, fd); await refreshDetail(); }}
                  toggleVendorPayment={async (id, fid) => { await toggleVendorPayment(id, fid); await refreshDetail(); }}
                  deleteVendorPayment={async (id, fid) => { await deleteVendorPayment(id, fid); await refreshDetail(); }}
                />
              )}
              {detailTab === "files" && (
                <FilesTab
                  vendor={detailData}
                  festivalId={festivalId}
                  isAdmin={isAdmin}
                  createVendorFile={async (vid, fid, n, u, e, t) => { await createVendorFile(vid, fid, n, u, e, t); await refreshDetail(); }}
                  deleteVendorFile={async (id, fid) => { await deleteVendorFile(id, fid); await refreshDetail(); }}
                />
              )}
            </>
          ) : null}
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContactsTab({
  vendor, festivalId, isAdmin, createVendorContact, deleteVendorContact,
}: {
  vendor: VendorDetails;
  festivalId: string;
  isAdmin: boolean;
  createVendorContact: (vendorId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorContact: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      {vendor.contacts.length === 0 && (
        isAdmin ? (
          <button onClick={() => setShowForm(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">
            אין אנשי קשר — לחץ להוספה
          </button>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">אין אנשי קשר</p>
        )
      )}
      {vendor.contacts.map((c) => (
        <div key={c.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div>
            <div className="font-medium text-sm text-gray-900">{c.name}</div>
            {c.role && <div className="text-xs text-gray-500">{c.role}</div>}
            <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
              {c.phone && <a href={`tel:${c.phone}`} className="hover:text-violet-600" dir="ltr">{c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="hover:text-violet-600">{c.email}</a>}
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok = await confirm({ message: `למחוק את ${c.name}?`, danger: true, confirmLabel: "מחק" });
                if (!ok) return;
                await deleteVendorContact(c.id, festivalId);
                toast("איש הקשר נמחק");
              }}
              className="text-red-400 hover:text-red-600 text-xs ml-2 mt-0.5 p-1"
              aria-label={`מחק איש קשר ${c.name}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {isAdmin && !showForm && (
        <button onClick={() => setShowForm(true)} className={addRowBtnCls}>+ הוסף איש קשר</button>
      )}
      {isAdmin && showForm && (
        <form
          ref={formRef}
          action={async (fd) => {
            await createVendorContact(vendor.id, festivalId, fd);
            formRef.current?.reset();
            setShowForm(false);
            toast("איש הקשר נוסף");
          }}
          className="bg-violet-50 rounded-xl p-3 space-y-2"
        >
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

function VehiclesTab({
  vendor, festivalId, isAdmin, createVendorVehicle, deleteVendorVehicle,
}: {
  vendor: VendorDetails;
  festivalId: string;
  isAdmin: boolean;
  createVendorVehicle: (vendorId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorVehicle: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      {vendor.vehicles.length === 0 && (
        isAdmin ? (
          <button onClick={() => setShowForm(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">
            אין רכבים — לחץ להוספה
          </button>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">אין רכבים</p>
        )
      )}
      {vendor.vehicles.map((v) => (
        <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div className="text-sm">
            <span className="font-mono font-medium text-gray-900" dir="ltr">{v.plateNumber}</span>
            {v.vehicleType && <span className="text-gray-500 mr-2">· {v.vehicleType}</span>}
            {v.arrivalTime && <span className="text-gray-500 mr-2">· הגעה: {v.arrivalTime}</span>}
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok = await confirm({ message: `למחוק רכב ${v.plateNumber}?`, danger: true, confirmLabel: "מחק" });
                if (!ok) return;
                await deleteVendorVehicle(v.id, festivalId);
                toast("הרכב נמחק");
              }}
              className="text-red-400 hover:text-red-600 text-xs p-1"
              aria-label={`מחק רכב ${v.plateNumber}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {isAdmin && !showForm && (
        <button onClick={() => setShowForm(true)} className={addRowBtnCls}>+ הוסף רכב</button>
      )}
      {isAdmin && showForm && (
        <form
          ref={formRef}
          action={async (fd) => {
            await createVendorVehicle(vendor.id, festivalId, fd);
            formRef.current?.reset();
            setShowForm(false);
            toast("הרכב נוסף");
          }}
          className="bg-violet-50 rounded-xl p-3 space-y-2"
        >
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

function PaymentsTab({
  vendor, festivalId, isAdmin, createVendorPayment, toggleVendorPayment, deleteVendorPayment,
}: {
  vendor: VendorDetails;
  festivalId: string;
  isAdmin: boolean;
  createVendorPayment: (vendorId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleVendorPayment: (id: string, festivalId: string) => Promise<void>;
  deleteVendorPayment: (id: string, festivalId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const total = vendor.payments.reduce((s, p) => s + p.amount, 0);
  const paid = vendor.payments.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      {vendor.payments.length === 0 && (
        isAdmin ? (
          <button onClick={() => setShowForm(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">
            אין תשלומים — לחץ להוספה
          </button>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">אין תשלומים</p>
        )
      )}
      {vendor.payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <div className="flex items-center gap-3">
            {isAdmin && (
              <input
                type="checkbox"
                checked={p.isPaid}
                onChange={async () => {
                if (!p.isPaid) {
                  const ok = await confirm({ message: `לסמן "${p.description}" כשולם?`, confirmLabel: "סמן כשולם" });
                  if (!ok) return;
                }
                await toggleVendorPayment(p.id, festivalId);
                toast(p.isPaid ? "סומן כלא שולם" : "סומן כשולם");
              }}
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">{p.description}</div>
              {p.dueDate && (
                <div className="text-xs text-gray-400">
                  {new Date(p.dueDate).toLocaleDateString("he-IL")}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${p.isPaid ? "text-green-600" : "text-gray-700"}`}>
              ₪{p.amount.toLocaleString()}
            </span>
            {p.isPaid && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">שולם</span>}
            {isAdmin && (
              <button
                onClick={async () => {
                const ok = await confirm({ message: `למחוק תשלום "${p.description}"?`, danger: true, confirmLabel: "מחק" });
                if (!ok) return;
                await deleteVendorPayment(p.id, festivalId);
                toast("התשלום נמחק");
              }}
              className="text-red-400 hover:text-red-600 text-xs p-1"
              aria-label={`מחק תשלום ${p.description}`}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      {vendor.payments.length > 0 && (
        <div className="bg-violet-50 rounded-xl px-3 py-2 flex justify-between text-sm">
          <span className="text-gray-600">שולם: <strong className="text-green-600">₪{paid.toLocaleString()}</strong></span>
          <span className="text-gray-600">נותר: <strong className="text-red-600">₪{(total - paid).toLocaleString()}</strong></span>
          <span className="text-gray-600">סה"כ: <strong>₪{total.toLocaleString()}</strong></span>
        </div>
      )}

      {isAdmin && !showForm && (
        <button onClick={() => setShowForm(true)} className={addRowBtnCls}>+ הוסף תשלום</button>
      )}
      {isAdmin && showForm && (
        <form
          ref={formRef}
          action={async (fd) => {
            await createVendorPayment(vendor.id, festivalId, fd);
            formRef.current?.reset();
            setShowForm(false);
            toast("התשלום נוסף");
          }}
          className="bg-violet-50 rounded-xl p-3 space-y-2"
        >
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

function FilesTab({
  vendor, festivalId, isAdmin, createVendorFile, deleteVendorFile,
}: {
  vendor: VendorDetails;
  festivalId: string;
  isAdmin: boolean;
  createVendorFile: (vendorId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteVendorFile: (id: string, festivalId: string) => Promise<void>;
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
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json();
        alert(error);
        return;
      }
      const { url } = await res.json();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const fileType = ext === "pdf" ? "contract" : ["xls", "xlsx"].includes(ext) ? "equipment" : "other";
      await createVendorFile(vendor.id, festivalId, file.name, url, false, fileType);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast("הקובץ הועלה");
    } finally {
      setUploading(false);
    }
  }

  async function handleAddLink() {
    const name = linkNameRef.current?.value.trim();
    const url = linkUrlRef.current?.value.trim();
    const fileType = linkTypeRef.current?.value ?? "other";
    if (!name || !url) return;
    await createVendorFile(vendor.id, festivalId, name, url, true, fileType);
    setShowLink(false);
    if (linkNameRef.current) linkNameRef.current.value = "";
    if (linkUrlRef.current) linkUrlRef.current.value = "";
    toast("הקישור נוסף");
  }

  const FILE_ICONS: Record<string, string> = { contract: "📄", equipment: "📋", other: "📎" };

  return (
    <div className="space-y-3">
      {vendor.files.length === 0 && (
        isAdmin ? (
          <button onClick={() => setShowUpload(true)} className="w-full text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 transition-colors">
            אין קבצים — לחץ להעלאה
          </button>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">אין קבצים</p>
        )
      )}
      {vendor.files.map((f) => (
        <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 hover:underline"
          >
            <span>{FILE_ICONS[f.fileType ?? ""] ?? "📎"}</span>
            <span>{f.name}</span>
            {f.isExternal && <span className="text-xs text-gray-400">(קישור חיצוני)</span>}
          </a>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok = await confirm({ message: `למחוק את הקובץ "${f.name}"?`, danger: true, confirmLabel: "מחק" });
                if (!ok) return;
                await deleteVendorFile(f.id, festivalId);
                toast("הקובץ נמחק");
              }}
              className="text-red-400 hover:text-red-600 text-xs p-1"
              aria-label={`מחק קובץ ${f.name}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={() => { setShowUpload(!showUpload); setShowLink(false); }} className={addRowBtnCls}>
            📤 העלה קובץ
          </button>
          <button onClick={() => { setShowLink(!showLink); setShowUpload(false); }} className={addRowBtnCls}>
            🔗 הוסף קישור
          </button>
        </div>
      )}

      {showUpload && (
        <div className="bg-violet-50 rounded-xl p-3 space-y-2">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="text-sm w-full" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowUpload(false)} className={cancelBtnCls}>ביטול</button>
            <button type="button" onClick={handleFileUpload} disabled={uploading} className={submitBtnCls}>
              {uploading ? "מעלה..." : "העלה"}
            </button>
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

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-[95vw] sm:max-w-2xl" : "max-w-[95vw] sm:max-w-md"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

const inputSmCls =
  "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition";

const submitBtnCls =
  "bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors";

const cancelBtnCls =
  "text-gray-500 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors";

const addRowBtnCls =
  "text-sm text-violet-600 hover:text-violet-700 font-medium border border-dashed border-violet-300 hover:border-violet-400 px-3 py-1.5 rounded-lg transition-colors";
