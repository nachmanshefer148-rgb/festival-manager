export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export default async function SetupPage() {
  const existing = await prisma.appSettings.findUnique({ where: { id: "global" } });
  if (existing) redirect("/login");

  async function setup(formData: FormData) {
    "use server";
    const existing = await prisma.appSettings.findUnique({ where: { id: "global" } });
    if (existing) redirect("/");

    const adminPassword = formData.get("adminPassword") as string;
    const viewerPassword = formData.get("viewerPassword") as string;

    const [adminHash, viewerHash] = await Promise.all([
      bcrypt.hash(adminPassword, 10),
      bcrypt.hash(viewerPassword, 10),
    ]);

    await prisma.appSettings.create({
      data: { id: "global", adminPassword: adminHash, viewerPassword: viewerHash },
    });

    await setSessionCookie("admin");
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎵</div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרה ראשונית</h1>
          <p className="text-gray-500 text-sm mt-1">הגדר סיסמאות לכניסה למערכת</p>
        </div>

        <form action={setup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמת מנהל *</label>
            <input
              type="password"
              name="adminPassword"
              required
              minLength={4}
              autoFocus
              placeholder="לפחות 4 תווים"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
            <p className="text-xs text-gray-400 mt-1">גישה מלאה לעריכה ולהגדרות</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמת צופה *</label>
            <input
              type="password"
              name="viewerPassword"
              required
              minLength={4}
              placeholder="לפחות 4 תווים"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
            <p className="text-xs text-gray-400 mt-1">צפייה מלאה ללא עריכה</p>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
          >
            הגדר וכנס כמנהל
          </button>
        </form>
      </div>
    </div>
  );
}
