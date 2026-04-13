"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Festival {
  id: string;
  name: string;
  location: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  owner?: {
    name: string;
    email: string;
  } | null;
}

interface Props {
  festivals: Festival[];
  isAdmin: boolean;
  showOwners?: boolean;
  deleteFestival: (id: string) => Promise<void>;
  updateFestival: (id: string, fd: FormData) => Promise<void>;
}

export default function FestivalList({ festivals, isAdmin, showOwners = false, deleteFestival, updateFestival }: Props) {
  const [editFestival, setEditFestival] = useState<Festival | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function toDateInput(d: Date) {
    return new Date(d).toISOString().split("T")[0];
  }

  return (
    <>
      <div className="space-y-3">
        {festivals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🎪</div>
            <p className="text-lg font-medium">עדיין אין פסטיבלים</p>
            {isAdmin && <p className="text-sm mt-1">צור פסטיבל חדש כדי להתחיל</p>}
          </div>
        ) : (
          festivals.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <Link href={`/festivals/${f.id}`} className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg truncate">{f.name}</h3>
                <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4">
                  <span>📍 {f.location}</span>
                  <span>📅 {formatDate(f.startDate)} – {formatDate(f.endDate)}</span>
                  {showOwners && f.owner && (
                    <span>👤 {f.owner.name} · {f.owner.email}</span>
                  )}
                </div>
              </Link>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditFestival(f)}
                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="עריכה"
                  >
                    ✏️
                  </button>
                  <button
                    disabled={deleting === f.id}
                    onClick={async () => {
                      if (!window.confirm(`למחוק את הפסטיבל "${f.name}"?`)) return;
                      setDeleting(f.id);
                      try {
                        await deleteFestival(f.id);
                      } finally {
                        setDeleting(null);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="מחק"
                  >
                    🗑
                  </button>
                </div>
              )}
              <Link
                href={`/festivals/${f.id}`}
                className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shrink-0"
              >
                פתח
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editFestival && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditFestival(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">עריכת פסטיבל</h2>
              <button onClick={() => setEditFestival(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form
              action={async (fd) => {
                setSubmitting(true);
                try {
                  await updateFestival(editFestival.id, fd);
                  setEditFestival(null);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם הפסטיבל *</label>
                <input
                  name="name"
                  required
                  defaultValue={editFestival.name}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מיקום *</label>
                <input
                  name="location"
                  required
                  defaultValue={editFestival.location}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה *</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={toDateInput(editFestival.startDate)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך סיום *</label>
                <input
                  name="endDate"
                  type="date"
                  required
                  defaultValue={toDateInput(editFestival.endDate)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editFestival.description ?? ""}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditFestival(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
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
          </div>
        </div>
      )}
    </>
  );
}
