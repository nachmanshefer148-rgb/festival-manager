"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import VehicleScanner from "./VehicleScanner";

interface Vehicle {
  id: string;
  driverName: string;
  plate: string;
  notes: string | null;
  vendorId: string | null;
  vendor: { id: string; name: string } | null;
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Props {
  festivalId: string;
  festivalName: string;
  festivalStartDate: string;
  festivalEndDate: string;
  vehicles: Vehicle[];
  vendors: Vendor[];
  isAdmin: boolean;
  createVehicle: (festivalId: string, formData: FormData) => Promise<void>;
  updateVehicle: (id: string, festivalId: string, formData: FormData) => Promise<void>;
  deleteVehicle: (id: string, festivalId: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function VehicleClient({
  festivalId,
  festivalName,
  festivalStartDate,
  festivalEndDate,
  vehicles: initialVehicles,
  vendors,
  isAdmin,
  createVehicle,
  updateVehicle,
  deleteVehicle,
}: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [showAdd, setShowAdd] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [printVehicle, setPrintVehicle] = useState<Vehicle | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createVehicle(festivalId, fd);
      // Re-fetch by reloading
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editVehicle) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateVehicle(editVehicle.id, festivalId, fd);
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("למחוק את הרכב?")) return;
    await deleteVehicle(id, festivalId);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  function handlePrint(vehicle: Vehicle) {
    setPrintVehicle(vehicle);
    setTimeout(() => window.print(), 300);
  }

  const vehicleUrl = (id: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/festivals/${festivalId}/vehicles/scan?id=${id}`;

  return (
    <>
      {/* Print area — hidden on screen */}
      {printVehicle && (
        <div
          ref={printRef}
          id="print-area"
          className="hidden print:block"
          dir="rtl"
          style={{ fontFamily: "sans-serif", padding: "32px", maxWidth: "600px", margin: "0 auto" }}
        >
          <div style={{ textAlign: "center", borderBottom: "2px solid #7c3aed", paddingBottom: "16px", marginBottom: "24px" }}>
            <h1 style={{ color: "#7c3aed", fontSize: "24px", margin: 0 }}>{festivalName}</h1>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0 0" }}>
              {formatDate(festivalStartDate)} – {formatDate(festivalEndDate)}
            </p>
          </div>

          <h2 style={{ fontSize: "18px", color: "#111827", marginBottom: "4px" }}>אישור כניסה לרכב</h2>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: "bold", color: "#374151", width: "40%" }}>שם נהג:</td>
                <td style={{ padding: "8px 0", fontSize: "20px", fontWeight: "700" }}>{printVehicle.driverName}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: "bold", color: "#374151" }}>לוחית רישוי:</td>
                <td style={{ padding: "8px 0", fontSize: "24px", fontWeight: "800", letterSpacing: "0.05em" }} dir="ltr">
                  {printVehicle.plate}
                </td>
              </tr>
              {printVehicle.vendor && (
                <tr>
                  <td style={{ padding: "8px 0", fontWeight: "bold", color: "#374151" }}>ספק / חברה:</td>
                  <td style={{ padding: "8px 0", fontSize: "16px" }}>{printVehicle.vendor.name}</td>
                </tr>
              )}
              {printVehicle.notes && (
                <tr>
                  <td style={{ padding: "8px 0", fontWeight: "bold", color: "#374151" }}>הערות:</td>
                  <td style={{ padding: "8px 0", fontSize: "14px", color: "#6b7280" }}>{printVehicle.notes}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <QRCodeSVG value={vehicleUrl(printVehicle.id)} size={160} />
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>
            מזהה: {printVehicle.id}
          </p>
        </div>
      )}

      {/* Main UI */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">🚗 רכבים</h1>
            {vehicles.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {vehicles.length}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
            >
              📷 סרוק QR
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition"
              >
                + הוסף רכב
              </button>
            )}
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🚗</div>
            <p className="text-lg font-medium">עדיין אין רכבים</p>
            {isAdmin && <p className="text-sm mt-1">הוסף רכב ראשון כדי להתחיל</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{v.driverName}</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded" dir="ltr">{v.plate}</span>
                    {v.vendor && (
                      <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
                        {v.vendor.name}
                      </span>
                    )}
                  </div>
                  {v.notes && <p className="text-xs text-gray-400 mt-1">{v.notes}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => handlePrint(v)}
                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                    title="הדפס אישור"
                  >
                    🖨️
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setEditVehicle(v)}
                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                        title="עריכה"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="מחק"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="הוסף רכב" onClose={() => setShowAdd(false)}>
          <VehicleForm
            vendors={vendors}
            onSubmit={handleCreate}
            submitting={submitting}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editVehicle && (
        <Modal title="עריכת רכב" onClose={() => setEditVehicle(null)}>
          <VehicleForm
            vendors={vendors}
            initial={editVehicle}
            onSubmit={handleUpdate}
            submitting={submitting}
            onCancel={() => setEditVehicle(null)}
          />
        </Modal>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <Modal title="סרוק QR רכב" onClose={() => setShowScanner(false)}>
          <VehicleScanner festivalId={festivalId} onClose={() => setShowScanner(false)} />
        </Modal>
      )}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function VehicleForm({
  vendors,
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  vendors: Vendor[];
  initial?: Vehicle;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  submitting: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם נהג *</label>
        <input
          name="driverName"
          required
          defaultValue={initial?.driverName}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">לוחית רישוי *</label>
        <input
          name="plate"
          required
          dir="ltr"
          defaultValue={initial?.plate}
          placeholder="12-345-67"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ספק / חברה</label>
        <select
          name="vendorId"
          defaultValue={initial?.vendorId ?? ""}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        >
          <option value="">ללא ספק</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
        <input
          name="notes"
          defaultValue={initial?.notes ?? ""}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">
          ביטול
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60"
        >
          {submitting ? "שומר..." : "שמור"}
        </button>
      </div>
    </form>
  );
}
