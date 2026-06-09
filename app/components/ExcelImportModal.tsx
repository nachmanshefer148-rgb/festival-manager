"use client";

import { useState, useRef } from "react";
import { FileSpreadsheet, Download, X } from "lucide-react";
import { parseExcel } from "@/lib/excel-utils";
import { generateTemplate } from "@/lib/excel-utils";
import { useToast } from "@/app/components/Toast";

interface Props {
  entityLabel: string;
  templateHeaders: string[];
  templateFilename: string;
  previewColumns: { label: string; key: string }[];
  onImport: (rows: Record<string, string>[]) => Promise<{ imported: number; skipped: number }>;
  isAdmin?: boolean;
}

export default function ExcelImportModal({
  entityLabel, templateHeaders, templateFilename, previewColumns, onImport, isAdmin = true,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!isAdmin) return null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcel(file);
      setRows(parsed);
      setShowModal(true);
    } catch {
      toast("שגיאה בקריאת הקובץ", "error");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await onImport(rows);
      toast(result.skipped > 0
        ? `יובאו ${result.imported}, דולגו ${result.skipped} שורות שגויות`
        : `יובאו ${result.imported} ${entityLabel}`
      );
      setShowModal(false);
      setRows([]);
    } catch {
      toast("שגיאה בייבוא", "error");
    } finally {
      setImporting(false);
    }
  }

  const preview = rows.slice(0, 5);

  return (
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
        onChange={handleFile}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">ייבוא {entityLabel} מאקסל</h2>
              <button onClick={() => { setShowModal(false); setRows([]); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-gray-500">
                נמצאו <strong>{rows.length}</strong> שורות. מציג {Math.min(5, rows.length)} ראשונות:
              </p>

              {preview.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {previewColumns.map((col) => (
                          <th key={col.key} className="text-right px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          {previewColumns.map((col) => (
                            <td key={col.key} className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{row[col.key] ?? ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                type="button"
                onClick={() => generateTemplate(templateFilename, templateHeaders)}
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                <Download size={13} />
                הורד תבנית ריקה
              </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => { setShowModal(false); setRows([]); }}
                className="text-gray-500 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || rows.length === 0}
                className="bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                {importing ? "מייבא..." : `ייבא ${rows.length} שורות`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
