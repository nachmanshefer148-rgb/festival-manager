"use client";

import { useState } from "react";

interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  idNumber: string;
}

interface Vehicle {
  plateNumber: string;
  vehicleType: string;
  arrivalTime: string;
}

interface Props {
  token: string;
  initialData: {
    contactPhone: string;
    contactEmail: string;
    technicalRiderNotes: string;
    hospitalityRider: string;
  };
  submitAction: (
    token: string,
    data: {
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      technicalRiderNotes: string;
      hospitalityRider: string;
      notes: string;
      contacts: Contact[];
      vehicles: Vehicle[];
    }
  ) => Promise<void>;
}

function emptyContact(): Contact {
  return { name: "", role: "", phone: "", email: "", idNumber: "" };
}

function emptyVehicle(): Vehicle {
  return { plateNumber: "", vehicleType: "", arrivalTime: "" };
}

export default function ArtistForm({ token, initialData, submitAction }: Props) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState(initialData.contactPhone);
  const [contactEmail, setContactEmail] = useState(initialData.contactEmail);
  const [technicalRiderNotes, setTechnicalRiderNotes] = useState(initialData.technicalRiderNotes);
  const [hospitalityRider, setHospitalityRider] = useState(initialData.hospitalityRider);
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateContact(i: number, field: keyof Contact, value: string) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  function updateVehicle(i: number, field: keyof Vehicle, value: string) {
    setVehicles((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitAction(token, {
        contactName,
        contactPhone,
        contactEmail,
        technicalRiderNotes,
        hospitalityRider,
        notes,
        contacts: contacts.filter((c) => c.name.trim()),
        vehicles: vehicles.filter((v) => v.plateNumber.trim()),
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">הפרטים נשמרו!</h2>
        <p className="text-gray-500 text-sm">תודה, המארגן קיבל את הפרטים שלך.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* פרטי קשר ראשיים */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">פרטי קשר</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם איש קשר</label>
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
              placeholder="שם מלא"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
              placeholder="050-0000000" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
              placeholder="email@example.com" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
          </div>
        </div>
      </section>

      {/* אנשי קשר נוספים */}
      <section>
        <div className="flex items-center justify-between border-b pb-1 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">אנשי קשר נוספים</h3>
          <button type="button" onClick={() => setContacts((p) => [...p, emptyContact()])}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium">
            + הוסף
          </button>
        </div>
        {contacts.length === 0 ? (
          <p className="text-xs text-gray-400">לחץ "הוסף" כדי להוסיף אנשי קשר שמגיעים איתך</p>
        ) : (
          <div className="space-y-4">
            {contacts.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => setContacts((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-2 left-2 text-gray-300 hover:text-red-400 text-sm">✕</button>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">שם *</label>
                    <input type="text" value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)}
                      required className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">תפקיד</label>
                    <input type="text" value={c.role} onChange={(e) => updateContact(i, "role", e.target.value)}
                      placeholder="מנהל אמן"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">טלפון</label>
                    <input type="tel" dir="ltr" value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">ת.ז.</label>
                    <input type="text" dir="ltr" value={c.idNumber} onChange={(e) => updateContact(i, "idNumber", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-0.5">אימייל</label>
                    <input type="email" dir="ltr" value={c.email} onChange={(e) => updateContact(i, "email", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* רכבים */}
      <section>
        <div className="flex items-center justify-between border-b pb-1 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">רכבים</h3>
          <button type="button" onClick={() => setVehicles((p) => [...p, emptyVehicle()])}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium">
            + הוסף
          </button>
        </div>
        {vehicles.length === 0 ? (
          <p className="text-xs text-gray-400">לחץ "הוסף" כדי להוסיף רכבים שמגיעים לפסטיבל</p>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => setVehicles((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-2 left-2 text-gray-300 hover:text-red-400 text-sm">✕</button>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-0.5">לוחית רישוי *</label>
                    <input type="text" dir="ltr" value={v.plateNumber} onChange={(e) => updateVehicle(i, "plateNumber", e.target.value)}
                      required placeholder="12-345-67"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">סוג רכב</label>
                    <input type="text" value={v.vehicleType} onChange={(e) => updateVehicle(i, "vehicleType", e.target.value)}
                      placeholder="ואן, נגרר..."
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">שעת הגעה</label>
                    <input type="text" value={v.arrivalTime} onChange={(e) => updateVehicle(i, "arrivalTime", e.target.value)}
                      placeholder="08:00"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ריידר טכני */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">ריידר</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">דרישות טכניות</label>
            <textarea value={technicalRiderNotes} onChange={(e) => setTechnicalRiderNotes(e.target.value)}
              rows={4} placeholder="ציוד נדרש, מפרט טכני, הגדרות במה..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ריידר הכנסת אורחים</label>
            <textarea value={hospitalityRider} onChange={(e) => setHospitalityRider(e.target.value)}
              rows={3} placeholder="אוכל, שתייה, חדר הלבשה..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות נוספות</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="כל מה שחשוב לך שנדע..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none" />
          </div>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition disabled:opacity-60">
        {submitting ? "שולח..." : "שלח פרטים"}
      </button>
    </form>
  );
}
