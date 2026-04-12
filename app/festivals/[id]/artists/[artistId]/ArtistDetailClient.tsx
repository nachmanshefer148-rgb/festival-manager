"use client";

import { useState } from "react";
import Link from "next/link";
import { formatTime, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  stage: { id: string; name: string };
}

interface ArtistContact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
}

interface ArtistVehicle {
  id: string;
  plateNumber: string;
  vehicleType: string | null;
  arrivalTime: string | null;
}

interface ArtistFile {
  id: string;
  name: string;
  url: string;
  isExternal: boolean;
  fileType: string | null;
  createdAt: string;
}

interface ArtistPayment {
  id: string;
  description: string;
  amount: number;
  dueDate: string | null;
  isPaid: boolean;
  budgetItemId: string | null;
}

interface Artist {
  id: string;
  name: string;
  genre: string | null;
  bio: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  setDuration: number;
  soundcheckDuration: number;
  breakAfter: number;
  profileImageUrl: string | null;
  status: string;
  privateNotes: string | null;
  agentName: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  fee: number | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  spotifyUrl: string | null;
  stageSize: string | null;
  paSystemRequired: boolean;
  monitorsCount: number;
  microphonesCount: number;
  djEquipmentRequired: boolean;
  electricalRequirements: string | null;
  lightingNotes: string | null;
  backlineNotes: string | null;
  hospitalityRider: string | null;
  technicalRiderNotes: string | null;
  technicalRiderPdfUrl: string | null;
  timeSlots: TimeSlot[];
  contacts: ArtistContact[];
  vehicles: ArtistVehicle[];
  files: ArtistFile[];
  payments: ArtistPayment[];
}

interface Props {
  festivalId: string;
  artist: Artist;
  isAdmin: boolean;
  showFinancials?: boolean;
  updateArtist: (id: string, fd: FormData) => Promise<void>;
  deleteArtist: (id: string, festivalId: string) => Promise<void>;
  createArtistFile: (artistId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteArtistFile: (id: string, artistId: string, festivalId: string) => Promise<void>;
  createArtistPayment: (artistId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleArtistPayment: (id: string, artistId: string, festivalId: string) => Promise<void>;
  deleteArtistPayment: (id: string, artistId: string, festivalId: string) => Promise<void>;
  createArtistContact: (artistId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteArtistContact: (id: string, artistId: string, festivalId: string) => Promise<void>;
  createArtistVehicle: (artistId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteArtistVehicle: (id: string, artistId: string, festivalId: string) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ARTIST_LABELS: Record<string, string> = { confirmed: "מאושר", pending: "ממתין", cancelled: "בוטל" };
const STATUS_ARTIST_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
};
const FILE_TYPE_LABELS: Record<string, string> = {
  contract: "חוזה",
  graphics: "גרפיקות",
  rider: "ריידר טכני",
  other: "אחר",
};
const FILE_TYPE_ICONS: Record<string, string> = {
  contract: "📄",
  graphics: "🖼️",
  rider: "📋",
  other: "📎",
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArtistDetailClient({
  festivalId,
  artist,
  isAdmin,
  showFinancials = true,
  updateArtist,
  deleteArtist,
  createArtistContact,
  deleteArtistContact,
  createArtistVehicle,
  deleteArtistVehicle,
  createArtistFile,
  deleteArtistFile,
  createArtistPayment,
  toggleArtistPayment,
  deleteArtistPayment,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<"info" | "contacts" | "vehicles" | "rider" | "schedule" | "files" | "payments">("info");
  const [showEdit, setShowEdit] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const initials = artist.name.slice(0, 2).toUpperCase();
  const status = artist.status ?? "confirmed";
  const displayImage = pendingImageUrl ?? artist.profileImageUrl;

  // Checklist (derived from existing data)
  const checks = {
    contract: artist.files.some((f) => f.fileType === "contract"),
    rider: artist.files.some((f) => f.fileType === "rider") || !!artist.technicalRiderPdfUrl,
    payment: artist.payments.length > 0,
    graphics: artist.files.some((f) => f.fileType === "graphics"),
  };

  const whatsappPhone = (artist.contactPhone ?? "").replace(/\D/g, "").replace(/^0/, "972");

  async function handleImageUpload(file: File) {
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=artists", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setPendingImageUrl(data.url);
    } finally {
      setImageUploading(false);
    }
  }

  const tabs: { key: "info" | "contacts" | "vehicles" | "rider" | "schedule" | "files" | "payments"; label: string }[] = [
    { key: "info", label: "מידע" },
    { key: "contacts", label: `אנשי קשר${artist.contacts.length > 0 ? ` (${artist.contacts.length})` : ""}` },
    { key: "vehicles", label: `רכבים${artist.vehicles.length > 0 ? ` (${artist.vehicles.length})` : ""}` },
    { key: "rider", label: "מפרט טכני" },
    { key: "schedule", label: "לוח זמנים" },
    { key: "files", label: `קבצים${artist.files.length > 0 ? ` (${artist.files.length})` : ""}` },
    ...(showFinancials ? [{ key: "payments" as const, label: `תשלום${artist.payments.length > 0 ? ` (${artist.payments.length})` : ""}` }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href={`/festivals/${festivalId}/artists`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 mb-4 transition-colors">
        ← חזרה לאמנים
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-violet-100 flex items-center justify-center">
              {displayImage ? (
                <img src={displayImage} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-violet-600 font-bold text-2xl">{initials}</span>
              )}
            </div>
            {isAdmin && (
              <label className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1 cursor-pointer hover:bg-violet-50 transition-colors shadow-sm" title="שנה תמונה">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
                <span className="text-xs">{imageUploading ? "⏳" : "📷"}</span>
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{artist.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {artist.genre && (
                    <span className="text-sm bg-violet-50 text-violet-600 px-2.5 py-0.5 rounded-full font-medium">{artist.genre}</span>
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_ARTIST_COLORS[status] ?? STATUS_ARTIST_COLORS.confirmed}`}>
                    {STATUS_ARTIST_LABELS[status] ?? "מאושר"}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="shrink-0 text-gray-400 hover:text-violet-600 text-sm px-3 py-1.5 rounded-xl hover:bg-violet-50 transition-colors border border-gray-200 hover:border-violet-300"
                >
                  ✏️ ערוך
                </button>
              )}
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              {artist.contactPhone && (
                <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors flex items-center gap-1">
                  📞 {artist.contactPhone}
                </a>
              )}
              {artist.contactEmail && (
                <a href={`mailto:${artist.contactEmail}`} className="hover:text-violet-600 transition-colors">
                  ✉️ {artist.contactEmail}
                </a>
              )}
              {artist.websiteUrl && (
                <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">🌐</a>
              )}
              {artist.instagramUrl && (
                <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">📸</a>
              )}
              {artist.spotifyUrl && (
                <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">🎧</a>
              )}
            </div>

            {/* Timing badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-lg font-medium">🎵 סט: {artist.setDuration} דק'</span>
              <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-lg font-medium">🔊 סאונדצ'ק: {artist.soundcheckDuration} דק'</span>
              <span className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded-lg font-medium">⏸ הפסקה: {artist.breakAfter} דק'</span>
            </div>

            {/* Checklist */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { key: "contract", label: "חוזה" },
                { key: "rider", label: "ריידר" },
                { key: "payment", label: "תשלום" },
                { key: "graphics", label: "גרפיקות" },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    checks[key as keyof typeof checks]
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {checks[key as keyof typeof checks] ? "✓" : "○"} {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.key
                ? "bg-violet-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
        {activeTab === "info" && (
          <InfoTab artist={artist} isAdmin={isAdmin} showFinancials={showFinancials} />
        )}
        {activeTab === "contacts" && (
          <ContactsTab
            contacts={artist.contacts}
            artistId={artist.id}
            festivalId={festivalId}
            isAdmin={isAdmin}
            createArtistContact={createArtistContact}
            deleteArtistContact={deleteArtistContact}
          />
        )}
        {activeTab === "vehicles" && (
          <VehiclesTab
            vehicles={artist.vehicles}
            artistId={artist.id}
            festivalId={festivalId}
            isAdmin={isAdmin}
            createArtistVehicle={createArtistVehicle}
            deleteArtistVehicle={deleteArtistVehicle}
          />
        )}
        {activeTab === "rider" && (
          <RiderTab
            artist={artist}
            isAdmin={isAdmin}
            festivalId={festivalId}
            updateArtist={updateArtist}
          />
        )}
        {activeTab === "schedule" && (
          <ScheduleTab slots={artist.timeSlots} festivalId={festivalId} />
        )}
        {activeTab === "files" && (
          <FilesTab
            files={artist.files}
            artistId={artist.id}
            festivalId={festivalId}
            isAdmin={isAdmin}
            createArtistFile={createArtistFile}
            deleteArtistFile={deleteArtistFile}
          />
        )}
        {activeTab === "payments" && (
          <PaymentsTab
            payments={artist.payments}
            artistId={artist.id}
            festivalId={festivalId}
            isAdmin={isAdmin}
            createArtistPayment={createArtistPayment}
            toggleArtistPayment={toggleArtistPayment}
            deleteArtistPayment={deleteArtistPayment}
          />
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <Modal title="עריכת פרטי אמן" onClose={() => setShowEdit(false)}>
          <form
            action={async (fd) => {
              if (pendingImageUrl) fd.set("profileImageUrl", pendingImageUrl);
              setSubmittingEdit(true);
              try {
                await updateArtist(artist.id, fd);
                setShowEdit(false);
              } finally {
                setSubmittingEdit(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם *</label>
                <input name="name" required defaultValue={artist.name} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ז'אנר</label>
                <input name="genre" defaultValue={artist.genre ?? ""} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                <select name="status" defaultValue={artist.status} className={inputCls}>
                  <option value="confirmed">מאושר</option>
                  <option value="pending">ממתין</option>
                  <option value="cancelled">בוטל</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שכר (₪)</label>
                <input name="fee" type="number" defaultValue={artist.fee ?? ""} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">סט (דק')</label>
                <input name="setDuration" type="number" defaultValue={artist.setDuration} min={1} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">סאונדצ'ק</label>
                <input name="soundcheckDuration" type="number" defaultValue={artist.soundcheckDuration} min={0} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">הפסקה</label>
                <input name="breakAfter" type="number" defaultValue={artist.breakAfter} min={0} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <input name="contactPhone" type="tel" defaultValue={artist.contactPhone ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input name="contactEmail" type="email" defaultValue={artist.contactEmail ?? ""} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ביוגרפיה</label>
              <textarea name="bio" rows={2} defaultValue={artist.bio ?? ""} className={`${inputCls} resize-none`} />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">סוכן / מנהל</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">שם</label>
                <input name="agentName" defaultValue={artist.agentName ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">טלפון</label>
                <input name="agentPhone" defaultValue={artist.agentPhone ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">אימייל</label>
                <input name="agentEmail" defaultValue={artist.agentEmail ?? ""} className={inputCls} />
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">רשתות חברתיות</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">📸 Instagram</label>
                <input name="instagramUrl" dir="ltr" defaultValue={artist.instagramUrl ?? ""} placeholder="https://instagram.com/..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">🎧 Spotify</label>
                <input name="spotifyUrl" dir="ltr" defaultValue={artist.spotifyUrl ?? ""} placeholder="https://open.spotify.com/..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">🌐 אתר</label>
                <input name="websiteUrl" dir="ltr" defaultValue={artist.websiteUrl ?? ""} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">📘 Facebook</label>
                <input name="facebookUrl" dir="ltr" defaultValue={artist.facebookUrl ?? ""} placeholder="https://facebook.com/..." className={inputCls} />
              </div>
            </div>

            {/* hidden: carry over all rider fields unchanged */}
            <input type="hidden" name="stageSize" value={artist.stageSize ?? ""} />
            <input type="hidden" name="paSystemRequired" value={String(artist.paSystemRequired)} />
            <input type="hidden" name="monitorsCount" value={String(artist.monitorsCount)} />
            <input type="hidden" name="microphonesCount" value={String(artist.microphonesCount)} />
            <input type="hidden" name="djEquipmentRequired" value={String(artist.djEquipmentRequired)} />
            <input type="hidden" name="electricalRequirements" value={artist.electricalRequirements ?? ""} />
            <input type="hidden" name="lightingNotes" value={artist.lightingNotes ?? ""} />
            <input type="hidden" name="backlineNotes" value={artist.backlineNotes ?? ""} />
            <input type="hidden" name="hospitalityRider" value={artist.hospitalityRider ?? ""} />
            <input type="hidden" name="technicalRiderNotes" value={artist.technicalRiderNotes ?? ""} />
            <input type="hidden" name="technicalRiderPdfUrl" value={artist.technicalRiderPdfUrl ?? ""} />
            <input type="hidden" name="profileImageUrl" value={pendingImageUrl ?? artist.profileImageUrl ?? ""} />

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הערות פנימיות (admin בלבד)</label>
                <textarea name="privateNotes" rows={2} defaultValue={artist.privateNotes ?? ""} className={`${inputCls} resize-none`} />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
              <button type="submit" disabled={submittingEdit} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">
                {submittingEdit ? "שומר..." : "שמור שינויים"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── ContactsTab ─────────────────────────────────────────────────────────────

function ContactsTab({
  contacts, artistId, festivalId, isAdmin, createArtistContact, deleteArtistContact,
}: {
  contacts: ArtistContact[];
  artistId: string;
  festivalId: string;
  isAdmin: boolean;
  createArtistContact: Props["createArtistContact"];
  deleteArtistContact: Props["deleteArtistContact"];
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !showForm && (
        isAdmin ? (
          <button onClick={() => setShowForm(true)}
            className="w-full border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group">
            <p className="text-2xl mb-1">👤</p>
            <p className="text-sm">אין אנשי קשר עדיין</p>
            <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספה</p>
          </button>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">אין אנשי קשר</div>
        )
      )}

      {contacts.map((c) => (
        <div key={c.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-xs font-semibold text-violet-600">
            {c.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{c.name}</p>
            {c.role && <p className="text-xs text-violet-500 font-medium">{c.role}</p>}
            <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-gray-400">
              {c.phone && (
                <a href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "972")}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">
                  📞 {c.phone}
                </a>
              )}
              {c.email && <span>✉️ {c.email}</span>}
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok = await confirm({ message: `למחוק את ${c.name}?`, danger: true, confirmLabel: "מחק" });
                if (ok) { await deleteArtistContact(c.id, artistId, festivalId); toast("איש הקשר נמחק"); }
              }}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
            >✕</button>
          )}
        </div>
      ))}

      {isAdmin && !showForm && contacts.length > 0 && (
        <button onClick={() => setShowForm(true)} className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
          + הוסף איש קשר
        </button>
      )}

      {isAdmin && showForm && (
        <form
          action={async (fd) => {
            setSubmitting(true);
            try {
              await createArtistContact(artistId, festivalId, fd);
              setShowForm(false);
            } finally {
              setSubmitting(false);
            }
          }}
          className="bg-gray-50 rounded-xl p-3 space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">שם *</label>
              <input name="name" required autoFocus placeholder="שם" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">תפקיד</label>
              <input name="role" placeholder="סוכן, מנהל טכני..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">טלפון</label>
              <input name="phone" type="tel" placeholder="050-0000000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">אימייל</label>
              <input name="email" type="email" placeholder="contact@..." className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">ביטול</button>
            <button type="submit" disabled={submitting} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
              {submitting ? "שומר..." : "הוסף"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── VehiclesTab ──────────────────────────────────────────────────────────────

function VehiclesTab({
  vehicles, artistId, festivalId, isAdmin, createArtistVehicle, deleteArtistVehicle,
}: {
  vehicles: ArtistVehicle[];
  artistId: string;
  festivalId: string;
  isAdmin: boolean;
  createArtistVehicle: Props["createArtistVehicle"];
  deleteArtistVehicle: Props["deleteArtistVehicle"];
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="space-y-3">
      {vehicles.length === 0 && !showForm && (
        isAdmin ? (
          <button onClick={() => setShowForm(true)}
            className="w-full border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group">
            <p className="text-2xl mb-1">🚐</p>
            <p className="text-sm">אין רכבים עדיין</p>
            <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספה</p>
          </button>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">אין רכבים</div>
        )
      )}

      {vehicles.map((v) => (
        <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <span className="text-xl shrink-0">🚐</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-mono">{v.plateNumber}</p>
            <p className="text-xs text-gray-400">
              {v.vehicleType && <span>{v.vehicleType}</span>}
              {v.vehicleType && v.arrivalTime && <span> · </span>}
              {v.arrivalTime && <span>הגעה: {v.arrivalTime}</span>}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok = await confirm({ message: `למחוק רכב ${v.plateNumber}?`, danger: true, confirmLabel: "מחק" });
                if (ok) { await deleteArtistVehicle(v.id, artistId, festivalId); toast("הרכב נמחק"); }
              }}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
            >✕</button>
          )}
        </div>
      ))}

      {isAdmin && !showForm && vehicles.length > 0 && (
        <button onClick={() => setShowForm(true)} className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
          + הוסף רכב
        </button>
      )}

      {isAdmin && showForm && (
        <form
          action={async (fd) => {
            setSubmitting(true);
            try {
              await createArtistVehicle(artistId, festivalId, fd);
              setShowForm(false);
            } finally {
              setSubmitting(false);
            }
          }}
          className="bg-gray-50 rounded-xl p-3 space-y-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">לוחית רישוי *</label>
              <input name="plateNumber" required autoFocus placeholder="12-345-67" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">סוג רכב</label>
              <input name="vehicleType" placeholder="אוטובוס, משאית..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">שעת הגעה</label>
              <input name="arrivalTime" placeholder="08:00" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">ביטול</button>
            <button type="submit" disabled={submitting} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
              {submitting ? "שומר..." : "הוסף"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── InfoTab ──────────────────────────────────────────────────────────────────

function InfoTab({ artist, isAdmin, showFinancials = true }: { artist: Artist; isAdmin: boolean; showFinancials?: boolean }) {
  return (
    <div className="space-y-5">
      {artist.bio && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">ביוגרפיה</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{artist.bio}</p>
        </div>
      )}

      {(artist.agentName || artist.agentPhone || artist.agentEmail) && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">סוכן / מנהל</p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm text-gray-700">
            {artist.agentName && <p className="font-medium">{artist.agentName}</p>}
            {artist.agentPhone && <p className="text-gray-500">📞 {artist.agentPhone}</p>}
            {artist.agentEmail && <p className="text-gray-500">✉️ {artist.agentEmail}</p>}
          </div>
        </div>
      )}

      {showFinancials && artist.fee != null && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">שכר מוסכם</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(artist.fee)}</p>
        </div>
      )}

      {isAdmin && artist.privateNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-yellow-600 mb-1">🔒 הערות פנימיות</p>
          <p className="text-sm text-yellow-800 whitespace-pre-wrap">{artist.privateNotes}</p>
        </div>
      )}

      {!artist.bio && !artist.agentName && (artist.fee == null || !showFinancials) && (
        <p className="text-sm text-gray-400 text-center py-6">לחץ על "ערוך" כדי להוסיף פרטים</p>
      )}
    </div>
  );
}

// ─── RiderTab ─────────────────────────────────────────────────────────────────

function RiderTab({
  artist,
  isAdmin,
  festivalId,
  updateArtist,
}: {
  artist: Artist;
  isAdmin: boolean;
  festivalId: string;
  updateArtist: (id: string, fd: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(artist.technicalRiderPdfUrl ?? "");

  async function handlePdfUpload(file: File) {
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=artists", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setPdfUrl(data.url);
    } finally {
      setPdfUploading(false);
    }
  }

  if (!editing) {
    const hasAny = artist.stageSize || artist.backlineNotes || artist.electricalRequirements || artist.lightingNotes || artist.hospitalityRider || artist.technicalRiderNotes || artist.technicalRiderPdfUrl || artist.paSystemRequired || artist.djEquipmentRequired;

    return (
      <div className="space-y-4">
        {hasAny ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artist.stageSize && <InfoItem label="גודל במה" value={artist.stageSize} />}
              <InfoItem label="מוניטורים" value={`${artist.monitorsCount}`} />
              <InfoItem label="מיקרופונים" value={`${artist.microphonesCount}`} />
              {artist.paSystemRequired && <InfoItem label="מערכת PA" value="נדרשת" highlight />}
              {artist.djEquipmentRequired && <InfoItem label="ציוד DJ" value="נדרש" highlight />}
            </div>
            {artist.electricalRequirements && <FieldBlock label="דרישות חשמל" value={artist.electricalRequirements} />}
            {artist.backlineNotes && <FieldBlock label="ציוד backline" value={artist.backlineNotes} />}
            {artist.lightingNotes && <FieldBlock label="תאורה" value={artist.lightingNotes} />}
            {artist.hospitalityRider && <FieldBlock label="הוספיטליטי" value={artist.hospitalityRider} />}
            {artist.technicalRiderNotes && <FieldBlock label="הערות כלליות" value={artist.technicalRiderNotes} />}
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-violet-600 hover:underline">
                📄 קובץ מפרט טכני
              </a>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">אין מפרט טכני עדיין</p>
        )}
        {isAdmin && (
          <button onClick={() => setEditing(true)} className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
            ✏️ ערוך מפרט
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        fd.set("technicalRiderPdfUrl", pdfUrl);
        // carry over all basic fields unchanged
        const fields = ["name","genre","bio","contactEmail","contactPhone","setDuration","soundcheckDuration",
          "breakAfter","status","profileImageUrl","privateNotes","agentName","agentPhone","agentEmail","fee",
          "instagramUrl","facebookUrl","websiteUrl","spotifyUrl"];
        fields.forEach((f) => {
          if (!fd.get(f)) fd.set(f, (artist as unknown as Record<string, unknown>)[f] as string ?? "");
        });
        setSubmitting(true);
        try {
          await updateArtist(artist.id, fd);
          setEditing(false);
        } finally {
          setSubmitting(false);
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">גודל במה</label>
          <input name="stageSize" defaultValue={artist.stageSize ?? ""} placeholder='6x4 מטר' className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">מוניטורים</label>
          <input name="monitorsCount" type="number" defaultValue={artist.monitorsCount} min={0} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">מיקרופונים</label>
          <input name="microphonesCount" type="number" defaultValue={artist.microphonesCount} min={0} className={inputCls} />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="paSystemRequired" value="true" defaultChecked={artist.paSystemRequired}
            onChange={(e) => e.target.form?.elements.namedItem("paSystemRequired") }
          />
          מערכת PA נדרשת
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="djEquipmentRequired" value="true" defaultChecked={artist.djEquipmentRequired} />
          ציוד DJ נדרש
        </label>
      </div>

      {[
        { name: "electricalRequirements", label: "דרישות חשמל" },
        { name: "backlineNotes", label: "ציוד backline" },
        { name: "lightingNotes", label: "תאורה" },
        { name: "hospitalityRider", label: "הוספיטליטי (אוכל, חדר, כיבוד)" },
        { name: "technicalRiderNotes", label: "הערות כלליות" },
      ].map(({ name, label }) => (
        <div key={name}>
          <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
          <textarea name={name} rows={2} defaultValue={(artist as unknown as Record<string,unknown>)[name] as string ?? ""} className={`${inputCls} resize-none`} />
        </div>
      ))}

      {/* PDF upload */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1">קובץ מפרט טכני (PDF)</p>
        {pdfUrl ? (
          <div className="flex items-center gap-2">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline">📄 קובץ קיים</a>
            <label className="text-xs text-gray-400 hover:text-violet-600 cursor-pointer">
              (החלף)
              <input type="file" accept=".pdf" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800">
            {pdfUploading ? "מעלה..." : "📎 העלה PDF"}
            <input type="file" accept=".pdf" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
          </label>
        )}
      </div>

      {/* hidden basic fields */}
      {["name","genre","bio","contactEmail","contactPhone","status","profileImageUrl","privateNotes",
        "agentName","agentPhone","agentEmail","fee","instagramUrl","facebookUrl","websiteUrl","spotifyUrl",
        "setDuration","soundcheckDuration","breakAfter"].map((f) => (
        <input key={f} type="hidden" name={f} value={(artist as unknown as Record<string,unknown>)[f] as string ?? ""} />
      ))}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">
          {submitting ? "שומר..." : "שמור מפרט"}
        </button>
      </div>
    </form>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-semibold text-sm mt-0.5 ${highlight ? "text-amber-700" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ─── ScheduleTab ──────────────────────────────────────────────────────────────

function ScheduleTab({ slots, festivalId }: { slots: TimeSlot[]; festivalId: string }) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-2xl mb-2">📅</p>
        <p className="text-sm">אין הופעות מתוכננות</p>
        <Link href={`/festivals/${festivalId}/schedule`} className="text-violet-600 text-sm hover:underline mt-2 inline-block">
          עבור ללוח הזמנים ←
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border-r-4 bg-gray-50 ${
          slot.status === "COMPLETED" ? "border-r-emerald-400" :
          slot.status === "CANCELLED" ? "border-r-red-400 opacity-60" :
          "border-r-blue-400"
        }`}>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">{slot.stage.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(slot.startTime)} · {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[slot.status] ?? ""}`}>
            {STATUS_LABELS[slot.status] ?? slot.status}
          </span>
        </div>
      ))}
      <Link href={`/festivals/${festivalId}/schedule`} className="text-violet-600 text-sm hover:underline mt-1 inline-block">
        עבור ללוח הזמנים ←
      </Link>
    </div>
  );
}

// ─── FilesTab ─────────────────────────────────────────────────────────────────

function FilesTab({
  files, artistId, festivalId, isAdmin, createArtistFile, deleteArtistFile,
}: {
  files: ArtistFile[];
  artistId: string;
  festivalId: string;
  isAdmin: boolean;
  createArtistFile: Props["createArtistFile"];
  deleteArtistFile: Props["deleteArtistFile"];
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [mode, setMode] = useState<"upload" | "link" | null>(null);
  type ArtistRecord = Record<string, string | number | boolean | null>;
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload?folder=artists", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const fileType = ext === "pdf" ? "contract" : ["jpg","jpeg","png"].includes(ext) ? "graphics" : "other";
        await createArtistFile(artistId, festivalId, file.name, data.url, false, fileType);
        setMode(null);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {files.length === 0 && !mode && (
        isAdmin ? (
          <button onClick={() => setMode("upload")}
            className="w-full border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group">
            <p className="text-2xl mb-1">📁</p>
            <p className="text-sm">אין קבצים עדיין</p>
            <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספה</p>
          </button>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">אין קבצים</div>
        )
      )}

      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <span className="text-xl">{FILE_TYPE_ICONS[f.fileType ?? "other"] ?? "📎"}</span>
          <div className="flex-1 min-w-0">
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-violet-600 transition-colors truncate block">
              {f.name}
            </a>
            <p className="text-xs text-gray-400">
              {FILE_TYPE_LABELS[f.fileType ?? "other"] ?? "אחר"}
              {f.isExternal && " · קישור חיצוני"}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok = await confirm({ message: `למחוק "${f.name}"?`, danger: true, confirmLabel: "מחק" });
                if (ok) { await deleteArtistFile(f.id, artistId, festivalId); toast("הקובץ נמחק"); }
              }}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >✕</button>
          )}
        </div>
      ))}

      {isAdmin && (
        <div className="flex gap-2 pt-1">
          {mode !== "upload" && (
            <label className="cursor-pointer text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors flex items-center gap-1">
              {uploading ? "מעלה..." : "📎 העלה קובץ"}
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            </label>
          )}
          {mode !== "link" && (
            <button onClick={() => setMode("link")} className="text-sm text-gray-500 hover:text-violet-600 transition-colors">
              🔗 קישור חיצוני
            </button>
          )}
        </div>
      )}

      {isAdmin && mode === "link" && (
        <form
          action={async (fd) => {
            setSubmitting(true);
            try {
              const name = fd.get("name") as string;
              const url = fd.get("url") as string;
              const fileType = fd.get("fileType") as string;
              await createArtistFile(artistId, festivalId, name, url, true, fileType);
              setMode(null);
            } finally {
              setSubmitting(false);
            }
          }}
          className="bg-gray-50 rounded-xl p-3 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">שם</label>
            <input name="name" required placeholder="חוזה אמן..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">קישור</label>
            <input name="url" required type="url" dir="ltr" placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">סוג</label>
            <select name="fileType" className={inputCls}>
              <option value="contract">חוזה</option>
              <option value="graphics">גרפיקות</option>
              <option value="rider">ריידר טכני</option>
              <option value="other">אחר</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">ביטול</button>
            <button type="submit" disabled={submitting} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
              {submitting ? "שומר..." : "הוסף"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── PaymentsTab ──────────────────────────────────────────────────────────────

function PaymentsTab({
  payments, artistId, festivalId, isAdmin, createArtistPayment, toggleArtistPayment, deleteArtistPayment,
}: {
  payments: ArtistPayment[];
  artistId: string;
  festivalId: string;
  isAdmin: boolean;
  createArtistPayment: Props["createArtistPayment"];
  toggleArtistPayment: Props["toggleArtistPayment"];
  deleteArtistPayment: Props["deleteArtistPayment"];
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const paid = payments.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const remaining = total - paid;

  return (
    <div className="space-y-3">
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">סה"כ</p>
            <p className="font-bold text-sm">{formatCurrency(total)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-500">שולם</p>
            <p className="font-bold text-sm text-emerald-700">{formatCurrency(paid)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-xs text-orange-400">נותר</p>
            <p className="font-bold text-sm text-orange-600">{formatCurrency(remaining)}</p>
          </div>
        </div>
      )}

      {payments.length === 0 && !showForm && (
        isAdmin ? (
          <button onClick={() => setShowForm(true)}
            className="w-full border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors group">
            <p className="text-2xl mb-1">💰</p>
            <p className="text-sm">אין תשלומים עדיין</p>
            <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספה</p>
          </button>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">אין תשלומים</div>
        )
      )}

      {payments.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          {isAdmin ? (
            <button
              onClick={async () => {
                if (!p.isPaid) {
                  const ok = await confirm({ message: `לסמן "${p.description}" כשולם?`, confirmLabel: "סמן כשולם" });
                  if (!ok) return;
                }
                await toggleArtistPayment(p.id, artistId, festivalId);
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                p.isPaid ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 hover:border-emerald-400"
              }`}
            >
              {p.isPaid && <span className="text-xs">✓</span>}
            </button>
          ) : (
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${p.isPaid ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200"}`}>
              {p.isPaid && <span className="text-xs">✓</span>}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{p.description}</p>
            <p className="text-xs text-gray-400">
              {formatCurrency(p.amount)}
              {p.dueDate && ` · ${formatDate(p.dueDate)}`}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                const ok2 = await confirm({ message: `למחוק תשלום "${p.description}"?`, danger: true, confirmLabel: "מחק" });
                if (ok2) { await deleteArtistPayment(p.id, artistId, festivalId); toast("התשלום נמחק"); }
              }}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >✕</button>
          )}
        </div>
      ))}

      {isAdmin && (
        <>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
              + הוסף תשלום
            </button>
          )}

          {showForm && (
            <form
              action={async (fd) => {
                setSubmitting(true);
                try {
                  await createArtistPayment(artistId, festivalId, fd);
                  setShowForm(false);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="bg-gray-50 rounded-xl p-3 space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">תיאור *</label>
                <input name="description" required placeholder="מקדמה, תשלום סופי..." className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">סכום (₪) *</label>
                  <input name="amount" type="number" required min={0} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">תאריך פירעון</label>
                  <input name="dueDate" type="date" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">ביטול</button>
                <button type="submit" disabled={submitting} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
                  {submitting ? "שומר..." : "הוסף תשלום"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
