import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Festival Manager <noreply@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${BASE_URL}/reset-password/${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "איפוס סיסמה — Festival Manager",
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #5b21b6; margin-bottom: 8px;">איפוס סיסמה</h2>
        <p style="color: #374151;">קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
        <p style="color: #374151;">לחץ על הכפתור כדי לאפס:</p>
        <a href="${link}"
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px;
                  border-radius: 10px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          אפס סיסמה
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          הלינק תקף ל-60 דקות. אם לא ביקשת איפוס — אפשר להתעלם מהמייל הזה.
        </p>
        <p style="color: #d1d5db; font-size: 11px; margin-top: 8px; word-break: break-all;">
          ${link}
        </p>
      </div>
    `,
  });
}
