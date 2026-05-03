export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { createFestival, updateFestival, logout } from "@/app/actions";
import Link from "next/link";
import FestivalList from "./FestivalList";
import { requireCurrentUserPage } from "@/lib/auth";

export default async function Home() {
  const user = await requireCurrentUserPage();
  const festivals = await prisma.festival.findMany({
    where:
      user.role === "SUPER_ADMIN"
        ? {}
        : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-violet-900 mb-2">🎵 Festival Manager</h1>
            <p className="text-gray-500 text-lg">
              שלום {user.name}, כאן מנהלים {isSuperAdmin ? "את כל הפסטיבלים במערכת" : "את הפסטיבלים שלך"}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {isSuperAdmin && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                מנהל מערכת
              </span>
            )}
            <span className="text-sm text-gray-500 font-medium">{user.email}</span>
            <Link href="/settings" className="text-sm text-gray-500 hover:text-violet-600 transition">
              ⚙️
            </Link>
            <form action={logout}>
              <button type="submit" className="text-sm text-gray-400 hover:text-gray-700 transition">
                יציאה
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isSuperAdmin ? "כל הפסטיבלים" : "הפסטיבלים שלך"}
            </h2>
            <FestivalList
              festivals={festivals}
              isAdmin={true}
              showOwners={isSuperAdmin}
              updateFestival={updateFestival}
            />
          </div>

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
        </div>
      </div>
    </div>
  );
}
