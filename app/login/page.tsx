export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  const settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
  if (!settings) redirect("/setup");

  async function login(formData: FormData) {
    "use server";
    const settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
    if (!settings) redirect("/setup");

    const rawRole = formData.get("role");
    const role = rawRole === "admin" || rawRole === "viewer" ? rawRole : null;
    const rawPassword = formData.get("password");
    const password = typeof rawPassword === "string" ? rawPassword : "";
    if (!role || password.length === 0) {
      redirect(`/login?error=wrong${from ? `&from=${from}` : ""}`);
    }

    const hash = role === "admin" ? settings.adminPassword : settings.viewerPassword;
    const match = await bcrypt.compare(password, hash);

    if (!match) {
      redirect(`/login?error=wrong${from ? `&from=${from}` : ""}`);
    }

    await setSessionCookie(role);
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎵</div>
          <h1 className="text-2xl font-bold text-gray-900">כניסה למערכת</h1>
          <p className="text-gray-500 text-sm mt-1">Festival Manager</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            סיסמה שגויה, נסה שוב
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">כניסה בתור</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50 transition">
                <input type="radio" name="role" value="admin" defaultChecked className="accent-violet-600" />
                <span className="text-sm font-medium text-gray-700">מנהל</span>
              </label>
              <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50 transition">
                <input type="radio" name="role" value="viewer" className="accent-violet-600" />
                <span className="text-sm font-medium text-gray-700">צופה</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
          >
            כניסה
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
            כניסה כצופה מוגבל ←
          </a>
        </div>
      </div>
    </div>
  );
}
