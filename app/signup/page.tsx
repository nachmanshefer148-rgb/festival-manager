export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, setSessionCookie } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;

  async function signup(formData: FormData) {
    "use server";

    const name = typeof formData.get("name") === "string" ? (formData.get("name") as string).trim() : "";
    const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim().toLowerCase() : "";
    const password = typeof formData.get("password") === "string" ? (formData.get("password") as string).trim() : "";

    if (name.length < 2 || !email || password.length < 6) {
      redirect("/signup?error=invalid");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      redirect("/signup?error=exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const userCount = await tx.user.count();
      const created = await tx.user.create({
        data: { name, email, passwordHash },
      });

      if (userCount === 0) {
        await tx.festival.updateMany({
          where: { ownerId: null },
          data: { ownerId: created.id },
        });
      }

      return created;
    });

    await setSessionCookie(user.id);
    redirect("/");
  }

  const errorMessage =
    error === "exists"
      ? "כבר קיים חשבון עם האימייל הזה"
      : error === "invalid"
      ? "נא למלא שם, אימייל וסיסמה של לפחות 6 תווים"
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎪</div>
          <h1 className="text-2xl font-bold text-gray-900">יצירת חשבון</h1>
          <p className="text-gray-500 text-sm mt-1">פתח לעצמך סביבת עבודה אישית לפסטיבלים</p>
        </div>

        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            {errorMessage}
          </div>
        )}

        <form action={signup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
            <input
              name="name"
              required
              minLength={2}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
          >
            צור חשבון
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          כבר יש לך חשבון?{" "}
          <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
            כניסה
          </Link>
        </div>
      </div>
    </div>
  );
}
