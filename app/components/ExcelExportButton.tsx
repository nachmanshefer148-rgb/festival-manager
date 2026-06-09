"use client";

import { Download } from "lucide-react";
import { buildWorkbook, downloadWorkbook } from "@/lib/excel-utils";

interface Props {
  label?: string;
  filename: string;
  headers: string[];
  getData: () => object[];
  isAdmin?: boolean;
}

export default function ExcelExportButton({ label = "ייצא אקסל", filename, headers, getData, isAdmin = true }: Props) {
  if (!isAdmin) return null;

  function handleExport() {
    const wb = buildWorkbook(headers, getData());
    downloadWorkbook(filename, wb);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
    >
      <Download size={14} />
      {label}
    </button>
  );
}
