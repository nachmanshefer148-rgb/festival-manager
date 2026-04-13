"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string | null;
  date: string;
  isPaid: boolean;
  vendor: string | null;
  notes: string | null;
}

interface Props {
  festivalId: string;
  items: BudgetItem[];
  isAdmin: boolean;
  createBudgetItem: (formData: FormData) => Promise<void>;
  deleteBudgetItem: (id: string, festivalId: string) => Promise<void>;
  updateBudgetItem: (id: string, formData: FormData) => Promise<void>;
  toggleBudgetItemPaid: (id: string, isPaid: boolean, festivalId: string) => Promise<void>;
}

export default function BudgetClient({
  festivalId,
  items,
  isAdmin,
  createBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
  toggleBudgetItemPaid,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [defaultType, setDefaultType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [submitting, setSubmitting] = useState(false);

  const income = items.filter((i) => i.type === "INCOME").reduce((s, i) => s + i.amount, 0);
  const expenses = items.filter((i) => i.type === "EXPENSE").reduce((s, i) => s + i.amount, 0);
  const balance = income - expenses;

  const filtered = items.filter((i) => filterType === "ALL" || i.type === filterType);

  // Group categories
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[];

  function exportCSV() {
    const BOM = "\uFEFF";
    const header = "תיאור,סוג,קטגוריה,ספק,סכום,שולם,תאריך";
    const rows = items.map((item) =>
      [
        `"${item.description.replace(/"/g, '""')}"`,
        item.type === "INCOME" ? "הכנסה" : "הוצאה",
        `"${(item.category ?? "").replace(/"/g, '""')}"`,
        `"${(item.vendor ?? "").replace(/"/g, '""')}"`,
        item.amount,
        item.isPaid ? "כן" : "לא",
        item.date.split("T")[0],
      ].join(",")
    );
    const csv = BOM + [header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openAdd(type: "INCOME" | "EXPENSE") {
    setDefaultType(type);
    setEditItem(null);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">💰 תקציב</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            title="ייצוא CSV"
          >
            ↓ CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            title="הדפס"
          >
            🖨️
          </button>
          {isAdmin && (
            <>
              <button onClick={() => openAdd("INCOME")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                + הכנסה
              </button>
              <button onClick={() => openAdd("EXPENSE")} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                + הוצאה
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">סה"כ הכנסות</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(income)}</p>
          <p className="text-xs text-emerald-500 mt-1">{items.filter((i) => i.type === "INCOME").length} פריטים</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">סה"כ הוצאות</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
          <p className="text-xs text-red-400 mt-1">{items.filter((i) => i.type === "EXPENSE").length} פריטים</p>
        </div>
        <div className={`rounded-2xl p-4 border ${balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-xs font-medium mb-1 ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>יתרה</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-600"}`}>{formatCurrency(balance)}</p>
          <p className={`text-xs mt-1 ${balance >= 0 ? "text-blue-400" : "text-orange-400"}`}>{balance >= 0 ? "✓ חיובי" : "⚠ גירעון"}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterType === t ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {t === "ALL" ? `הכל (${items.length})` : t === "INCOME" ? `הכנסות (${items.filter((i) => i.type === "INCOME").length})` : `הוצאות (${items.filter((i) => i.type === "EXPENSE").length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        isAdmin && items.length === 0 ? (
          <button
            onClick={() => openAdd("EXPENSE")}
            className="w-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group"
          >
            <div className="text-4xl mb-2">💸</div>
            <p className="font-medium">עדיין אין פריטים בתקציב</p>
            <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספת פריט ראשון</p>
          </button>
        ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <div className="text-4xl mb-2">💸</div>
          <p className="font-medium">{items.length === 0 ? "עדיין אין פריטים בתקציב" : "לא נמצאו תוצאות"}</p>
        </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">תיאור</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">קטגוריה</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">סכום</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">תאריך</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">שולם</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === "INCOME" ? "bg-emerald-400" : "bg-red-400"}`} />
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {item.vendor && <p className="text-xs text-gray-400">{item.vendor}</p>}
                        {item.notes && <p className="text-xs text-gray-400 truncate max-w-48">{item.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {item.category ? (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs">{item.category}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${item.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                    {item.type === "EXPENSE" ? "-" : "+"}{formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{formatDate(item.date)}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <button
                        onClick={async () => { await toggleBudgetItemPaid(item.id, !item.isPaid, festivalId); toast(item.isPaid ? "סומן כלא שולם" : "סומן כשולם"); }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${item.isPaid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {item.isPaid ? "✓ שולם" : "ממתין"}
                      </button>
                    ) : (
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${item.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.isPaid ? "✓ שולם" : "ממתין"}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setEditItem(item); setShowForm(true); }}
                          className="text-gray-400 hover:text-violet-600 transition-colors px-2 py-1 rounded hover:bg-violet-50"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await confirm({ message: "למחוק פריט זה?", danger: true, confirmLabel: "מחק" });
                            if (ok) { await deleteBudgetItem(item.id, festivalId); toast("הפריט נמחק"); }
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                          aria-label="מחק פריט"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editItem ? "עריכת פריט" : defaultType === "INCOME" ? "הוסף הכנסה" : "הוסף הוצאה"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form
              action={async (fd) => {
                setSubmitting(true);
                try {
                  if (editItem) {
                    await updateBudgetItem(editItem.id, fd);
                    toast("הפריט עודכן");
                  } else {
                    await createBudgetItem(fd);
                    toast("הפריט נוסף");
                  }
                  setShowForm(false);
                  setEditItem(null);
                } catch {
                  toast("שגיאה בשמירה", "error");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <input type="hidden" name="festivalId" value={festivalId} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                <div className="flex gap-2">
                  {(["INCOME", "EXPENSE"] as const).map((t) => (
                    <label key={t} className="flex-1">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        defaultChecked={(editItem?.type ?? defaultType) === t}
                        className="sr-only"
                      />
                      <span className={`block text-center py-2 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${
                        t === "INCOME" ? "border-emerald-200 bg-emerald-50 text-emerald-700 has-[:checked]:bg-emerald-600 has-[:checked]:text-white" : "border-red-200 bg-red-50 text-red-600 has-[:checked]:bg-red-500 has-[:checked]:text-white"
                      }`}>
                        {t === "INCOME" ? "הכנסה" : "הוצאה"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור *</label>
                <input
                  name="description"
                  required
                  autoFocus
                  defaultValue={editItem?.description ?? ""}
                  placeholder="כרטיסי כניסה / שכר DJ..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סכום (₪) *</label>
                <input
                  name="amount"
                  type="number"
                  required
                  min={0}
                  defaultValue={editItem?.amount ?? ""}
                  placeholder="5000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                <input
                  name="category"
                  defaultValue={editItem?.category ?? ""}
                  list="categories-list"
                  placeholder="הפקה, ציוד, שכר..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
                <datalist id="categories-list">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ספק / גורם</label>
                <input
                  name="vendor"
                  defaultValue={editItem?.vendor ?? ""}
                  placeholder="שם הספק..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={editItem?.date?.split("T")[0] ?? new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPaid"
                  value="true"
                  id="isPaid"
                  defaultChecked={editItem?.isPaid ?? false}
                  className="rounded"
                />
                <label htmlFor="isPaid" className="text-sm text-gray-700">שולם</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editItem?.notes ?? ""}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">
                  {submitting ? "שומר..." : editItem ? "שמור שינויים" : "הוסף"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
