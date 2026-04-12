"use client";

import { useRef, useState } from "react";
import { useToast } from "@/app/components/Toast";

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

interface ContactRow { name: string; role: string; phone: string; email: string; }
interface VehicleRow { plateNumber: string; vehicleType: string; arrivalTime: string; }

interface Props {
  festivalId: string;
  createArtist: (formData: FormData) => Promise<{ id: string }>;
  createArtistContact: (artistId: string, festivalId: string, fd: FormData) => Promise<void>;
  createArtistVehicle: (artistId: string, festivalId: string, fd: FormData) => Promise<void>;
  children?: React.ReactNode;
}

const emptyContact = (): ContactRow => ({ name: "", role: "", phone: "", email: "" });
const emptyVehicle = (): VehicleRow => ({ plateNumber: "", vehicleType: "", arrivalTime: "" });

export default function AddArtistModal({ festivalId, createArtist, createArtistContact, createArtistVehicle, children }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function updateContact(i: number, field: keyof ContactRow, val: string) {
    setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }
  function updateVehicle(i: number, field: keyof VehicleRow, val: string) {
    setVehicles((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setContacts([]);
    setVehicles([]);
    formRef.current?.reset();
  }

  async function handleSubmit(baseFormData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const { id: artistId } = await createArtist(baseFormData);

      // Create contacts
      for (const c of contacts) {
        if (!c.name.trim()) continue;
        const fd = new FormData();
        fd.append("name", c.name);
        fd.append("role", c.role);
        fd.append("phone", c.phone);
        fd.append("email", c.email);
        await createArtistContact(artistId, festivalId, fd);
      }

      // Create vehicles
      for (const v of vehicles) {
        if (!v.plateNumber.trim()) continue;
        const fd = new FormData();
        fd.append("plateNumber", v.plateNumber);
        fd.append("vehicleType", v.vehicleType);
        fd.append("arrivalTime", v.arrivalTime);
        await createArtistVehicle(artistId, festivalId, fd);
      }

      toast("האמן נוסף בהצלחה");
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בהוספת האמן");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {children ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">{children}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 transition-colors"
        >
          + הוסף אמן
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">הוסף אמן</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-5">
              <input type="hidden" name="festivalId" value={festivalId} />

              {/* ── פרטים בסיסיים ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם האמן / להקה *</label>
                <input name="name" required autoFocus placeholder="שם האמן" className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ז'אנר</label>
                  <input name="genre" placeholder="Rock, Techno, Jazz..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <select name="status" className={inputCls}>
                    <option value="confirmed">מאושר</option>
                    <option value="pending">ממתין</option>
                    <option value="cancelled">בוטל</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">סט (דק')</label>
                  <input name="setDuration" type="number" defaultValue={60} min={1} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">סאונדצ'ק</label>
                  <input name="soundcheckDuration" type="number" defaultValue={30} min={0} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">הפסקה</label>
                  <input name="breakAfter" type="number" defaultValue={15} min={0} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון ראשי</label>
                  <input name="contactPhone" type="tel" placeholder="050-0000000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל ראשי</label>
                  <input name="contactEmail" type="email" placeholder="artist@example.com" className={inputCls} />
                </div>
              </div>

              {/* ── אנשי קשר ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">אנשי קשר נוספים</p>
                  <button
                    type="button"
                    onClick={() => setContacts((p) => [...p, emptyContact()])}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                  >
                    + הוסף איש קשר
                  </button>
                </div>

                {contacts.length === 0 && (
                  <p className="text-xs text-gray-400">סוכן, מנהל, מנהל טכני...</p>
                )}

                <div className="space-y-2">
                  {contacts.map((c, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">איש קשר {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setContacts((p) => p.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-500 text-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)}
                          placeholder="שם *" className={inputCls}
                        />
                        <input
                          value={c.role} onChange={(e) => updateContact(i, "role", e.target.value)}
                          placeholder="תפקיד (סוכן, מנהל...)" className={inputCls}
                        />
                        <input
                          value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)}
                          type="tel" placeholder="טלפון" className={inputCls}
                        />
                        <input
                          value={c.email} onChange={(e) => updateContact(i, "email", e.target.value)}
                          type="email" placeholder="אימייל" className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── רכבים ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">רכבים</p>
                  <button
                    type="button"
                    onClick={() => setVehicles((p) => [...p, emptyVehicle()])}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                  >
                    + הוסף רכב
                  </button>
                </div>

                {vehicles.length === 0 && (
                  <p className="text-xs text-gray-400">אוטובוס הופעות, משאית ציוד...</p>
                )}

                <div className="space-y-2">
                  {vehicles.map((v, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">רכב {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setVehicles((p) => p.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-500 text-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          value={v.plateNumber} onChange={(e) => updateVehicle(i, "plateNumber", e.target.value)}
                          placeholder="לוחית רישוי *" className={inputCls}
                        />
                        <input
                          value={v.vehicleType} onChange={(e) => updateVehicle(i, "vehicleType", e.target.value)}
                          placeholder="סוג (אוטובוס, משאית...)" className={inputCls}
                        />
                        <input
                          value={v.arrivalTime} onChange={(e) => updateVehicle(i, "arrivalTime", e.target.value)}
                          placeholder="שעת הגעה" className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">
                  {submitting ? "שומר..." : "הוסף אמן"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
