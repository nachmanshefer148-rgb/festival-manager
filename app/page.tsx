export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { createFestival, deleteFestival, updateFestival, logout } from "@/app/actions";
import Link from "next/link";
import FestivalList from "./FestivalList";
import { getRole } from "@/lib/auth";

export default async function Home() {
  const [festivals, role] = await Promise.all([
    prisma.festival.findMany({ orderBy: { startDate: "asc" } }),
    getRole(),
  ]);
  const isAdmin = role === "admin";
  const roleLabel = role === "admin" ? "מנהל" : role === "viewer" ? "צופה" : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-violet-900 mb-2">🎵 Festival Manager</h1>
            <p className="text-gray-500 text-lg">ניהול ותכנון פסטיבלים</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {roleLabel && (
              <span className="text-sm text-gray-500 font-medium">
                {roleLabel === "מנהל" ? "👤 מנהל" : "👁 צופה"}
              </span>
            )}
            {isAdmin && (
              <Link href="/settings" className="text-sm text-gray-500 hover:text-violet-600 transition">⚙️</Link>
            )}
            {role !== "limited" ? (
              <form action={logout}>
                <button type="submit" className="text-sm text-gray-400 hover:text-gray-700 transition">יציאה</button>
              </form>
            ) : (
              <Link href="/login" className="text-sm bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition">
                כניסה
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Festival List */}
          <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">הפסטיבלים שלך</h2>
            <FestivalList
              festivals={festivals}
              isAdmin={isAdmin}
              deleteFestival={deleteFestival}
              updateFestival={updateFestival}
            />
          </div>

          {/* Create Festival Form — admin only */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">פסטיבל חדש</h2>
              <form action={createFestival} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם הפסטיבל *</label>
                  <input
                    name="name"
                    required
                    placeholder="סאונדקאלר 2026"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מיקום *</label>
                  <input
                    name="location"
                    required
                    placeholder="פארק הירקון, תל אביב"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה *</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך סיום *</label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="פסטיבל המוזיקה הגדול של השנה..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
                >
                  צור פסטיבל
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
