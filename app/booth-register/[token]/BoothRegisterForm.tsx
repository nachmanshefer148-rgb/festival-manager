"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "food", label: "אוכל ושתייה" },
  { value: "merch", label: "מרצ'נדייז" },
  { value: "activities", label: "פעילויות ומשחקים" },
  { value: "art", label: "אמנות ויצירה" },
  { value: "services", label: "שירותים אחרים" },
];

interface Props {
  token: string;
  submitAction: (
    token: string,
    boothName: string,
    category: string,
    contactName: string,
    contactPhone: string,
    contactEmail: string,
    notes: string
  ) => Promise<void>;
}

export default function BoothRegisterForm({ token, submitAction }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">הדוכן נרשם בהצלחה!</h2>
        <p className="text-gray-500 text-sm">הפרטים נשמרו. המארגן יצור איתך קשר בקרוב.</p>
      </div>
    );
  }

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

  return (
    <form
      action={async (fd) => {
        setError(null);
        setLoading(true);
        try {
          await submitAction(
            token,
            fd.get("boothName") as string,
            fd.get("category") as string,
            fd.get("contactName") as string,
            fd.get("contactPhone") as string,
            fd.get("contactEmail") as string,
            fd.get("notes") as string
          );
          setSubmitted(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "שגיאה בשליחה");
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם הדוכן *</label>
        <input name="boothName" required placeholder="שם הדוכן שלך" className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה *</label>
        <select name="category" required className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 mb-3 font-medium">איש קשר</p>
        <div className="space-y-3">
          <input name="contactName" placeholder="שם מלא" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input name="contactPhone" type="tel" placeholder="טלפון" className={inputCls} dir="ltr" />
            <input name="contactEmail" type="email" placeholder="מייל" className={inputCls} dir="ltr" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
        <textarea name="notes" rows={3} placeholder="מידע נוסף..." className={inputCls + " resize-none"} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
      >
        {loading ? "שולח..." : "רשום דוכן"}
      </button>
    </form>
  );
}
