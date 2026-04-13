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

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const allUsers = isSuperAdmin
    ? await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

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

  async function adminSetPassword(formData: FormData) {
    "use server";

    const currentUser = await requireCurrentUserPage("settings");
    if (currentUser.role !== "SUPER_ADMIN") redirect("/settings?error=forbidden");

    const targetId = typeof formData.get("userId") === "string" ? (formData.get("userId") as string) : "";
    const newPassword = typeof formData.get("newPassword") === "string" ? (formData.get("newPassword") as string).trim() : "";

    if (!targetId || newPassword.length < 6) redirect("/settings?error=invalid");

    await prisma.user.update({
      where: { id: targetId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });

    redirect("/settings?msg=user-password-changed");
  }

  async function adminSetRole(formData: FormData) {
    "use server";

    const currentUser = await requireCurrentUserPage("settings");
    if (currentUser.role !== "SUPER_ADMIN") redirect("/settings?error=forbidden");

    const targetId = typeof formData.get("userId") === "string" ? (formData.get("userId") as string) : "";
    const role = formData.get("role") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";

    if (!targetId || targetId === currentUser.id) redirect("/settings?error=invalid");

    await prisma.user.update({ where: { id: targetId }, data: { role } });
    redirect("/settings?msg=role-changed");
  }

  const successMessage =
    msg === "password-changed" ? "הסיסמה עודכנה בהצלחה" :
    msg === "user-password-changed" ? "סיסמת המשתמש עודכנה" :
    msg === "role-changed" ? "ההרשאה עודכנה" : null;

  const errorMessage =
    error === "wrong" ? "הסיסמה הנוכחית שגויה" :
    error === "invalid" ? "הסיסמה החדשה חייבת להכיל לפחות 6 תווים" :
    error === "forbidden" ? "אין הרשאה לפעולה זו" : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-12" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-violet-900">⚙️ הגדרות חשבון</h1>
            <p className="text-gray-500 mt-1">ניהול החשבון האישי שלך</p>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
            חזרה לפסטיבלים
          </Link>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-4 py-3">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            {errorMessage}
          </div>
        )}

        {/* פרטי חשבון */}
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-2">פרטי חשבון</h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">שם:</span> {user.name}</p>
            <p><span className="font-medium text-gray-800">אימייל:</span> {user.email}</p>
            <p>
              <span className="font-medium text-gray-800">הרשאה:</span>{" "}
              {isSuperAdmin ? "מנהל מערכת" : "משתמש"}
            </p>
          </div>
        </div>

        {/* שינוי סיסמה אישית */}
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

        {/* ניהול משתמשים — super admin בלבד */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-1">ניהול משתמשים</h2>
            <p className="text-xs text-gray-400 mb-5">גלוי למנהל מערכת בלבד</p>

            <div className="space-y-4">
              {allUsers.map((u) => (
                <details key={u.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition select-none">
                    <div>
                      <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                      <span className="text-gray-400 text-xs mr-2">{u.email}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === "SUPER_ADMIN"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {u.role === "SUPER_ADMIN" ? "מנהל מערכת" : "משתמש"}
                    </span>
                  </summary>

                  <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100 bg-gray-50">
                    {/* איפוס סיסמה ישיר */}
                    <form action={adminSetPassword} className="space-y-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <label className="block text-xs font-medium text-gray-600">איפוס סיסמה</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          name="newPassword"
                          required
                          minLength={6}
                          placeholder="סיסמה חדשה (לפחות 6 תווים)"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                        />
                        <button
                          type="submit"
                          className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700 transition whitespace-nowrap"
                        >
                          אפס
                        </button>
                      </div>
                    </form>

                    {/* שינוי הרשאה */}
                    {u.id !== user.id && (
                      <form action={adminSetRole} className="space-y-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <label className="block text-xs font-medium text-gray-600">שינוי הרשאה</label>
                        <div className="flex gap-2 items-center">
                          <select
                            name="role"
                            defaultValue={u.role}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                          >
                            <option value="USER">משתמש</option>
                            <option value="SUPER_ADMIN">מנהל מערכת</option>
                          </select>
                          <button
                            type="submit"
                            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition whitespace-nowrap"
                          >
                            שמור
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
