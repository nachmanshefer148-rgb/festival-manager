"use client";

import { useState, useMemo } from "react";
import { X, Pencil, Trash2, Settings2, Download, Check } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { buildWorkbook, downloadWorkbook, mapColumn } from "@/lib/excel-utils";
import type { BulkBudgetItem } from "@/app/actions/budget";
import ExcelImportModal from "@/app/components/ExcelImportModal";

const VAT_RATE = 0.17;
type VatMode = "NONE" | "INCLUDED" | "ADDED";

function vatBreakdown(amount: number, vatMode: string) {
  if (vatMode === "INCLUDED") {
    const net = Math.round(amount / (1 + VAT_RATE));
    return { net, vat: amount - net, gross: amount };
  }
  if (vatMode === "ADDED") {
    const vat = Math.round(amount * VAT_RATE);
    return { net: amount, vat, gross: amount + vat };
  }
  return { net: amount, vat: 0, gross: amount };
}

interface Category { id: string; name: string; type: string; }

interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string | null;
  categoryName: string | null;
  vatMode: string;
  date: string;
  isPaid: boolean;
  vendor: string | null;
  notes: string | null;
}

interface Props {
  festivalId: string;
  items: BudgetItem[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  vendorNames: string[];
  isAdmin: boolean;
  createBudgetItem: (formData: FormData) => Promise<void>;
  deleteBudgetItem: (id: string, festivalId: string) => Promise<void>;
  updateBudgetItem: (id: string, formData: FormData) => Promise<void>;
  toggleBudgetItemPaid: (id: string, isPaid: boolean, festivalId: string) => Promise<void>;
  createCategory: (festivalId: string, name: string, type: "INCOME" | "EXPENSE") => Promise<void>;
  updateCategory: (id: string, festivalId: string, name: string) => Promise<void>;
  deleteCategory: (id: string, festivalId: string) => Promise<void>;
  bulkCreateBudgetItems: (festivalId: string, items: BulkBudgetItem[]) => Promise<{ created: number; skipped: number }>;
}

const TEMPLATE_HEADERS = ["תיאור", "סוג", "קטגוריה", "ספק/גורם", "סכום", 'מע"מ (ללא/כולל/פלוס)', "שולם (כן/לא)", "תאריך", "הערות"];

const VAT_LABEL: Record<VatMode, string> = {
  NONE: 'ללא מע"מ',
  INCLUDED: 'כולל מע"מ',
  ADDED: 'פלוס מע"מ',
};

export default function BudgetClient({
  festivalId, items, expenseCategories, incomeCategories, vendorNames, isAdmin,
  createBudgetItem, deleteBudgetItem, updateBudgetItem, toggleBudgetItemPaid,
  createCategory, updateCategory, deleteCategory, bulkCreateBudgetItems,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();

  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [catTab, setCatTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  // Controlled form state
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formVatMode, setFormVatMode] = useState<VatMode>("NONE");
  const [formAmount, setFormAmount] = useState("");

  const allCategories = [...expenseCategories, ...incomeCategories];
  const anyVat = items.some((i) => i.vatMode !== "NONE");

  const filtered = useMemo(() => {
    let list = items;
    if (filterType !== "ALL") list = list.filter((i) => i.type === filterType);
    if (filterCategoryId) list = list.filter((i) => i.categoryId === filterCategoryId);
    return list;
  }, [items, filterType, filterCategoryId]);

  const totalsByType = useMemo(() => {
    const calc = (type: "INCOME" | "EXPENSE") => {
      return items.filter((i) => i.type === type).reduce(
        (acc, i) => {
          const b = vatBreakdown(i.amount, i.vatMode);
          return { gross: acc.gross + b.gross, vat: acc.vat + b.vat, net: acc.net + b.net };
        },
        { gross: 0, vat: 0, net: 0 }
      );
    };
    return { income: calc("INCOME"), expense: calc("EXPENSE") };
  }, [items]);

  const balance = totalsByType.income.net - totalsByType.expense.net;

  const visibleCategories = filterType === "INCOME" ? incomeCategories : filterType === "EXPENSE" ? expenseCategories : allCategories;

  const breakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; net: number; vat: number; gross: number }>();
    for (const item of filtered) {
      const key = item.categoryId ?? "__none__";
      const label = item.categoryName ?? "ללא קטגוריה";
      const b = vatBreakdown(item.amount, item.vatMode);
      const prev = map.get(key) ?? { name: label, count: 0, net: 0, vat: 0, gross: 0 };
      map.set(key, { name: label, count: prev.count + 1, net: prev.net + b.net, vat: prev.vat + b.vat, gross: prev.gross + b.gross });
    }
    return [...map.values()].sort((a, b) => b.gross - a.gross);
  }, [filtered]);

  function openAdd(type: "INCOME" | "EXPENSE") {
    setEditItem(null);
    setFormType(type);
    setFormVatMode(type === "INCOME" ? "INCLUDED" : "ADDED");
    setFormAmount("");
    setShowForm(true);
  }

  function openEdit(item: BudgetItem) {
    setEditItem(item);
    setFormType(item.type);
    setFormVatMode(
      item.vatMode === "INCLUDED" || item.vatMode === "ADDED"
        ? (item.vatMode as VatMode)
        : item.type === "INCOME" ? "INCLUDED" : "ADDED"
    );
    setFormAmount(String(item.amount));
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditItem(null); }

  const previewAmount = parseInt(formAmount) || 0;
  const preview = vatBreakdown(previewAmount, formVatMode);

  function handleExport() {
    const rows = filtered.map((item) => {
      const b = vatBreakdown(item.amount, item.vatMode);
      return {
        "תיאור": item.description,
        "סוג": item.type === "INCOME" ? "הכנסה" : "הוצאה",
        "קטגוריה": item.categoryName ?? "",
        "ספק/גורם": item.vendor ?? "",
        "סכום": b.gross,
        'מע"מ': item.vatMode === "NONE" ? "ללא" : item.vatMode === "INCLUDED" ? "כולל" : "פלוס",
        'מע"מ בש"ח': b.vat || "",
        "נטו": b.net,
        "שולם": item.isPaid ? "כן" : "לא",
        "תאריך": item.date.split("T")[0],
        "הערות": item.notes ?? "",
      };
    });
    const wb = buildWorkbook(
      ["תיאור", "סוג", "קטגוריה", "ספק/גורם", "סכום", 'מע"מ', 'מע"מ בש"ח', "נטו", "שולם", "תאריך", "הערות"],
      rows
    );
    downloadWorkbook("budget.xlsx", wb);
  }

  async function handleImport(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
    const mapped: BulkBudgetItem[] = rows.map((row) => {
      const rawType = mapColumn(row, ["סוג", "type"]).toLowerCase();
      const type: "INCOME" | "EXPENSE" = rawType.includes("הכנסה") || rawType.includes("income") ? "INCOME" : "EXPENSE";
      const rawCat = mapColumn(row, ["קטגוריה", "category"]);
      const catPool = type === "INCOME" ? incomeCategories : expenseCategories;
      const matchedCat = rawCat
        ? catPool.find((c) => c.name.toLowerCase().includes(rawCat.toLowerCase()) || rawCat.toLowerCase().includes(c.name.toLowerCase()))
        : undefined;
      const rawDate = mapColumn(row, ["תאריך", "date"]);
      let parsedDate: string | undefined;
      if (rawDate) {
        const ddmm = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        parsedDate = ddmm ? `${ddmm[3]}-${ddmm[2].padStart(2, "0")}-${ddmm[1].padStart(2, "0")}` : rawDate;
      }
      const rawVat = mapColumn(row, ['מע"מ', "vat", "מעמ"]).toLowerCase();
      const vatMode = rawVat.includes("כולל") || rawVat === "included" ? "INCLUDED"
        : rawVat.includes("פלוס") || rawVat === "added" ? "ADDED"
        : "NONE";
      const rawPaid = mapColumn(row, ["שולם", "paid"]).toLowerCase();
      return {
        description: mapColumn(row, ["תיאור", "description", "שם"]),
        type,
        categoryId: matchedCat?.id,
        vendor: mapColumn(row, ["ספק", "vendor", "גורם"]) || undefined,
        amount: parseFloat(mapColumn(row, ["סכום", "amount", "מחיר"]).replace(/,/g, "")) || 0,
        vatMode,
        isPaid: rawPaid === "כן" || rawPaid === "yes" || rawPaid === "true",
        date: parsedDate,
        notes: mapColumn(row, ["הערות", "notes"]) || undefined,
      };
    });
    const r = await bulkCreateBudgetItems(festivalId, mapped);
    return { imported: r.created, skipped: r.skipped };
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await createCategory(festivalId, newCatName.trim(), catTab);
      setNewCatName("");
      toast("קטגוריה נוספה");
    } finally { setAddingCat(false); }
  }

  async function handleSaveEditCat(id: string) {
    if (!editingCatName.trim()) return;
    await updateCategory(id, festivalId, editingCatName.trim());
    setEditingCatId(null);
    toast("קטגוריה עודכנה");
  }

  async function handleDeleteCat(cat: Category) {
    const inUse = items.filter((i) => i.categoryId === cat.id).length;
    const msg = inUse > 0
      ? `למחוק את הקטגוריה "${cat.name}"? ${inUse} פריטים יאבדו את הקטגוריה.`
      : `למחוק את הקטגוריה "${cat.name}"?`;
    const ok = await confirm({ message: msg, danger: true, confirmLabel: "מחק" });
    if (!ok) return;
    await deleteCategory(cat.id, festivalId);
    toast("קטגוריה נמחקה");
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white";
  const currentCategories = catTab === "EXPENSE" ? expenseCategories : incomeCategories;

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">💰 תקציב</h1>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button onClick={() => setShowCategoryManager(true)} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Settings2 size={14} />קטגוריות
            </button>
          )}
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={14} />ייצא Excel
          </button>
          {isAdmin && (
            <ExcelImportModal
              entityLabel="פריטי תקציב"
              templateHeaders={TEMPLATE_HEADERS}
              templateFilename="template-budget.xlsx"
              previewColumns={[
                { label: "תיאור", key: "תיאור" },
                { label: "סוג", key: "סוג" },
                { label: "קטגוריה", key: "קטגוריה" },
                { label: "סכום", key: "סכום" },
              ]}
              onImport={handleImport}
            />
          )}
          {isAdmin && (
            <>
              <button onClick={() => openAdd("INCOME")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">+ הכנסה</button>
              <button onClick={() => openAdd("EXPENSE")} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">+ הוצאה</button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">הכנסות</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalsByType.income.gross)}</p>
          {anyVat && totalsByType.income.vat > 0 && (
            <p className="text-xs text-emerald-500 mt-1">נטו {formatCurrency(totalsByType.income.net)} | מע"מ {formatCurrency(totalsByType.income.vat)}</p>
          )}
          <p className="text-xs text-emerald-400 mt-0.5">{items.filter((i) => i.type === "INCOME").length} פריטים</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">הוצאות</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalsByType.expense.gross)}</p>
          {anyVat && totalsByType.expense.vat > 0 && (
            <p className="text-xs text-red-400 mt-1">נטו {formatCurrency(totalsByType.expense.net)} | מע"מ {formatCurrency(totalsByType.expense.vat)}</p>
          )}
          <p className="text-xs text-red-400 mt-0.5">{items.filter((i) => i.type === "EXPENSE").length} פריטים</p>
        </div>
        <div className={`rounded-2xl p-4 border ${balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-xs font-medium mb-1 ${balance >= 0 ? "text-blue-600" : "text-orange-600"}`}>יתרה נטו</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-600"}`}>{formatCurrency(balance)}</p>
          {anyVat && <p className={`text-xs mt-1 ${balance >= 0 ? "text-blue-400" : "text-orange-400"}`}>גרוס {formatCurrency(totalsByType.income.gross - totalsByType.expense.gross)}</p>}
          <p className={`text-xs mt-0.5 ${balance >= 0 ? "text-blue-400" : "text-orange-400"}`}>{balance >= 0 ? "✓ חיובי" : "⚠ גירעון"}</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
          <button key={t} onClick={() => { setFilterType(t); setFilterCategoryId(null); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterType === t ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t === "ALL" ? `הכל (${items.length})` : t === "INCOME" ? `הכנסות (${items.filter((i) => i.type === "INCOME").length})` : `הוצאות (${items.filter((i) => i.type === "EXPENSE").length})`}
          </button>
        ))}
      </div>

      {/* Category filter */}
      {visibleCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setFilterCategoryId(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterCategoryId === null ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            כל הקטגוריות
          </button>
          {visibleCategories.map((c) => (
            <button key={c.id} onClick={() => setFilterCategoryId(filterCategoryId === c.id ? null : c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterCategoryId === c.id ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c.name} ({items.filter((i) => i.categoryId === c.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        isAdmin && items.length === 0 ? (
          <button onClick={() => openAdd("EXPENSE")}
            className="w-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group">
            <div className="text-4xl mb-2">💸</div>
            <p className="font-medium">עדיין אין פריטים בתקציב</p>
            <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספת פריט ראשון</p>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">💸</div>
            <p className="font-medium">לא נמצאו תוצאות</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">תיאור</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">קטגוריה</th>
                  {anyVat && <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">נטו</th>}
                  {anyVat && <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">מע"מ</th>}
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">סה"כ</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">תאריך</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">שולם</th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const b = vatBreakdown(item.amount, item.vatMode);
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === "INCOME" ? "bg-emerald-400" : "bg-red-400"}`} />
                          <div>
                            <p className="font-medium text-gray-900">{item.description}</p>
                            {item.vendor && <p className="text-xs text-gray-400">{item.vendor}</p>}
                            {item.vatMode !== "NONE" && (
                              <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                {VAT_LABEL[item.vatMode as VatMode]}
                              </span>
                            )}
                            {item.notes && <p className="text-xs text-gray-400 truncate max-w-48">{item.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {item.categoryName ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs">{item.categoryName}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      {anyVat && (
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                          {item.vatMode !== "NONE" ? formatCurrency(b.net) : <span className="text-gray-300">—</span>}
                        </td>
                      )}
                      {anyVat && (
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                          {item.vatMode !== "NONE" ? formatCurrency(b.vat) : <span className="text-gray-300">—</span>}
                        </td>
                      )}
                      <td className={`px-4 py-3 font-semibold ${item.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                        {item.type === "EXPENSE" ? "-" : "+"}{formatCurrency(b.gross)}
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
                            <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-violet-600 transition-colors px-2 py-1 rounded hover:bg-violet-50"><Pencil size={14} /></button>
                            <button onClick={async () => {
                              const ok = await confirm({ message: "למחוק פריט זה?", danger: true, confirmLabel: "מחק" });
                              if (ok) { await deleteBudgetItem(item.id, festivalId); toast("הפריט נמחק"); }
                            }} className="text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakdown by category */}
      {breakdown.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">פירוט לפי קטגוריה</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">קטגוריה</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">פריטים</th>
                  {anyVat && <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">נטו</th>}
                  {anyVat && <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">מע"מ</th>}
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-2 text-gray-500">{row.count}</td>
                    {anyVat && <td className="px-4 py-2 text-gray-600">{formatCurrency(row.net)}</td>}
                    {anyVat && <td className="px-4 py-2 text-gray-500 text-xs">{row.vat > 0 ? formatCurrency(row.vat) : "—"}</td>}
                    <td className="px-4 py-2 font-semibold text-gray-800">{formatCurrency(row.gross)}</td>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editItem ? "עריכת פריט" : formType === "INCOME" ? "הוסף הכנסה" : "הוסף הוצאה"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
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
                  closeForm();
                } catch (err) {
                  console.error("Budget save error:", err);
                  toast("שגיאה בשמירה");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <input type="hidden" name="festivalId" value={festivalId} />
              {/* type is submitted via hidden input; buttons are decorative */}
              <input type="hidden" name="type" value={formType} />
              <input type="hidden" name="vatMode" value={formVatMode} />

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                <div className="flex gap-2">
                  {(["INCOME", "EXPENSE"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setFormType(t)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        formType === t
                          ? t === "INCOME" ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-500 text-white border-red-500"
                          : t === "INCOME" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"
                      }`}>
                      {t === "INCOME" ? "הכנסה" : "הוצאה"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור *</label>
                <input name="description" required autoFocus defaultValue={editItem?.description ?? ""}
                  placeholder="כרטיסי כניסה / שכר DJ..." className={inputCls} />
              </div>

              {/* VAT mode toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מע"מ</label>
                <div className="flex gap-2">
                  {(["INCLUDED", "ADDED"] as VatMode[]).map((mode) => (
                    <button key={mode} type="button"
                      onClick={() => setFormVatMode(mode)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                        formVatMode === mode
                          ? "bg-amber-500 text-white border-amber-500"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}>
                      {VAT_LABEL[mode]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formVatMode === "INCLUDED" ? 'סכום כולל מע"מ (₪) *' : formVatMode === "ADDED" ? 'סכום לפני מע"מ (₪) *' : "סכום (₪) *"}
                </label>
                <input name="amount" type="number" required min={1}
                  value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="5000" className={inputCls} />
                {formVatMode !== "NONE" && previewAmount > 0 && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 flex gap-4">
                    {formVatMode === "INCLUDED" ? (
                      <>
                        <span>נטו: <b>{formatCurrency(preview.net)}</b></span>
                        <span>מע"מ 17%: <b>{formatCurrency(preview.vat)}</b></span>
                      </>
                    ) : (
                      <>
                        <span>מע"מ 17%: <b>{formatCurrency(preview.vat)}</b></span>
                        <span>סה"כ לתשלום: <b>{formatCurrency(preview.gross)}</b></span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                <select name="categoryId" defaultValue={editItem?.categoryId ?? ""} className={inputCls}>
                  <option value="">ללא קטגוריה</option>
                  {(formType === "INCOME" ? incomeCategories : expenseCategories).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ספק / גורם</label>
                <input name="vendor" defaultValue={editItem?.vendor ?? ""} list="vendor-list"
                  placeholder="שם הספק..." className={inputCls} />
                <datalist id="vendor-list">
                  {vendorNames.map((v) => <option key={v} value={v} />)}
                </datalist>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input name="date" type="date"
                  defaultValue={editItem?.date?.split("T")[0] ?? new Date().toISOString().split("T")[0]}
                  className={inputCls} />
              </div>

              {/* Paid */}
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isPaid" value="true" id="isPaid"
                  defaultChecked={editItem?.isPaid ?? false} className="rounded" />
                <label htmlFor="isPaid" className="text-sm text-gray-700">שולם</label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                <textarea name="notes" rows={2} defaultValue={editItem?.notes ?? ""}
                  className={`${inputCls} resize-none`} />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">
                  {submitting ? "שומר..." : editItem ? "שמור שינויים" : "הוסף"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">ניהול קטגוריות תקציב</h2>
              <button onClick={() => setShowCategoryManager(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex border-b border-gray-100">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button key={t} onClick={() => { setCatTab(t); setEditingCatId(null); setNewCatName(""); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${catTab === t ? "border-b-2 border-violet-600 text-violet-600" : "text-gray-500 hover:text-gray-700"}`}>
                  {t === "EXPENSE" ? "הוצאות" : "הכנסות"}
                </button>
              ))}
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {currentCategories.length === 0 && <p className="text-sm text-gray-400 text-center py-4">אין קטגוריות עדיין</p>}
              {currentCategories.map((cat) => {
                const inUse = items.filter((i) => i.categoryId === cat.id).length;
                const isEditing = editingCatId === cat.id;
                return (
                  <div key={cat.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    {isEditing ? (
                      <input autoFocus value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditCat(cat.id); if (e.key === "Escape") setEditingCatId(null); }}
                        className="flex-1 text-sm border border-violet-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                    ) : (
                      <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                    )}
                    {inUse > 0 && !isEditing && <span className="text-xs text-gray-400">{inUse} פריטים</span>}
                    {isEditing ? (
                      <button onClick={() => handleSaveEditCat(cat.id)} className="text-green-600 hover:text-green-700 p-1 rounded"><Check size={14} /></button>
                    ) : (
                      <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="text-gray-400 hover:text-violet-600 p-1 rounded"><Pencil size={13} /></button>
                    )}
                    {isEditing ? (
                      <button onClick={() => setEditingCatId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded"><X size={13} /></button>
                    ) : (
                      <button onClick={() => handleDeleteCat(cat)} className="text-gray-400 hover:text-red-500 p-1 rounded"><Trash2 size={13} /></button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                  placeholder={`קטגוריית ${catTab === "EXPENSE" ? "הוצאה" : "הכנסה"} חדשה...`}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
                <button type="button" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}
                  className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60">
                  {addingCat ? "מוסיף..." : "+ הוסף"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
