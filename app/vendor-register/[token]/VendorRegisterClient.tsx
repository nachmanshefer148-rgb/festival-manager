"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft } from "lucide-react";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  production: { label: "הפקה", color: "bg-violet-100 text-violet-700" },
  logistics: { label: "לוגיסטיקה", color: "bg-blue-100 text-blue-700" },
  food: { label: "מזון ומשקאות", color: "bg-green-100 text-green-700" },
  security: { label: "אבטחה/רפואה", color: "bg-red-100 text-red-700" },
};

interface Vendor {
  id: string;
  name: string;
  category: string;
  vendorToken: string;
}

interface Props {
  festivalToken: string;
  vendors: Vendor[];
  registerNewVendor: (festivalToken: string, name: string, category: string, notes: string) => Promise<string>;
}

export default function VendorRegisterClient({ festivalToken, vendors, registerNewVendor }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("production");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = vendors.filter((v) =>
    !search.trim() || v.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function handleSelectVendor(vendor: Vendor) {
    router.push(`/vendor/${vendor.vendorToken}`);
  }

  async function handleRegisterNew(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setError("חובה להכניס שם ספק"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const vendorToken = await registerNewVendor(festivalToken, newName.trim(), newCategory, "");
      router.push(`/vendor/${vendorToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהרשמה");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

  if (showNewForm) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewForm(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-bold text-gray-900">הרשמה כספק חדש</h2>
        </div>

        <form onSubmit={handleRegisterNew} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם הספק / חברה *</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם החברה שלך"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה *</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={inputCls}
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            {submitting ? "נרשם..." : "המשך למילוי פרטים"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="חפש את שם הספק שלך..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white shadow-sm"
          autoFocus
        />
      </div>

      {/* Vendor list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {filtered.length === 0 && vendors.length > 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            לא נמצא ספק בשם &ldquo;{search}&rdquo;
          </div>
        )}
        {vendors.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            אין ספקים ברשימה עדיין
          </div>
        )}
        {filtered.map((vendor) => {
          const cat = CATEGORIES[vendor.category];
          return (
            <button
              key={vendor.id}
              type="button"
              onClick={() => handleSelectVendor(vendor)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-violet-50 transition-colors text-right group"
            >
              <div>
                <div className="font-medium text-gray-900">{vendor.name}</div>
                <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>
                  {cat?.label ?? vendor.category}
                </span>
              </div>
              <ChevronLeft size={18} className="text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Register new */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-400 mb-2">לא מצאת את עצמך ברשימה?</p>
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="text-sm text-violet-600 hover:text-violet-700 font-medium border border-violet-200 hover:border-violet-400 px-4 py-2 rounded-xl transition-colors"
        >
          + הרשמה כספק חדש
        </button>
      </div>
    </div>
  );
}
