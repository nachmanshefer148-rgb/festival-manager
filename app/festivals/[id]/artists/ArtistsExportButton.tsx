"use client";

interface ArtistRow {
  name: string;
  genre: string | null;
  status: string | null;
  setDuration: number | null;
  soundcheckDuration: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export default function ArtistsExportButton({ artists }: { artists: ArtistRow[] }) {
  function exportCSV() {
    const BOM = "\uFEFF";
    const header = "שם,ז'אנר,סטטוס,אורך סט (דק'),סאונדצ'ק (דק'),טלפון,אימייל";
    const STATUS_HE: Record<string, string> = {
      confirmed: "מאושר",
      pending: "ממתין",
      cancelled: "בוטל",
    };
    const rows = artists.map((a) =>
      [
        `"${a.name.replace(/"/g, '""')}"`,
        `"${(a.genre ?? "").replace(/"/g, '""')}"`,
        STATUS_HE[a.status ?? "confirmed"] ?? "מאושר",
        a.setDuration ?? "",
        a.soundcheckDuration ?? "",
        `"${(a.contactPhone ?? "").replace(/"/g, '""')}"`,
        `"${(a.contactEmail ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = BOM + [header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "artists.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCSV}
      className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      title="ייצוא CSV"
    >
      ↓ CSV
    </button>
  );
}
