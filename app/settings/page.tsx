export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const user = await requireCurrentUserPage("settings");
  const { msg, error } = await searchParams;

  async function changePassword(formData: FormData) {
    "use server";

    const currentUser = await requireCurrentUserPage("settings");
    const current = typeof formData.get("current") === "string" ? (formData.get("current") as string) : "";
    const nextPassword = typeof formData.get("new") === "string" ? (formData.get("new") as string).trim() : "";

    if (!current || nextPassword.length < 6) {
      redirect("/settings?error=invalid");
    }

    const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: currentUser.id } });
    const match = await bcrypt.compare(current, fullUser.passwordHash);
    if (!match) redirect("/settings?error=wrong");

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: await bcrypt.hash(nextPassword, 10) },
    });

    redirect("/settings?msg=password-changed");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-violet-900">⚙️ הגדרות חשבון</h1>
            <p className="text-gray-500 mt-1">ניהול החשבון האישי שלך</p>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
            חזרה לפסטיבלים
          </Link>
        </div>

        {msg === "password-changed" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-4 py-3">
            הסיסמה עודכנה בהצלחה
          </div>
        )}

        {(error === "wrong" || error === "invalid") && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            {error === "wrong" ? "הסיסמה הנוכחית שגויה" : "הסיסמה החדשה חייבת להכיל לפחות 6 תווים"}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-2">פרטי חשבון</h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">שם:</span> {user.name}</p>
            <p><span className="font-medium text-gray-800">אימייל:</span> {user.email}</p>
            <p>
              <span className="font-medium text-gray-800">הרשאה:</span>{" "}
              {user.role === "SUPER_ADMIN" ? "מנהל מערכת" : "משתמש"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">שינוי סיסמה</h2>
          <form action={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
              <input type="password" name="current" required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
              <input type="password" name="new" required minLength={6} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition">
              שנה סיסמה
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
