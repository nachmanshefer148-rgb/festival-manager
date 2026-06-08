"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, X } from "lucide-react";
import EntityClient, { EntityConfig, EntityActions, EntitySummary } from "@/app/components/EntityClient";
import type { BulkVendorItem } from "@/lib/vendor-types";

const VENDOR_CONFIG: EntityConfig = {
  singularLabel: "ספק",
  pluralLabel: "ספקים",
  emptyIcon: "🏢",
  tokenPathPrefix: "/vendor/",
  uploadFolder: "vendor-files",
  categories: {
    production: { label: "הפקה", color: "bg-violet-100 text-violet-700" },
    logistics: { label: "לוגיסטיקה", color: "bg-blue-100 text-blue-700" },
    food: { label: "מזון ומשקאות", color: "bg-green-100 text-green-700" },
    security: { label: "אבטחה/רפואה", color: "bg-red-100 text-red-700" },
  },
};

interface Props {
  festivalId: string;
  vendors: (Omit<EntitySummary, "token"> & { vendorToken: string })[];
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
}

function mapCategory(val: string): string {
  const v = (val ?? "").toLowerCase();
  if (v.includes("הפקה") || v.includes("produc")) return "production";
  if (v.includes("לוגי") || v.includes("logis")) return "logistics";
  if (v.includes("מזון") || v.includes("אוכל") || v.includes("food")) return "food";
  if (v.includes("אבטח") || v.includes("רפואה") || v.includes("secur") || v.includes("medical")) return "security";
  return "production";
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
  return {
    name: find("שם", "name", "supplier", "ספק"),
    category: rawCategory ? mapCategory(rawCategory) : "production",
    notes: find("הערות", "notes", "備注", "comment"),
    contactName: find("איש קשר", "contact", "נציג", "representative"),
    contactPhone: find("טלפון", "phone", "tel", "mobile", "נייד", "פלאפון"),
    contactEmail: find("מייל", "email", "mail"),
  };
}

export default function VendorClient({
  vendors, getVendorDetails, createVendor, updateVendor, deleteVendor,
  createVendorContact, deleteVendorContact, createVendorVehicle, deleteVendorVehicle,
  createVendorPayment, toggleVendorPayment, deleteVendorPayment, createVendorFile, deleteVendorFile,
  vendorsToken, generateVendorsToken, bulkCreateVendors,
  ...rest
}: Props) {
  const [parsedRows, setParsedRows] = useState<BulkVendorItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleImport() {
    setImporting(true);
    try {
      await bulkCreateVendors(rest.festivalId, parsedRows);
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

  const importButton = rest.isAdmin ? (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <FileSpreadsheet size={14} />
        ייבא אקסל
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
        config={VENDOR_CONFIG}
        actions={actions}
        registrationToken={vendorsToken}
        generateRegistrationToken={generateVendorsToken}
        extraHeaderButtons={importButton}
      />

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">תצוגה מקדימה — ייבוא ספקים</h2>
              <button
                onClick={() => { setShowPreview(false); setParsedRows([]); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="סגור"
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
                      const cat = VENDOR_CONFIG.categories[row.category ?? "production"];
                      return (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">{row.name}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cat?.color ?? "bg-gray-100 text-gray-600"}`}>
                                {cat?.label ?? row.category}
                              </span>
                              {row.contactName && (
                                <span className="text-xs text-gray-500">{row.contactName}</span>
                              )}
                              {row.contactPhone && (
                                <span className="text-xs text-gray-400" dir="ltr">{row.contactPhone}</span>
                              )}
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
    </>
  );
}
