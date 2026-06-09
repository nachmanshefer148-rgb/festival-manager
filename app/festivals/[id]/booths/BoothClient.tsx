"use client";

import { useState } from "react";
import { X, Download, Settings2, Pencil, Trash2, Check } from "lucide-react";
import EntityClient, { EntityConfig, EntityActions, EntitySummary, EntityApplication } from "@/app/components/EntityClient";
import ExcelImportModal from "@/app/components/ExcelImportModal";
import { mapColumn, buildWorkbook, downloadWorkbook, generateTemplate } from "@/lib/excel-utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { BulkBoothItem } from "@/app/actions/booths";

const CATEGORY_BADGE_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-red-100 text-red-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

const BOOTH_CONFIG_BASE: Omit<EntityConfig, "categories"> = {
  singularLabel: "דוכן",
  pluralLabel: "דוכנים",
  emptyIcon: "🛒",
  tokenPathPrefix: "/booth/",
  uploadFolder: "booth-files",
};

const TEMPLATE_HEADERS = ["שם", "קטגוריה", "הערות", "איש קשר", "טלפון", "מייל", "רישוי רכב"];
const PREVIEW_COLUMNS = [
  { label: "שם", key: "שם" },
  { label: "קטגוריה", key: "קטגוריה" },
  { label: "איש קשר", key: "איש קשר" },
  { label: "טלפון", key: "טלפון" },
];

interface Category { id: string; name: string; }

interface Props {
  festivalId: string;
  booths: (Omit<EntitySummary, "token"> & { boothToken: string })[];
  categories: Category[];
  applications: (Omit<EntityApplication, "name"> & { boothName: string })[];
  boothsToken: string | null;
  isAdmin: boolean;
  canAccessFiles?: boolean;
  showFinancials?: boolean;
  createBooth: (fd: FormData) => Promise<void>;
  updateBooth: (id: string, fd: FormData) => Promise<void>;
  deleteBooth: (id: string, festivalId: string) => Promise<void>;
  getBoothDetails: (id: string, festivalId: string) => Promise<any>;
  generateBoothsToken: (festivalId: string) => Promise<string>;
  approveBoothApplication: (id: string, festivalId: string) => Promise<void>;
  rejectBoothApplication: (id: string, festivalId: string) => Promise<void>;
  createBoothContact: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteBoothContact: (id: string, festivalId: string) => Promise<void>;
  createBoothVehicle: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteBoothVehicle: (id: string, festivalId: string) => Promise<void>;
  createBoothPayment: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleBoothPayment: (id: string, festivalId: string) => Promise<void>;
  deleteBoothPayment: (id: string, festivalId: string) => Promise<void>;
  createBoothFile: (entityId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteBoothFile: (id: string, festivalId: string) => Promise<void>;
  createCategory: (festivalId: string, name: string) => Promise<void>;
  updateCategory: (id: string, festivalId: string, name: string) => Promise<void>;
  deleteCategory: (id: string, festivalId: string) => Promise<void>;
}

export default function BoothClient({
  booths, categories, applications, boothsToken, getBoothDetails, generateBoothsToken,
  approveBoothApplication, rejectBoothApplication,
  createBooth, updateBooth, deleteBooth,
  createBoothContact, deleteBoothContact, createBoothVehicle, deleteBoothVehicle,
  createBoothPayment, toggleBoothPayment, deleteBoothPayment,
  createBoothFile, deleteBoothFile,
  createCategory, updateCategory, deleteCategory,
  ...rest
}: Props) {
  const { festivalId, isAdmin } = rest;
  const { toast } = useToast();
  const confirm = useConfirm();

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
  const config: EntityConfig = { ...BOOTH_CONFIG_BASE, categories: categoriesMap };

  const items: EntitySummary[] = booths.map(({ boothToken, ...b }) => ({ ...b, token: boothToken }));
  const apps: EntityApplication[] = applications.map(({ boothName, ...a }) => ({ ...a, name: boothName }));

  const actions: EntityActions = {
    create: createBooth,
    update: updateBooth,
    delete: deleteBooth,
    getDetails: async (id, fid) => {
      const d = await getBoothDetails(id, fid);
      if (!d) return null;
      const { boothToken, ...rest } = d;
      return { ...rest, token: boothToken };
    },
    createContact: createBoothContact,
    deleteContact: deleteBoothContact,
    createVehicle: createBoothVehicle,
    deleteVehicle: deleteBoothVehicle,
    createPayment: createBoothPayment,
    togglePayment: toggleBoothPayment,
    deletePayment: deleteBoothPayment,
    createFile: createBoothFile,
    deleteFile: deleteBoothFile,
  };

  // ── Excel import ────────────────────────────────────────────────────────────
  async function handleImport(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
    const mapped: BulkBoothItem[] = rows.map((row) => {
      const rawCategory = mapColumn(row, ["קטגוריה", "category", "סוג", "type"]);
      const matchedCategory = rawCategory
        ? categories.find((c) =>
            c.name.toLowerCase().includes(rawCategory.toLowerCase()) ||
            rawCategory.toLowerCase().includes(c.name.toLowerCase())
          )
        : undefined;
      return {
        name: mapColumn(row, ["שם", "name", "דוכן", "booth"]),
        categoryId: matchedCategory?.id ?? categories[0]?.id,
        notes: mapColumn(row, ["הערות", "notes", "comment"]) || undefined,
        contactName: mapColumn(row, ["איש קשר", "contact", "נציג"]) || undefined,
        contactPhone: mapColumn(row, ["טלפון", "phone", "נייד"]) || undefined,
        contactEmail: mapColumn(row, ["מייל", "email"]) || undefined,
        vehiclePlate: mapColumn(row, ["רישוי רכב", "plate", "רישוי"]) || undefined,
      };
    });
    const r = await import("@/app/actions/booths").then((m) => m.bulkCreateBooths(festivalId, mapped));
    return { imported: r.created, skipped: r.skipped };
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
    const wb = buildWorkbook(["שם", "קטגוריה", "הערות", "אנשי קשר", "רכבים"], rows);
    downloadWorkbook("booths.xlsx", wb);
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
      ? `למחוק את הקטגוריה "${name}"? ${inUse} דוכנים יאבדו את הקטגוריה שלהם.`
      : `למחוק את הקטגוריה "${name}"?`;
    const ok = await confirm({ message: msg, danger: true, confirmLabel: "מחק" });
    if (!ok) return;
    await deleteCategory(id, festivalId);
    toast("קטגוריה נמחקה");
  }

  const extraButtons = isAdmin ? (
    <>
      <button
        type="button"
        onClick={() => setShowCategoryManager(true)}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Settings2 size={14} />
        קטגוריות
      </button>
      <ExcelImportModal
        entityLabel="דוכנים"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="template-booths.xlsx"
        previewColumns={PREVIEW_COLUMNS}
        onImport={handleImport}
      />
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
        onClick={() => generateTemplate("template-booths.xlsx", TEMPLATE_HEADERS)}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        תבנית ריקה
      </button>
    </>
  ) : null;

  return (
    <>
      <EntityClient
        {...rest}
        items={items}
        config={config}
        actions={actions}
        applications={apps}
        registrationToken={boothsToken}
        generateRegistrationToken={generateBoothsToken}
        approveApplication={approveBoothApplication}
        rejectApplication={rejectBoothApplication}
        extraHeaderButtons={extraButtons}
      />

      {/* Category manager modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">ניהול קטגוריות דוכנים</h2>
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
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_BADGE_COLORS[i % CATEGORY_BADGE_COLORS.length].split(" ")[0].replace("100", "400")}`} />
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
                      <span className="text-xs text-gray-400">{inUse} דוכנים</span>
                    )}
                    {isEditing ? (
                      <button onClick={() => handleSaveEdit(cat.id)} className="text-green-600 hover:text-green-700 p-1 rounded transition-colors">
                        <Check size={14} />
                      </button>
                    ) : (
                      <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="text-gray-400 hover:text-violet-600 p-1 rounded transition-colors">
                        <Pencil size={13} />
                      </button>
                    )}
                    {isEditing ? (
                      <button onClick={() => setEditingCatId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                        <X size={13} />
                      </button>
                    ) : (
                      <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors">
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
