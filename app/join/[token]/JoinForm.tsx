"use client";

import { useState } from "react";

interface Props {
  token: string;
  festivalName: string;
  submitAction: (token: string, formData: FormData) => Promise<void>;
}

export default function JoinForm({ token, festivalName, submitAction }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">הפרטים נשלחו!</h2>
        <p className="text-gray-500 text-sm">ממתין לאישור המנהל. תקבל/י הודעה בקרוב.</p>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        setError(null);
        setLoading(true);
        try {
          await submitAction(token, fd);
          setSubmitted(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "שגיאה בשליחה");
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם פרטי *</label>
          <input
            name="firstName"
            required
            autoFocus
            placeholder="ישראל"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם משפחה *</label>
          <input
            name="lastName"
            required
            placeholder="ישראלי"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
        <input
          name="phone"
          type="tel"
          placeholder="050-0000000"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
        <input
          name="email"
          type="email"
          placeholder="name@email.com"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">מספר רכב</label>
        <input
          name="carNumber"
          placeholder="12-345-67"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="מידע נוסף שרלוונטי..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
      >
        {loading ? "שולח..." : "שלח פרטים"}
      </button>
    </form>
  );
}
