"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Props {
  festivalId: string;
  festivalName: string;
  isOwner: boolean;
  members: Member[];
  addFestivalMember: (festivalId: string, email: string) => Promise<{ id: string; name: string; email: string }>;
  removeFestivalMember: (festivalId: string, userId: string) => Promise<void>;
  deleteFestival: (id: string, password: string) => Promise<void>;
}

export default function FestivalSettingsClient({
  festivalId,
  festivalName,
  isOwner,
  members: initialMembers,
  addFestivalMember,
  removeFestivalMember,
  deleteFestival,
}: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [emailInput, setEmailInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Danger Zone state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAdd() {
    const email = emailInput.trim();
    if (!email) return;
    setAddError(null);
    startTransition(async () => {
      try {
        const newUser = await addFestivalMember(festivalId, email);
        setMembers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            createdAt: new Date().toISOString(),
          },
        ]);
        setEmailInput("");
      } catch (e: unknown) {
        setAddError(e instanceof Error ? e.message : "שגיאה בהוספת משתמש");
      }
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeFestivalMember(festivalId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    });
  }

  async function handleDelete() {
    if (!deletePassword) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteFestival(festivalId, deletePassword);
      router.push("/");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "שגיאת מחיקה");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2" dir="rtl">
      <h1 className="text-2xl font-bold text-violet-900">⚙️ הגדרות פסטיבל</h1>

      {/* חברי פסטיבל */}
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-1">משתמשים עם גישה לפסטיבל</h2>
        <p className="text-xs text-gray-400 mb-5">
          משתמשים אלו יכולים לערוך את הפסטיבל, אך לא למחוק אותו.
        </p>

        {/* הוספת משתמש */}
        {isOwner && (
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="אימייל של משתמש רשום"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !emailInput.trim()}
              className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50"
            >
              הוסף
            </button>
          </div>
        )}
        {addError && (
          <p className="text-red-500 text-sm mb-3">{addError}</p>
        )}

        {/* רשימת חברים */}
        {members.length === 0 ? (
          <p className="text-gray-400 text-sm">אין משתמשים נוספים עדיין.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemove(m.userId)}
                    disabled={isPending}
                    className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-40"
                  >
                    הסר
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone — מחיקת פסטיבל */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <h2 className="font-semibold text-red-700 mb-1">אזור מסוכן</h2>
          <p className="text-xs text-gray-400 mb-4">
            מחיקת הפסטיבל תמחק את כל הנתונים הקשורים אליו ללא אפשרות שחזור.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition"
          >
            מחק פסטיבל
          </button>
        </div>
      )}

      {/* מודל אישור מחיקה */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <h2 className="text-lg font-semibold text-red-700 mb-1">אישור מחיקת פסטיבל</h2>
            <p className="text-sm text-gray-500 mb-4">
              כדי למחוק את <strong>{festivalName}</strong>, הזן את הסיסמה שלך.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="סיסמה"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
            />
            {deleteError && (
              <p className="text-red-500 text-sm mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? "מוחק..." : "מחק לצמיתות"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
