export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, setSessionCookie } from "@/lib/auth";

function isConfiguredSuperAdmin(email: string) {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");

  const { error, from } = await searchParams;

  async function login(formData: FormData) {
    "use server";

    const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim().toLowerCase() : "";
    const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
    const redirectTo = from ? `/${from.replace(/^\/+/, "")}` : "/";

    if (!email || !password) {
      redirect(`/login?error=wrong${from ? `&from=${encodeURIComponent(from)}` : ""}`);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      redirect(`/login?error=wrong${from ? `&from=${encodeURIComponent(from)}` : ""}`);
    }

    const finalUser =
      user.role === "SUPER_ADMIN" || !isConfiguredSuperAdmin(email)
        ? user
        : await prisma.user.update({
            where: { id: user.id },
            data: { role: "SUPER_ADMIN" },
          });

    await setSessionCookie(finalUser.id);
    redirect(redirectTo);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎵</div>
          <h1 className="text-2xl font-bold text-gray-900">כניסה לחשבון</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול הפסטיבלים שלך</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            אימייל או סיסמה שגויים
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              type="password"
              name="password"
              required
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

        <div className="mt-6 text-center text-sm text-gray-500">
          אין לך חשבון?{" "}
          <Link href="/signup" className="text-violet-600 hover:text-violet-700 font-medium">
            צור חשבון
          </Link>
        </div>
      </div>
    </div>
  );
}
