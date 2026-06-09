"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, X, Download, Settings2, Pencil, Trash2, Check } from "lucide-react";
import EntityClient, { EntityConfig, EntityActions, EntitySummary } from "@/app/components/EntityClient";
import { buildWorkbook, downloadWorkbook, generateTemplate } from "@/lib/excel-utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import type { BulkVendorItem } from "@/lib/vendor-types";

const CATEGORY_BADGE_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-red-100 text-red-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

const VENDOR_CONFIG_BASE: Omit<EntityConfig, "categories"> = {
  singularLabel: "ספק",
  pluralLabel: "ספקים",
  emptyIcon: "🏢",
  tokenPathPrefix: "/vendor/",
  uploadFolder: "vendor-files",
};

interface Category { id: string; name: string; }

interface Props {
  festivalId: string;
  vendors: (Omit<EntitySummary, "token"> & { vendorToken: string })[];
  categories: Category[];
  isAdmin: boolean;
  canAccessFiles?: boolean;
  showFinancials?: boolean;
  vendorsToken: string | null;
  createVendor: (fd: FormData) => Promise<void>;
  updateVendor: (id: string, fd: FormData) => Promise<void>;
  deleteVendor: (id: string, festivalId: string) => Promise<void>;
  getVendorDetails: (id: string, festivalId: string) => Promise<any>;
  generateVendorsToken: (festivalId: string) => Promise<string>;
  bulkCreateVendors: (festivalId: string, items: BulkVendorItem[]) => Promise<void>;
  createVendorContact: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorContact: (id: string, festivalId: string) => Promise<void>;
  createVendorVehicle: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorVehicle: (id: string, festivalId: string) => Promise<void>;
  createVendorPayment: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleVendorPayment: (id: string, festivalId: string) => Promise<void>;
  deleteVendorPayment: (id: string, festivalId: string) => Promise<void>;
  createVendorFile: (entityId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteVendorFile: (id: string, festivalId: string) => Promise<void>;
  createCategory: (festivalId: string, name: string) => Promise<void>;
  updateCategory: (id: string, festivalId: string, name: string) => Promise<void>;
  deleteCategory: (id: string, festivalId: string) => Promise<void>;
}

export default function VendorClient({
  vendors, getVendorDetails, createVendor, updateVendor, deleteVendor,
  createVendorContact, deleteVendorContact, createVendorVehicle, deleteVendorVehicle,
  createVendorPayment, toggleVendorPayment, deleteVendorPayment, createVendorFile, deleteVendorFile,
  vendorsToken, generateVendorsToken, bulkCreateVendors,
  categories, createCategory, updateCategory, deleteCategory,
  ...rest
}: Props) {
  const { festivalId, isAdmin } = rest;
  const { toast } = useToast();
  const confirm = useConfirm();

  // ── Excel import state ──────────────────────────────────────────────────────
  const [parsedRows, setParsedRows] = useState<BulkVendorItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Category manager state ──────────────────────────────────────────────────
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  // ── Build dynamic config ────────────────────────────────────────────────────
  const categoriesMap: EntityConfig["categories"] = Object.fromEntries(
    categories.map((c, i) => [c.id, { label: c.name, color: CATEGORY_BADGE_COLORS[i % CATEGORY_BADGE_COLORS.length] }])
  );
  const config: EntityConfig = { ...VENDOR_CONFIG_BASE, categories: categoriesMap };

  // ── Excel import ────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const mapped = rows.map(mapRow).filter((r) => r.name);
      setParsedRows(mapped);
      setShowPreview(true);
      setImportDone(false);
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function mapRow(row: Record<string, unknown>): BulkVendorItem {
    const keys = Object.keys(row);
    const find = (...candidates: string[]): string => {
      for (const c of candidates) {
        const k = keys.find((k) => k.trim().toLowerCase().includes(c.toLowerCase()));
        if (k !== undefined) return String(row[k] ?? "").trim();
      }
      return "";
    };
    const rawCategory = find("קטגוריה", "category", "סוג", "type");
    const matchedCategory = rawCategory
      ? categories.find((c) =>
          c.name.toLowerCase().includes(rawCategory.toLowerCase()) ||
          rawCategory.toLowerCase().includes(c.name.toLowerCase())
        )
      : undefined;
    return {
      name: find("שם", "name", "supplier", "ספק"),
      categoryId: matchedCategory?.id ?? categories[0]?.id,
      notes: find("הערות", "notes", "comment") || undefined,
      contactName: find("איש קשר", "contact", "נציג", "representative") || undefined,
      contactPhone: find("טלפון", "phone", "tel", "mobile", "נייד", "פלאפון") || undefined,
      contactEmail: find("מייל", "email", "mail") || undefined,
    };
  }

  async function handleImport() {
    setImporting(true);
    try {
      await bulkCreateVendors(festivalId, parsedRows);
      setImportDone(true);
      setTimeout(() => {
        setShowPreview(false);
        setImportDone(false);
        setParsedRows([]);
      }, 1500);
    } finally {
      setImporting(false);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  function handleExport() {
    const rows = items.map((item) => ({
      "שם": item.name,
      "קטגוריה": categoriesMap[item.category]?.label ?? "",
      "הערות": item.notes ?? "",
      "אנשי קשר": item._count.contacts,
      "רכבים": item._count.vehicles,
    }));
    const data = buildWorkbook(["שם", "קטגוריה", "הערות", "אנשי קשר", "רכבים"], rows);
    downloadWorkbook("vendors.xlsx", data);
  }

  // ── Category manager actions ────────────────────────────────────────────────
  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await createCategory(festivalId, newCatName.trim());
      setNewCatName("");
      toast("קטגוריה נוספה");
    } finally {
      setAddingCat(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editingCatName.trim()) return;
    await updateCategory(id, festivalId, editingCatName.trim());
    setEditingCatId(null);
    toast("קטגוריה עודכנה");
  }

  async function handleDeleteCategory(id: string, name: string) {
    const inUse = items.filter((i) => i.category === id).length;
    const msg = inUse > 0
      ? `למחוק את הקטגוריה "${name}"? ${inUse} ספקים יאבדו את הקטגוריה שלהם.`
      : `למחוק את הקטגוריה "${name}"?`;
    const ok = await confirm({ message: msg, danger: true, confirmLabel: "מחק" });
    if (!ok) return;
    await deleteCategory(id, festivalId);
    toast("קטגוריה נמחקה");
  }

  const TEMPLATE_HEADERS = ["שם", "קטגוריה", "הערות", "איש קשר", "טלפון", "מייל", "רישוי רכב"];

  const items: EntitySummary[] = vendors.map(({ vendorToken, ...v }) => ({ ...v, token: vendorToken }));

  const actions: EntityActions = {
    create: createVendor,
    update: updateVendor,
    delete: deleteVendor,
    getDetails: async (id, festivalId) => {
      const d = await getVendorDetails(id, festivalId);
      if (!d) return null;
      const { vendorToken, ...rest } = d;
      return { ...rest, token: vendorToken };
    },
    createContact: createVendorContact,
    deleteContact: deleteVendorContact,
    createVehicle: createVendorVehicle,
    deleteVehicle: deleteVendorVehicle,
    createPayment: createVendorPayment,
    togglePayment: toggleVendorPayment,
    deletePayment: deleteVendorPayment,
    createFile: createVendorFile,
    deleteFile: deleteVendorFile,
  };

  const importButton = isAdmin ? (
    <>
      {isAdmin && (
        <button
          type="button"
          onClick={() => setShowCategoryManager(true)}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Settings2 size={14} />
          קטגוריות
        </button>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <FileSpreadsheet size={14} />
        ייבא אקסל
      </button>
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        ייצא אקסל
      </button>
      <button
        type="button"
        onClick={() => generateTemplate("template-vendors.xlsx", TEMPLATE_HEADERS)}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        תבנית ריקה
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  ) : null;

  return (
    <>
      <EntityClient
        {...rest}
        items={items}
        config={config}
        actions={actions}
        registrationToken={vendorsToken}
        generateRegistrationToken={generateVendorsToken}
        extraHeaderButtons={importButton}
      />

      {/* Excel import preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">תצוגה מקדימה — ייבוא ספקים</h2>
              <button
                onClick={() => { setShowPreview(false); setParsedRows([]); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {parsedRows.length === 0 ? (
                <p className="text-center text-gray-400 py-8">לא נמצאו שורות עם עמודת שם תקינה</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3">נמצאו <strong>{parsedRows.length}</strong> ספקים לייבוא:</p>
                  <div className="space-y-2">
                    {parsedRows.map((row, i) => {
                      const cat = row.categoryId ? categoriesMap[row.categoryId] : null;
                      return (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">{row.name}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {cat && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cat.color}`}>
                                  {cat.label}
                                </span>
                              )}
                              {row.contactName && <span className="text-xs text-gray-500">{row.contactName}</span>}
                              {row.contactPhone && <span className="text-xs text-gray-400" dir="ltr">{row.contactPhone}</span>}
                            </div>
                            {row.notes && <div className="text-xs text-gray-400 mt-0.5 truncate">{row.notes}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => { setShowPreview(false); setParsedRows([]); }}
                className="text-gray-500 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                ביטול
              </button>
              {importDone ? (
                <span className="text-green-600 text-sm font-medium">✓ יובאו {parsedRows.length} ספקים!</span>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || parsedRows.length === 0}
                  className="bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
                >
                  {importing ? "מייבא..." : `ייבא ${parsedRows.length} ספקים`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category manager modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">ניהול קטגוריות ספקים</h2>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {categories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">אין קטגוריות עדיין</p>
              )}
              {categories.map((cat, i) => {
                const inUse = items.filter((item) => item.category === cat.id).length;
                const isEditing = editingCatId === cat.id;
                return (
                  <div key={cat.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_BADGE_COLORS[i % CATEGORY_BADGE_COLORS.length].split(" ")[0].replace("bg-", "bg-").replace("100", "400")}`} />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(cat.id); if (e.key === "Escape") setEditingCatId(null); }}
                        className="flex-1 text-sm border border-violet-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-violet-200"
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                    )}
                    {inUse > 0 && !isEditing && (
                      <span className="text-xs text-gray-400">{inUse} ספקים</span>
                    )}
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                        className="text-gray-400 hover:text-violet-600 p-1 rounded transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {isEditing ? (
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                  placeholder="שם קטגוריה חדשה..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCat || !newCatName.trim()}
                  className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
                >
                  {addingCat ? "מוסיף..." : "+ הוסף"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
