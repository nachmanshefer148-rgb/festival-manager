export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/auth";
import bcrypt from "bcryptjs";
import Link from "next/link";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const role = await getRole();
  if (role !== "admin") redirect("/login?from=settings");

  const { msg, error } = await searchParams;
  const settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
  if (!settings) redirect("/setup");

  async function toggleBudget(formData: FormData) {
    "use server";
    if ((await getRole()) !== "admin") redirect("/login?from=settings");
    const show = formData.get("showBudget") === "true";
    await prisma.appSettings.update({ where: { id: "global" }, data: { showBudget: show } });
    revalidateTag("app-settings", "max");
    redirect("/settings?msg=saved");
  }

  async function changePassword(formData: FormData) {
    "use server";
    if ((await getRole()) !== "admin") redirect("/login?from=settings");
    const settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
    if (!settings) redirect("/setup");

    const target = formData.get("target") as "admin" | "viewer";
    const current = formData.get("current") as string;
    const newPass = formData.get("new") as string;
    if (target !== "admin" && target !== "viewer") redirect("/settings?error=wrong");
    if (!current || newPass.trim().length < 4) redirect("/settings?error=wrong");

    const hash = target === "admin" ? settings.adminPassword : settings.viewerPassword;
    const match = await bcrypt.compare(current, hash);
    if (!match) redirect("/settings?error=wrong");

    const newHash = await bcrypt.hash(newPass, 10);
    await prisma.appSettings.update({
      where: { id: "global" },
      data: target === "admin" ? { adminPassword: newHash } : { viewerPassword: newHash },
    });
    redirect("/settings?msg=password-changed");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition text-sm">← חזרה</Link>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ הגדרות מערכת</h1>
        </div>

        {msg === "saved" && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">נשמר בהצלחה ✓</div>
        )}
        {msg === "password-changed" && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">הסיסמה שונתה ✓</div>
        )}
        {error === "wrong" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">הסיסמה הנוכחית שגויה</div>
        )}

        {/* Budget visibility */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">הרשאות צופה מוגבל</h2>
          <form action={toggleBudget} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700 text-sm">הצג תקציב לצופה מוגבל</p>
              <p className="text-xs text-gray-400 mt-0.5">מי שנכנס ללא סיסמה יראה את עמוד התקציב</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                <input type="radio" name="showBudget" value="true" defaultChecked={settings.showBudget} className="accent-violet-600" />
                כן
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                <input type="radio" name="showBudget" value="false" defaultChecked={!settings.showBudget} className="accent-violet-600" />
                לא
              </label>
              <button type="submit" className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700 transition">
                שמור
              </button>
            </div>
          </form>
        </div>

        {/* Change passwords */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">שינוי סיסמאות</h2>
          <form action={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שינוי סיסמה של</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input type="radio" name="target" value="admin" defaultChecked className="accent-violet-600" />
                  מנהל
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input type="radio" name="target" value="viewer" className="accent-violet-600" />
                  צופה
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
              <input
                type="password"
                name="current"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
              <input
                type="password"
                name="new"
                required
                minLength={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
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
