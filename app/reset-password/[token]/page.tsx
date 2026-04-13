export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { token } = await params;
  const { error, done } = await searchParams;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true } } },
  });

  const isValid =
    record &&
    !record.usedAt &&
    record.expiresAt > new Date();

  if (!isValid) return notFound();

  async function resetPassword(formData: FormData) {
    "use server";

    const password = typeof formData.get("password") === "string"
      ? (formData.get("password") as string).trim()
      : "";
    const confirm = typeof formData.get("confirm") === "string"
      ? (formData.get("confirm") as string).trim()
      : "";

    if (password.length < 6 || password !== confirm) {
      redirect(`/reset-password/${token}?error=invalid`);
    }

    const rec = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
      redirect(`/reset-password/${token}?error=expired`);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: rec.userId },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    redirect(`/reset-password/${token}?done=1`);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">הסיסמה עודכנה!</h1>
          <p className="text-gray-500 text-sm mb-6">אפשר להיכנס עם הסיסמה החדשה</p>
          <Link
            href="/login"
            className="inline-block bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
          >
            כניסה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">סיסמה חדשה</h1>
          <p className="text-gray-500 text-sm mt-1">שלום {record.user.name}</p>
        </div>

        {(error === "invalid" || error === "expired") && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            {error === "expired"
              ? "הלינק פג תוקף. בקש לינק חדש."
              : "הסיסמאות לא תואמות או קצרות מ-6 תווים"}
          </div>
        )}

        <form action={resetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
            <input
              type="password"
              name="confirm"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
          >
            שמור סיסמה
          </button>
        </form>
      </div>
    </div>
  );
}
