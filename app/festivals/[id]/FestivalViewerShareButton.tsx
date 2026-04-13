"use client";

import { useState } from "react";

type Props = {
  festivalId: string;
  viewerToken: string | null;
  viewerAccessEnabled: boolean;
  viewerShowBudget: boolean;
  viewerShowDocuments: boolean;
  generateFestivalViewerToken: (festivalId: string) => Promise<string>;
  saveFestivalViewerAccess: (festivalId: string, formData: FormData) => Promise<void>;
  compact?: boolean;
  onDone?: () => void;
};

export default function FestivalViewerShareButton({
  festivalId,
  viewerToken: initialViewerToken,
  viewerAccessEnabled,
  viewerShowBudget,
  viewerShowDocuments,
  generateFestivalViewerToken,
  saveFestivalViewerAccess,
  compact = false,
  onDone,
}: Props) {
  const [open, setOpen] = useState(false);
  const [viewerToken, setViewerToken] = useState<string | null>(initialViewerToken);
  const [copied, setCopied] = useState(false);

  async function handleCopyViewerLink() {
    let token = viewerToken;
    if (!token) {
      token = await generateFestivalViewerToken(festivalId);
      setViewerToken(token);
    }

    const url = `${window.location.origin}/view/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "flex w-full items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-right text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100"
            : "mx-3 mt-auto flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-right text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100"
        }
      >
        <span className="text-lg" aria-hidden="true">🔗</span>
        <span className="flex-1">
          <span className="block">שיתוף צפייה</span>
          <span className="mt-0.5 block text-xs font-normal text-violet-700">
            קישור צופה מוגבל לפסטיבל
          </span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">שיתוף צפייה מוגבלת</h2>
                <p className="mt-1 text-sm text-gray-500">
                  פתח קישור צפייה חיצוני לפסטיבל הזה בלבד, בלי גישה לעריכה ובלי גישה לפסטיבלים אחרים.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="סגור חלון"
              >
                ✕
              </button>
            </div>

            <form
              action={async (fd) => {
                await saveFestivalViewerAccess(festivalId, fd);
                onDone?.();
                setOpen(false);
              }}
              className="space-y-4"
            >
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="viewerAccessEnabled"
                  defaultChecked={viewerAccessEnabled}
                  className="h-4 w-4"
                />
                אפשר צפייה מוגבלת בפסטיבל הזה
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="viewerShowBudget"
                    defaultChecked={viewerShowBudget}
                    className="h-4 w-4"
                  />
                  הצג גם תקציב
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="viewerShowDocuments"
                    defaultChecked={viewerShowDocuments}
                    className="h-4 w-4"
                  />
                  הצג גם מסמכים
                </label>
              </div>

              <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-4">
                <p className="text-sm font-medium text-violet-900">לינק שיתוף</p>
                <p className="mt-1 text-xs text-violet-700">
                  {viewerToken ? `/view/${viewerToken}` : "עדיין לא נוצר לינק. לחיצה על העתק תייצר אחד אוטומטית."}
                </p>
                <button
                  type="button"
                  onClick={handleCopyViewerLink}
                  className="mt-3 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100"
                >
                  {copied ? "✓ לינק צפייה הועתק" : "העתק לינק צפייה"}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
