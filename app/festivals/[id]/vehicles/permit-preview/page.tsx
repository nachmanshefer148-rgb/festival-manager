export const dynamic = "force-dynamic";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { QRCodeSVG } from "qrcode.react";

function formatDate(d: Date) {
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const MOCK = {
  plate: "12-345-67",
  driverName: "ישראל ישראלי",
  sourceBadge: "ספק",
  subLabel: "חברה לדוגמה",
  type: "vendor" as const,
};

const STRIPE_COLORS: Record<string, string> = {
  vendor: "#7c3aed",
  artist: "#0891b2",
  team: "#059669",
  direct: "#374151",
};

interface DesignProps {
  festivalName: string;
  startDate: string;
  endDate: string;
  logoUrl: string | null;
}

function Design1({ festivalName, startDate, endDate, logoUrl }: DesignProps) {
  return (
    <div style={{
      background: "#111827",
      border: "2px solid #d4af37",
      borderRadius: "16px",
      padding: "28px 32px",
      maxWidth: "420px",
      fontFamily: "sans-serif",
      direction: "rtl",
    }}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="לוגו" style={{ height: "48px", objectFit: "contain", marginBottom: "8px" }} />
        )}
        <div style={{ color: "#ffffff", fontSize: "20px", fontWeight: "700" }}>{festivalName}</div>
        <div style={{ color: "#d4af37", fontSize: "13px", marginTop: "2px" }}>{startDate} – {endDate}</div>
      </div>
      <div style={{ color: "#d4af37", fontSize: "26px", fontWeight: "800", textAlign: "center", margin: "12px 0 16px", letterSpacing: "0.05em" }}>
        אישור מעבר
      </div>
      <div style={{
        background: "#1f2937",
        border: "1.5px solid #d4af37",
        borderRadius: "10px",
        padding: "12px 20px",
        textAlign: "center",
        marginBottom: "16px",
      }}>
        <div style={{ color: "#ffffff", fontSize: "48px", fontWeight: "900", fontFamily: "monospace", letterSpacing: "0.1em", direction: "ltr" }}>
          {MOCK.plate}
        </div>
      </div>
      <div style={{ color: "#e5e7eb", fontSize: "15px", marginBottom: "4px" }}>
        <span style={{ color: "#9ca3af" }}>שם: </span>{MOCK.driverName}
      </div>
      <div style={{ color: "#d4af37", fontSize: "13px", marginBottom: "20px" }}>
        {MOCK.sourceBadge} — {MOCK.subLabel}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <QRCodeSVG value="https://example.com/preview" size={120} fgColor="#d4af37" bgColor="#111827" />
      </div>
      <div style={{ color: "#6b7280", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
        תקף: {startDate} – {endDate}
      </div>
    </div>
  );
}

function Design2({ festivalName, startDate, endDate, logoUrl }: DesignProps) {
  const stripe = STRIPE_COLORS[MOCK.type];
  return (
    <div style={{
      display: "flex",
      width: "560px",
      minHeight: "200px",
      border: "1.5px solid #d1d5db",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "sans-serif",
      direction: "rtl",
      background: "#fff",
    }}>
      <div style={{ width: "22px", background: stripe, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="לוגו" style={{ height: "32px", objectFit: "contain" }} />
            )}
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#111827" }}>{festivalName}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{startDate} – {endDate}</div>
            </div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: stripe, marginBottom: "10px" }}>אישור מעבר</div>
          <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: "12px" }} />
          <div style={{ fontSize: "48px", fontWeight: "900", fontFamily: "monospace", color: "#111827", direction: "ltr", marginBottom: "8px" }}>
            {MOCK.plate}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "14px", color: "#374151", fontWeight: "600" }}>{MOCK.driverName}</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>{MOCK.sourceBadge} — {MOCK.subLabel}</div>
          </div>
          <QRCodeSVG value="https://example.com/preview" size={80} />
        </div>
      </div>
    </div>
  );
}

function Design3({ festivalName, startDate, endDate, logoUrl }: DesignProps) {
  const bars = Array.from({ length: 22 }, (_, i) => ({ w: [2,3,1,4,2,1,3,2,4,1,2,3,1,2,4,3,1,2,3,4,2,1][i], h: [28,22,32,20,26,30,18,28,24,32,20,26,28,18,24,30,22,28,20,26,24,30][i] }));
  return (
    <div style={{
      display: "flex",
      width: "520px",
      border: "1.5px solid #d1d5db",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "sans-serif",
      direction: "rtl",
      background: "#fff",
      minHeight: "280px",
    }}>
      <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", marginBottom: "4px" }}>אישור מעבר</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="לוגו" style={{ height: "28px", objectFit: "contain" }} />
          )}
          <div>
            <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>{festivalName}</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>{startDate} – {endDate}</div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "2px" }}>שם</div>
        <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "10px" }}>{MOCK.driverName}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "2px" }}>לוחית רישוי</div>
        <div style={{ fontSize: "32px", fontWeight: "900", fontFamily: "monospace", color: "#111827", direction: "ltr", marginBottom: "10px" }}>{MOCK.plate}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "2px" }}>קטגוריה</div>
        <div style={{ fontSize: "13px", color: "#374151", marginBottom: "16px" }}>{MOCK.sourceBadge} — {MOCK.subLabel}</div>
        <div style={{ marginTop: "auto" }}>
          <QRCodeSVG value="https://example.com/preview" size={90} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1px", marginTop: "12px" }}>
          {bars.map((b, i) => (
            <div key={i} style={{ width: `${b.w}px`, height: `${b.h}px`, background: "#374151", borderRadius: "1px" }} />
          ))}
        </div>
      </div>
      <div style={{
        width: "64px",
        background: "#7c3aed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <div style={{
          color: "#fff",
          fontSize: "13px",
          fontWeight: "700",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          letterSpacing: "0.1em",
          whiteSpace: "nowrap",
        }}>
          {festivalName}
        </div>
      </div>
    </div>
  );
}

function Design4({ festivalName, startDate, endDate, logoUrl }: DesignProps) {
  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "32px 36px",
      maxWidth: "400px",
      fontFamily: "sans-serif",
      direction: "rtl",
      background: "#fff",
      textAlign: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "2px" }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="לוגו" style={{ height: "24px", objectFit: "contain" }} />
        )}
        <div style={{ fontSize: "14px", color: "#6b7280" }}>{festivalName}</div>
      </div>
      <div style={{ fontSize: "30px", fontWeight: "800", color: "#111827", marginBottom: "20px" }}>אישור מעבר</div>
      <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: "20px" }} />
      <div style={{ fontSize: "68px", fontWeight: "900", fontFamily: "monospace", color: "#111827", direction: "ltr", letterSpacing: "0.05em", lineHeight: 1, marginBottom: "16px" }}>
        {MOCK.plate}
      </div>
      <div style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>{MOCK.driverName}</div>
      <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>{MOCK.sourceBadge} — {MOCK.subLabel}</div>
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <QRCodeSVG value="https://example.com/preview" size={90} />
        </div>
        <div style={{ fontSize: "11px", color: "#d1d5db", marginTop: "10px" }}>{startDate} – {endDate}</div>
      </div>
    </div>
  );
}

function Design5({ festivalName, startDate, endDate, logoUrl }: DesignProps) {
  return (
    <div style={{
      display: "flex",
      width: "560px",
      border: "1.5px solid #d1d5db",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "sans-serif",
      direction: "rtl",
      background: "#fff",
      minHeight: "220px",
      position: "relative",
    }}>
      {/* watermark */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-28deg)",
        fontSize: "72px",
        fontWeight: "900",
        color: "#000",
        opacity: 0.04,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        fontFamily: "sans-serif",
        letterSpacing: "0.2em",
      }}>
        VALID
      </div>
      {/* main body */}
      <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="לוגו" style={{ height: "28px", objectFit: "contain" }} />
            )}
            <div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>{festivalName}</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>{startDate} – {endDate}</div>
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "14px" }}>אישור מעבר</div>
          <div style={{ fontSize: "40px", fontWeight: "900", fontFamily: "monospace", color: "#111827", direction: "ltr", marginBottom: "8px" }}>
            {MOCK.plate}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>{MOCK.driverName}</div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>{MOCK.sourceBadge} — {MOCK.subLabel}</div>
        </div>
      </div>
      {/* perforation */}
      <div style={{
        width: "1px",
        borderRight: "2px dashed #9ca3af",
        margin: "16px 0",
        flexShrink: 0,
      }} />
      {/* stub */}
      <div style={{
        width: "130px",
        flexShrink: 0,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
      }}>
        <QRCodeSVG value="https://example.com/preview" size={85} />
        <div style={{ fontSize: "10px", color: "#9ca3af", textAlign: "center" }}>
          תקף<br />{startDate}<br />–<br />{endDate}
        </div>
      </div>
    </div>
  );
}

function Design6({ festivalName, startDate, endDate, logoUrl }: DesignProps) {
  return (
    <div style={{
      width: "480px",
      border: "1.5px solid #1e3a5f",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "sans-serif",
      direction: "rtl",
      background: "#fff",
    }}>
      {/* header band */}
      <div style={{
        background: "#1e3a5f",
        padding: "18px 24px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="לוגו" style={{ height: "40px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#ffffff", fontWeight: "700", fontSize: "18px" }}>{festivalName}</div>
          <div style={{ color: "#93c5fd", fontSize: "12px" }}>{startDate} – {endDate}</div>
        </div>
        <div style={{
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "700",
          border: "1.5px solid #93c5fd",
          borderRadius: "6px",
          padding: "4px 10px",
          whiteSpace: "nowrap",
        }}>
          אישור מעבר
        </div>
      </div>
      {/* body */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>שם / גוף</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827" }}>{MOCK.driverName}</div>
          </div>
          <div style={{ background: "#f3f4f6", borderRadius: "8px", padding: "12px 16px" }}>
            <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>לוחית רישוי</div>
            <div style={{ fontSize: "38px", fontWeight: "900", fontFamily: "monospace", color: "#1e3a5f", direction: "ltr" }}>{MOCK.plate}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>קטגוריה</div>
            <div style={{ fontSize: "14px", color: "#374151" }}>{MOCK.sourceBadge} — {MOCK.subLabel}</div>
          </div>
        </div>
        <div style={{ borderTop: "2px solid #1e3a5f", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <QRCodeSVG value="https://example.com/preview" size={90} fgColor="#1e3a5f" />
          <div style={{ textAlign: "left", fontSize: "11px", color: "#9ca3af" }}>
            <div>תאריכי הפסטיבל</div>
            <div style={{ fontWeight: "600", color: "#374151" }}>{startDate}</div>
            <div style={{ fontWeight: "600", color: "#374151" }}>{endDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DESIGNS = [
  { id: 1, name: "Dark Badge (VIP)", desc: "רקע כהה, מסגרת זהב, תחושת VIP" },
  { id: 2, name: "Windshield Pass", desc: "לרוחב, רצועה צבעונית, מיועד לשמשת רכב" },
  { id: 3, name: "Event Credential", desc: "שני עמודות, סרגל סגול עם שם הפסטיבל" },
  { id: 4, name: "Minimal Clean", desc: "נקי ומינימליסטי, לוחית ענקית במרכז" },
  { id: 5, name: "Ticket Stub", desc: "כרטיס עם קו perforation וסטאב QR" },
  { id: 6, name: "Security Pass", desc: "רשמי, פס כחול כהה, מבנה מסודר" },
];

export default async function PermitPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireFestivalAccessPage(id);

  const festival = await prisma.festival.findUnique({
    where: { id },
    select: { name: true, startDate: true, endDate: true, logoUrl: true },
  });

  if (!festival) return <div>פסטיבל לא נמצא</div>;

  const startDate = formatDate(festival.startDate);
  const endDate = formatDate(festival.endDate);
  const logoUrl = festival.logoUrl ?? null;

  const designProps = { festivalName: festival.name, startDate, endDate, logoUrl };

  const designComponents = [
    <Design1 key={1} {...designProps} />,
    <Design2 key={2} {...designProps} />,
    <Design3 key={3} {...designProps} />,
    <Design4 key={4} {...designProps} />,
    <Design5 key={5} {...designProps} />,
    <Design6 key={6} {...designProps} />,
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", padding: "32px", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>
          תצוגה מקדימה — אישורי מעבר
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>
          הנתונים המוצגים לדוגמה. בחר עיצוב ועדכן אותנו.
        </p>
        {!logoUrl && (
          <p style={{ color: "#f59e0b", fontSize: "13px", background: "#fef3c7", borderRadius: "8px", padding: "8px 14px", display: "inline-block", marginBottom: "16px" }}>
            💡 אין לוגו — הגדרות פסטיבל → העלה לוגו כדי שיופיע כאן
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "48px", marginTop: "24px" }}>
          {DESIGNS.map((d, i) => (
            <div key={d.id}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{
                  background: "#7c3aed",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "2px 10px",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginLeft: "8px",
                }}>
                  עיצוב {d.id}
                </span>
                <span style={{ fontWeight: "700", fontSize: "16px", color: "#111827" }}>{d.name}</span>
                <span style={{ color: "#9ca3af", fontSize: "13px", marginRight: "8px" }}> — {d.desc}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                {designComponents[i]}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "48px",
          background: "#ede9fe",
          border: "1.5px solid #7c3aed",
          borderRadius: "12px",
          padding: "20px 24px",
          color: "#4c1d95",
          fontSize: "14px",
          lineHeight: "1.6",
        }}>
          <strong>בחרת עיצוב?</strong> עדכן אותנו ונגדיר אותו כ-print template לכפתור הדפסה בטאב הרכבים.
        </div>
      </div>
    </div>
  );
}
