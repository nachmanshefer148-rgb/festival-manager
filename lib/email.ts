import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Festival Manager <noreply@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const styleBase = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;`;
const styleH2 = `color:#5b21b6;margin-bottom:8px;font-size:20px;`;
const styleP = `color:#374151;font-size:15px;line-height:1.6;`;
const styleBtnLink = `display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin:16px 0;font-size:14px;`;
const styleMuted = `color:#9ca3af;font-size:13px;margin-top:24px;`;
const styleCard = `background:#f5f3ff;border-radius:12px;padding:16px;margin:16px 0;`;

function wrap(content: string) {
  return `<div dir="rtl" style="${styleBase}">${content}</div>`;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${BASE_URL}/reset-password/${token}`;
  await resend.emails.send({
    from: FROM, to,
    subject: "איפוס סיסמה — Festival Manager",
    html: wrap(`
      <h2 style="${styleH2}">איפוס סיסמה</h2>
      <p style="${styleP}">קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
      <a href="${link}" style="${styleBtnLink}">אפס סיסמה</a>
      <p style="${styleMuted}">הלינק תקף ל-60 דקות. אם לא ביקשת איפוס — אפשר להתעלם מהמייל הזה.</p>
    `),
  });
}

export async function sendArtistFormConfirmation(to: string, artistName: string, festivalName: string) {
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `✅ הפרטים נשמרו — ${festivalName}`,
    html: wrap(`
      <h2 style="${styleH2}">הפרטים נשמרו בהצלחה</h2>
      <p style="${styleP}">היי,</p>
      <p style="${styleP}">הפרטים הטכניים והמידע עבור <strong>${artistName}</strong> בפסטיבל <strong>${festivalName}</strong> נשמרו בהצלחה.</p>
      <div style="${styleCard}">
        <p style="color:#374151;font-size:14px;margin:0;">ניתן לחזור ולעדכן את הפרטים דרך הלינק שקיבלת בכל עת.</p>
      </div>
      <p style="${styleMuted}">לשאלות — צרו קשר עם המארגנים ישירות.</p>
    `),
  });
}

export async function sendVendorFormConfirmation(to: string, vendorName: string, festivalName: string) {
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `✅ פרטי הספק עודכנו — ${festivalName}`,
    html: wrap(`
      <h2 style="${styleH2}">הפרטים עודכנו בהצלחה</h2>
      <p style="${styleP}">פרטי <strong>${vendorName}</strong> בפסטיבל <strong>${festivalName}</strong> נשמרו.</p>
      <p style="${styleMuted}">ניתן לחזור ולעדכן דרך הלינק שקיבלת.</p>
    `),
  });
}

export async function sendBoothApplicationConfirmation(to: string, boothName: string, festivalName: string) {
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `📋 בקשת הרשמה התקבלה — ${festivalName}`,
    html: wrap(`
      <h2 style="${styleH2}">בקשת הרשמה התקבלה!</h2>
      <p style="${styleP}">שלום,</p>
      <p style="${styleP}">בקשת ההצטרפות של <strong>${boothName}</strong> לפסטיבל <strong>${festivalName}</strong> התקבלה בהצלחה.</p>
      <div style="${styleCard}">
        <p style="color:#374151;font-size:14px;margin:0;">צוות המארגנים יצור איתך קשר לאישור ופרטים נוספים.</p>
      </div>
      <p style="${styleMuted}">תודה על ההרשמה!</p>
    `),
  });
}

export async function sendTeamInviteEmail(to: string, name: string, festivalName: string, inviteLink: string) {
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `🎪 הוזמנת להצטרף לצוות — ${festivalName}`,
    html: wrap(`
      <h2 style="${styleH2}">הוזמנת לפסטיבל!</h2>
      <p style="${styleP}">שלום ${name},</p>
      <p style="${styleP}">הוזמנת להצטרף לצוות הפסטיבל <strong>${festivalName}</strong>.</p>
      <a href="${inviteLink}" style="${styleBtnLink}">הצטרף עכשיו</a>
      <p style="${styleMuted}">הלינק תקף ל-72 שעות.</p>
    `),
  });
}

export async function sendApplicationApprovedEmail(to: string, name: string, festivalName: string) {
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `✅ הבקשה אושרה — ${festivalName}`,
    html: wrap(`
      <h2 style="${styleH2}">הבקשה אושרה!</h2>
      <p style="${styleP}">שלום ${name},</p>
      <p style="${styleP}">שמחים לבשר שבקשתך להצטרפות לפסטיבל <strong>${festivalName}</strong> אושרה.</p>
      <p style="${styleMuted}">תפרטים נוספים יגיעו בקרוב.</p>
    `),
  });
}

export async function sendNewApplicationAlert(adminEmail: string, applicantName: string, festivalName: string, type: "booth" | "team") {
  if (!adminEmail || !process.env.RESEND_API_KEY) return;
  const typeLabel = type === "booth" ? "דוכן" : "חבר צוות";
  await resend.emails.send({
    from: FROM, to: adminEmail,
    subject: `🔔 בקשת ${typeLabel} חדשה — ${festivalName}`,
    html: wrap(`
      <h2 style="${styleH2}">בקשה חדשה ממתינה לאישור</h2>
      <p style="${styleP}">התקבלה בקשת ${typeLabel} חדשה מ-<strong>${applicantName}</strong> לפסטיבל <strong>${festivalName}</strong>.</p>
      <a href="${BASE_URL}" style="${styleBtnLink}">כנס לניהול הפסטיבל</a>
    `),
  });
}
