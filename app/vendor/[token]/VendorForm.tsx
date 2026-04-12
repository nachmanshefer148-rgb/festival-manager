"use client";

import { useState } from "react";

interface Contact {
  id?: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface Vehicle {
  id?: string;
  plateNumber: string;
  vehicleType: string;
  arrivalTime: string;
}

interface Props {
  token: string;
  initialContacts: { id: string; name: string; role: string | null; phone: string | null; email: string | null }[];
  initialVehicles: { id: string; plateNumber: string; vehicleType: string | null; arrivalTime: string | null }[];
  submitAction: (
    token: string,
    contacts: { name: string; role: string; phone: string; email: string }[],
    vehicles: { plateNumber: string; vehicleType: string; arrivalTime: string }[]
  ) => Promise<void>;
}

export default function VendorForm({ token, initialContacts, initialVehicles, submitAction }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(
    initialContacts.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
    }))
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>(
    initialVehicles.map((v) => ({
      id: v.id,
      plateNumber: v.plateNumber,
      vehicleType: v.vehicleType ?? "",
      arrivalTime: v.arrivalTime ?? "",
    }))
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addContact() {
    setContacts((prev) => [...prev, { name: "", role: "", phone: "", email: "" }]);
    setSaved(false);
  }

  function removeContact(i: number) {
    setContacts((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function updateContact(i: number, field: keyof Contact, value: string) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
    setSaved(false);
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, { plateNumber: "", vehicleType: "", arrivalTime: "" }]);
    setSaved(false);
  }

  function removeVehicle(i: number) {
    setVehicles((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function updateVehicle(i: number, field: keyof Vehicle, value: string) {
    setVehicles((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
    setSaved(false);
  }

  async function handleSave() {
    // Validate required fields
    for (const c of contacts) {
      if (!c.name.trim()) {
        setError("שם איש קשר הוא שדה חובה");
        return;
      }
    }
    for (const v of vehicles) {
      if (!v.plateNumber.trim()) {
        setError("מספר רישוי הוא שדה חובה");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await submitAction(
        token,
        contacts.map((c) => ({ name: c.name.trim(), role: c.role.trim(), phone: c.phone.trim(), email: c.email.trim() })),
        vehicles.map((v) => ({ plateNumber: v.plateNumber.trim(), vehicleType: v.vehicleType.trim(), arrivalTime: v.arrivalTime.trim() }))
      );
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition";

  return (
    <div className="space-y-8">
      {/* Contacts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-base">👤 אנשי קשר</h2>
          <button
            type="button"
            onClick={addContact}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            + הוסף
          </button>
        </div>

        {contacts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">
            לחץ "הוסף" להוספת איש קשר
          </p>
        )}

        <div className="space-y-4">
          {contacts.map((c, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-500">איש קשר {i + 1}</span>
                <button type="button" onClick={() => removeContact(i)} className="text-red-400 hover:text-red-600 text-xs">
                  הסר
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={c.name}
                  onChange={(e) => updateContact(i, "name", e.target.value)}
                  placeholder="שם מלא *"
                  className={inputCls}
                />
                <input
                  value={c.role}
                  onChange={(e) => updateContact(i, "role", e.target.value)}
                  placeholder="תפקיד"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={c.phone}
                  onChange={(e) => updateContact(i, "phone", e.target.value)}
                  placeholder="טלפון"
                  className={inputCls}
                  dir="ltr"
                />
                <input
                  value={c.email}
                  onChange={(e) => updateContact(i, "email", e.target.value)}
                  type="email"
                  placeholder="מייל"
                  className={inputCls}
                  dir="ltr"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vehicles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-base">🚗 רכבים</h2>
          <button
            type="button"
            onClick={addVehicle}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            + הוסף
          </button>
        </div>

        {vehicles.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">
            לחץ "הוסף" להוספת רכב
          </p>
        )}

        <div className="space-y-3">
          {vehicles.map((v, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-500">רכב {i + 1}</span>
                <button type="button" onClick={() => removeVehicle(i)} className="text-red-400 hover:text-red-600 text-xs">
                  הסר
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={v.plateNumber}
                  onChange={(e) => updateVehicle(i, "plateNumber", e.target.value)}
                  placeholder="מספר רישוי *"
                  className={inputCls}
                  dir="ltr"
                />
                <input
                  value={v.vehicleType}
                  onChange={(e) => updateVehicle(i, "vehicleType", e.target.value)}
                  placeholder="סוג רכב"
                  className={inputCls}
                />
                <input
                  value={v.arrivalTime}
                  onChange={(e) => updateVehicle(i, "arrivalTime", e.target.value)}
                  placeholder="שעת הגעה"
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
      >
        {saving ? "שומר..." : "שמור פרטים"}
      </button>

      {saved && (
        <div className="text-center py-2">
          <span className="text-green-600 text-sm font-medium">✓ הפרטים נשמרו בהצלחה!</span>
        </div>
      )}
    </div>
  );
}
