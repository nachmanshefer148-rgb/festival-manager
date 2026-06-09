import * as XLSX from "xlsx";

export function parseExcel(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        resolve(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v ?? "").trim()]))));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function mapColumn(row: Record<string, string>, aliases: string[]): string {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const key = keys.find((k) => k.toLowerCase().includes(alias.toLowerCase()));
    if (key !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

export function buildWorkbook(headers: string[], rows: object[]): Uint8Array {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "גיליון 1");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

export function downloadWorkbook(filename: string, data: Uint8Array) {
  const blob = new Blob(
    [data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateTemplate(filename: string, headers: string[]) {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "גיליון 1");
  const data: Uint8Array = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadWorkbook(filename, data);
}
