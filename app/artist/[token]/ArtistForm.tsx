"use client";

import { useState } from "react";

interface Props {
  token: string;
  initialData: {
    contactPhone: string;
    contactEmail: string;
    technicalRiderNotes: string;
    hospitalityRider: string;
  };
  submitAction: (
    token: string,
    data: {
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      technicalRiderNotes: string;
      hospitalityRider: string;
      notes: string;
    }
  ) => Promise<void>;
}

export default function ArtistForm({ token, initialData, submitAction }: Props) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState(initialData.contactPhone);
  const [contactEmail, setContactEmail] = useState(initialData.contactEmail);
  const [technicalRiderNotes, setTechnicalRiderNotes] = useState(initialData.technicalRiderNotes);
  const [hospitalityRider, setHospitalityRider] = useState(initialData.hospitalityRider);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitAction(token, {
        contactName,
        contactPhone,
        contactEmail,
        technicalRiderNotes,
        hospitalityRider,
        notes,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">הפרטים נשמרו!</h2>
        <p className="text-gray-500 text-sm">תודה, המארגן קיבל את הפרטים שלך.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם איש קשר</label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="שם מלא"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="050-0000000"
          dir="ltr"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="email@example.com"
          dir="ltr"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">דרישות טכניות / ריידר</label>
        <textarea
          value={technicalRiderNotes}
          onChange={(e) => setTechnicalRiderNotes(e.target.value)}
          rows={4}
          placeholder="ציוד נדרש, מפרט טכני, הגדרות במה..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ריידר הכנסת אורחים (hospitalityRider)</label>
        <textarea
          value={hospitalityRider}
          onChange={(e) => setHospitalityRider(e.target.value)}
          rows={3}
          placeholder="אוכל, שתייה, חדר הלבשה..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות נוספות</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="כל מה שחשוב לך שנדע..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition disabled:opacity-60"
      >
        {submitting ? "שולח..." : "שלח פרטים"}
      </button>
    </form>
  );
}
