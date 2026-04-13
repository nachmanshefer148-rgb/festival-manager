export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  async function requestReset(formData: FormData) {
    "use server";

    const email = typeof formData.get("email") === "string"
      ? (formData.get("email") as string).trim().toLowerCase()
      : "";

    if (!email) redirect("/forgot-password?error=invalid");

    const user = await prisma.user.findUnique({ where: { email } });

    // Always redirect to "sent" even if user not found — prevents email enumeration
    if (user) {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

      // Invalidate existing unused tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { expiresAt: new Date(0) },
      });

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      try {
        await sendPasswordResetEmail(user.email, token);
      } catch {
        redirect("/forgot-password?error=email");
      }
    }

    redirect("/forgot-password?sent=1");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">שכחתי סיסמה</h1>
          <p className="text-gray-500 text-sm mt-1">נשלח לך לינק לאיפוס למייל</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 text-center">
              אם האימייל קיים במערכת — נשלח לינק לאיפוס
            </div>
            <Link
              href="/login"
              className="block text-center text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              חזרה לכניסה
            </Link>
          </div>
        ) : (
          <>
            {error === "email" && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
                שגיאה בשליחת המייל. נסה שוב מאוחר יותר.
              </div>
            )}

            <form action={requestReset} className="space-y-4">
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

              <button
                type="submit"
                className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
              >
                שלח לינק לאיפוס
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition">
                חזרה לכניסה
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
