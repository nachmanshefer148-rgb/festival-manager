"use client";

import { useRef } from "react";

interface Props {
  festivalId: string;
  createArtist: (formData: FormData) => Promise<void>;
}

export default function ArtistForm({ festivalId, createArtist }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await createArtist(formData);
    formRef.current?.reset();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-5">הוסף אמן</h2>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <input type="hidden" name="festivalId" value={festivalId} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם האמן / להקה *</label>
          <input
            name="name"
            required
            placeholder="שם האמן"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ז'אנר</label>
          <input
            name="genre"
            placeholder="Rock, Techno, Jazz..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">סט (דק')</label>
            <input
              name="setDuration"
              type="number"
              defaultValue={60}
              min={1}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">סאונדצ'ק</label>
            <input
              name="soundcheckDuration"
              type="number"
              defaultValue={30}
              min={0}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">הפסקה</label>
            <input
              name="breakAfter"
              type="number"
              defaultValue={15}
              min={0}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
          <input
            name="contactPhone"
            type="tel"
            placeholder="050-0000000"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
          <input
            name="contactEmail"
            type="email"
            placeholder="artist@example.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ביוגרפיה</label>
          <textarea
            name="bio"
            rows={2}
            placeholder="קצת על האמן..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
        >
          הוסף אמן
        </button>
      </form>
    </div>
  );
}
