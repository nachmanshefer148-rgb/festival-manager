"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, LayoutGrid, List, ExternalLink, Download, Phone, Mail } from "lucide-react";
import { useToast } from "@/app/components/Toast";
import ExcelImportModal from "@/app/components/ExcelImportModal";
import { generateTemplate, buildWorkbook, downloadWorkbook, mapColumn } from "@/lib/excel-utils";
import { bulkCreateArtists, BulkArtistItem } from "@/app/actions/artists";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "מאושר",
  pending: "ממתין",
  cancelled: "בוטל",
};
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
};

const TEMPLATE_HEADERS = ["שם", "ז'אנר", "סטטוס", "שכר", "משך הופעה", "טלפון", "מייל", "איש קשר", "טלפון איש קשר", "רישוי רכב"];
const PREVIEW_COLUMNS = [
  { label: "שם", key: "שם" },
  { label: "ז'אנר", key: "ז'אנר" },
  { label: "סטטוס", key: "סטטוס" },
  { label: "טלפון", key: "טלפון" },
];

interface ArtistContact { id: string; name: string; role: string | null; phone: string | null; email: string | null; }
interface ArtistVehicle { id: string; plateNumber: string; }

export interface ArtistSummary {
  id: string;
  name: string;
  genre: string | null;
  status: string;
  fee: number | null;
  setDuration: number;
  contactPhone: string | null;
  contactEmail: string | null;
  artistToken: string;
  festivalId: string;
  contacts: ArtistContact[];
  vehicles: ArtistVehicle[];
  timeSlots: { status: string }[];
}

interface Props {
  festivalId: string;
  artists: ArtistSummary[];
  isAdmin: boolean;
  addArtistButton: React.ReactNode;
}

export default function ArtistsClient({ festivalId, artists, isAdmin, addArtistButton }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("viewMode:אמן");
    if (stored === "list" || stored === "cards") setViewMode(stored);
  }, []);

  function toggleView(mode: "cards" | "list") {
    setViewMode(mode);
    localStorage.setItem("viewMode:אמן", mode);
  }

  const filtered = artists.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || (a.genre ?? "").toLowerCase().includes(q) || (a.contactPhone ?? "").includes(q);
    }
    return true;
  });

  async function handleImport(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
    const items: BulkArtistItem[] = rows.map((row) => ({
      name: mapColumn(row, ["שם", "name", "אמן", "artist"]),
      genre: mapColumn(row, ["ז'אנר", "genre", "סגנון", "style"]) || undefined,
      status: mapColumn(row, ["סטטוס", "status"]) || undefined,
      fee: parseFloat(mapColumn(row, ["שכר", "fee", "תשלום", "מחיר"])) || undefined,
      setDuration: parseInt(mapColumn(row, ["משך הופעה", "setduration", "משך", "duration"])) || undefined,
      contactPhone: mapColumn(row, ["טלפון", "phone", "נייד", "mobile"]) || undefined,
      contactEmail: mapColumn(row, ["מייל", "email"]) || undefined,
      contactName: mapColumn(row, ["איש קשר", "contact", "נציג"]) || undefined,
      contactPhone2: mapColumn(row, ["טלפון איש קשר", "contact phone"]) || undefined,
      vehiclePlate: mapColumn(row, ["רישוי רכב", "plate", "רישוי", "vehicle"]) || undefined,
    }));
    const r = await bulkCreateArtists(festivalId, items);
    return { imported: r.created, skipped: r.skipped };
  }

  function handleExport() {
    const rows = artists.map((a) => ({
      "שם": a.name,
      "ז'אנר": a.genre ?? "",
      "סטטוס": STATUS_LABELS[a.status] ?? a.status,
      "שכר": a.fee ?? "",
      "משך הופעה": a.setDuration,
      "טלפון": a.contactPhone ?? "",
      "מייל": a.contactEmail ?? "",
      "איש קשר": a.contacts[0]?.name ?? "",
      "טלפון איש קשר": a.contacts[0]?.phone ?? "",
      "רישוי רכב": a.vehicles.map((v) => v.plateNumber).join(", "),
    }));
    const wb = buildWorkbook(TEMPLATE_HEADERS, rows);
    downloadWorkbook("artists.xlsx", wb);
  }

  const quickArtist = quickViewId ? artists.find((a) => a.id === quickViewId) : null;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">🎤 אמנים</h1>
          {artists.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">{artists.length}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              <ExcelImportModal
                entityLabel="אמנים"
                templateHeaders={TEMPLATE_HEADERS}
                templateFilename="template-artists.xlsx"
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
                onClick={() => generateTemplate("template-artists.xlsx", TEMPLATE_HEADERS)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                תבנית ריקה
              </button>
            </>
          )}
          {addArtistButton}
        </div>
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="חפש אמנים..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-1.5 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
          />
          {search && <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>
        <div className="flex gap-2 flex-wrap flex-1">
          {[{ key: "all", label: "הכל" }, { key: "confirmed", label: "מאושר" }, { key: "pending", label: "ממתין" }, { key: "cancelled", label: "בוטל" }].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === key ? "bg-violet-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden shrink-0">
          <button onClick={() => toggleView("cards")} title="תצוגת כרטיסים" className={`p-2 transition-colors ${viewMode === "cards" ? "bg-violet-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => toggleView("list")} title="תצוגת רשימה" className={`p-2 transition-colors border-r border-gray-200 ${viewMode === "list" ? "bg-violet-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🎤</div>
          <p className="text-lg font-medium">{artists.length === 0 ? "עדיין אין אמנים" : "לא נמצאו תוצאות"}</p>
        </div>
      )}

      {/* Cards view */}
      {filtered.length > 0 && viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const scheduled = a.timeSlots.filter((s) => s.status === "SCHEDULED").length;
            return (
              <div key={a.id} onClick={() => setQuickViewId(a.id)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">{a.name}</h2>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {a.genre && <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">{a.genre}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? STATUS_COLORS.confirmed}`}>
                        {STATUS_LABELS[a.status] ?? "מאושר"}
                      </span>
                    </div>
                  </div>
                  <Link href={`/festivals/${festivalId}/artists/${a.id}`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg bg-gray-100 hover:bg-violet-100 text-gray-500 hover:text-violet-700 transition-colors shrink-0" title="פתח דף מלא">
                    <ExternalLink size={14} />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-2">
                  {a.contactPhone && <span className="flex items-center gap-1"><Phone size={11} />{a.contactPhone}</span>}
                  {scheduled > 0 && <span className="text-violet-500 font-medium">{scheduled} הופעות</span>}
                  {a.fee && <span>₪{a.fee.toLocaleString()}</span>}
                  <span>{a.setDuration}′</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">שם</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">ז'אנר</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">סטטוס</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">טלפון</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">שכר</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} onClick={() => setQuickViewId(a.id)} className={`border-b border-gray-100 hover:bg-violet-50 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.genre ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? STATUS_COLORS.confirmed}`}>
                        {STATUS_LABELS[a.status] ?? "מאושר"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell" dir="ltr">{a.contactPhone ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.fee ? `₪${a.fee.toLocaleString()}` : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/festivals/${festivalId}/artists/${a.id}`} className="p-1.5 rounded-lg hover:bg-violet-100 text-gray-400 hover:text-violet-700 transition-colors inline-flex" title="פתח דף מלא">
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick view modal */}
      {quickArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{quickArtist.name}</h2>
                <div className="flex gap-1.5 mt-1">
                  {quickArtist.genre && <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{quickArtist.genre}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[quickArtist.status] ?? STATUS_COLORS.confirmed}`}>
                    {STATUS_LABELS[quickArtist.status] ?? "מאושר"}
                  </span>
                </div>
              </div>
              <button onClick={() => setQuickViewId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {quickArtist.contactPhone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <a href={`tel:${quickArtist.contactPhone}`} dir="ltr" className="hover:text-violet-600">{quickArtist.contactPhone}</a>
                  </div>
                )}
                {quickArtist.contactEmail && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <a href={`mailto:${quickArtist.contactEmail}`} className="hover:text-violet-600 truncate">{quickArtist.contactEmail}</a>
                  </div>
                )}
                {quickArtist.fee && (
                  <div className="text-gray-700"><span className="text-gray-400 text-xs block">שכר</span>₪{quickArtist.fee.toLocaleString()}</div>
                )}
                <div className="text-gray-700"><span className="text-gray-400 text-xs block">משך הופעה</span>{quickArtist.setDuration} דקות</div>
              </div>

              {quickArtist.contacts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">אנשי קשר</p>
                  <div className="space-y-2">
                    {quickArtist.contacts.map((c) => (
                      <div key={c.id} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
                        <div className="font-medium text-gray-900">{c.name}</div>
                        {c.role && <div className="text-xs text-gray-500">{c.role}</div>}
                        {c.phone && <div className="text-xs text-gray-500" dir="ltr">{c.phone}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quickArtist.vehicles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">רכבים</p>
                  <div className="flex gap-2 flex-wrap">
                    {quickArtist.vehicles.map((v) => (
                      <span key={v.id} className="bg-gray-100 rounded-lg px-2.5 py-1 text-xs font-mono text-gray-700" dir="ltr">{v.plateNumber}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              <button onClick={() => setQuickViewId(null)} className="text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors">סגור</button>
              <Link
                href={`/festivals/${festivalId}/artists/${quickArtist.id}`}
                onClick={() => setQuickViewId(null)}
                className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                פתח דף מלא
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
