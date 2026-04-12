"use client";

import { useState } from "react";
import { formatTime, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";

interface Artist {
  id: string;
  name: string;
  genre: string | null;
  setDuration: number;
  soundcheckDuration: number;
  breakAfter: number;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  artistId: string | null;
  artist: Artist | null;
}

interface Stage {
  id: string;
  name: string;
  capacity: number | null;
  timeSlots: TimeSlot[];
}

interface Props {
  festivalId: string;
  festival: { startDate: string; endDate: string };
  stages: Stage[];
  artists: Artist[];
  isAdmin: boolean;
  createStage: (formData: FormData) => Promise<void>;
  deleteStage: (id: string, festivalId: string) => Promise<void>;
  createTimeSlot: (formData: FormData) => Promise<void>;
  deleteTimeSlot: (id: string, festivalId: string) => Promise<void>;
  updateTimeSlotStatus: (id: string, status: string, festivalId: string) => Promise<void>;
}

export default function ScheduleClient({
  festivalId,
  festival,
  stages,
  artists,
  isAdmin,
  createStage,
  deleteStage,
  createTimeSlot,
  deleteTimeSlot,
  updateTimeSlotStatus,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showAddStage, setShowAddStage] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedStageForSlot, setSelectedStageForSlot] = useState(stages[0]?.id ?? "");
  const [submittingStage, setSubmittingStage] = useState(false);
  const [submittingSlot, setSubmittingSlot] = useState(false);

  // Build date tabs from festival range
  const festivalStart = new Date(festival.startDate);
  const festivalEnd = new Date(festival.endDate);
  const dates: string[] = [];
  const cur = new Date(festivalStart);
  while (cur <= festivalEnd) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }

  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");

  // Filter slots by selected date
  const stagesWithFiltered = stages.map((stage) => ({
    ...stage,
    timeSlots: stage.timeSlots.filter(
      (ts) => ts.startTime.split("T")[0] === selectedDate
    ),
  }));

  const formatDateLabel = (d: string) =>
    new Date(d).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">📅 לוח זמנים</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddStage(true)}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              + הוסף שלב
            </button>
            {stages.length > 0 && artists.length > 0 && (
              <button
                onClick={() => setShowAddSlot(true)}
                className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                + תזמן הופעה
              </button>
            )}
          </div>
        )}
      </div>

      {/* Date tabs */}
      {dates.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDate === d
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {formatDateLabel(d)}
            </button>
          ))}
        </div>
      )}

      {/* Stage columns */}
      {stages.length === 0 ? (
        isAdmin ? (
          <button
            onClick={() => setShowAddStage(true)}
            className="w-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors cursor-pointer group"
          >
            <div className="text-4xl mb-2">🎪</div>
            <p className="font-medium">עדיין אין שלבים</p>
            <p className="text-sm mt-1">הוסף שלב ראשון כדי להתחיל</p>
            <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספה</p>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🎪</div>
            <p className="font-medium">עדיין אין שלבים</p>
            <p className="text-sm mt-1">הוסף שלב ראשון כדי להתחיל</p>
          </div>
        )
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stagesWithFiltered.map((stage) => (
            <div key={stage.id} className="min-w-64 flex-shrink-0">
              {/* Stage header */}
              <div className="bg-violet-700 text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between">
                <span className="font-semibold">{stage.name}</span>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      const ok = await confirm({ message: `למחוק את השלב "${stage.name}"?`, danger: true, confirmLabel: "מחק" });
                      if (ok) {
                        await deleteStage(stage.id, festivalId);
                        toast("השלב נמחק");
                      }
                    }}
                    className="text-violet-300 hover:text-white text-xs"
                    aria-label={`מחק שלב ${stage.name}`}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Time slots */}
              <div className="bg-gray-100 rounded-b-xl p-2 space-y-2 min-h-32">
                {stage.timeSlots.length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-6">אין הופעות ביום זה</div>
                ) : (
                  stage.timeSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      festivalId={festivalId}
                      isAdmin={isAdmin}
                      onDelete={deleteTimeSlot}
                      onStatusChange={updateTimeSlotStatus}
                      onToast={toast}
                      onConfirm={confirm}
                    />
                  ))
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSelectedStageForSlot(stage.id);
                      setShowAddSlot(true);
                    }}
                    className="w-full text-xs text-gray-400 hover:text-violet-600 py-2 border border-dashed border-gray-300 rounded-lg hover:border-violet-300 transition-colors"
                  >
                    + הוסף הופעה
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Stage Modal */}
      {showAddStage && (
        <Modal title="הוסף שלב חדש" onClose={() => setShowAddStage(false)}>
          <form
            action={async (fd) => {
              setSubmittingStage(true);
              try { await createStage(fd); setShowAddStage(false); toast("השלב נוסף"); }
              catch { toast("שגיאה בהוספת השלב", "error"); }
              finally { setSubmittingStage(false); }
            }}
            className="space-y-4"
          >
            <input type="hidden" name="festivalId" value={festivalId} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם השלב *</label>
              <input
                name="name"
                required
                autoFocus
                placeholder='שלב ראשי, Stage B...'
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קיבולת</label>
              <input
                name="capacity"
                type="number"
                placeholder="5000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מיקום</label>
              <input
                name="location"
                placeholder="צפון הגן..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddStage(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
              <button type="submit" disabled={submittingStage} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">{submittingStage ? "שומר..." : "הוסף שלב"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add TimeSlot Modal */}
      {showAddSlot && (
        <Modal title="תזמן הופעה" onClose={() => setShowAddSlot(false)}>
          <form
            action={async (fd) => {
              setSubmittingSlot(true);
              try { await createTimeSlot(fd); setShowAddSlot(false); toast("ההופעה תוזמנה"); }
              catch { toast("שגיאה בתזמון ההופעה", "error"); }
              finally { setSubmittingSlot(false); }
            }}
            className="space-y-4"
          >
            <input type="hidden" name="festivalId" value={festivalId} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שלב *</label>
              <select
                name="stageId"
                defaultValue={selectedStageForSlot}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אמן *</label>
              <select
                name="artistId"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="">בחר אמן...</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.setDuration} דק' + {a.soundcheckDuration} סאונדצ'ק)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה *</label>
              <input
                name="startTime"
                type="datetime-local"
                required
                defaultValue={`${selectedDate}T20:00`}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">שעת הסיום תחושב אוטומטית לפי משך הסט</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="הערות נוספות..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddSlot(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
              <button type="submit" disabled={submittingSlot} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">{submittingSlot ? "שומר..." : "תזמן הופעה"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SlotCard({
  slot,
  festivalId,
  isAdmin,
  onDelete,
  onStatusChange,
  onToast,
  onConfirm,
}: {
  slot: TimeSlot;
  festivalId: string;
  isAdmin: boolean;
  onDelete: (id: string, festivalId: string) => Promise<void>;
  onStatusChange: (id: string, status: string, festivalId: string) => Promise<void>;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
  onConfirm: (opts: { message: string; danger?: boolean; confirmLabel?: string }) => Promise<boolean>;
}) {
  const statusColor: Record<string, string> = {
    SCHEDULED: "border-r-blue-400",
    COMPLETED: "border-r-green-400",
    CANCELLED: "border-r-red-400 opacity-60",
  };

  const nextStatus: Record<string, string> = {
    SCHEDULED: "COMPLETED",
    COMPLETED: "SCHEDULED",
    CANCELLED: "SCHEDULED",
  };

  return (
    <div className={`bg-white rounded-xl p-3 border-r-4 shadow-sm ${statusColor[slot.status] ?? "border-r-gray-300"}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{slot.artist?.name ?? "ללא אמן"}</p>
          {slot.artist?.genre && <p className="text-xs text-violet-500">{slot.artist.genre}</p>}
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </p>
          <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${STATUS_COLORS[slot.status]}`}>
            {STATUS_LABELS[slot.status]}
          </span>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={async () => {
                await onStatusChange(slot.id, nextStatus[slot.status], festivalId);
                onToast("הסטטוס עודכן");
              }}
              className="text-gray-400 hover:text-violet-600 text-xs transition"
              title="שנה סטטוס"
              aria-label="שנה סטטוס הופעה"
            >
              ↺
            </button>
            <button
              onClick={async () => {
                const ok = await onConfirm({ message: "למחוק הופעה זו?", danger: true, confirmLabel: "מחק" });
                if (ok) { await onDelete(slot.id, festivalId); onToast("ההופעה נמחקה"); }
              }}
              className="text-gray-300 hover:text-red-500 text-xs transition"
              aria-label="מחק הופעה"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {slot.notes && <p className="text-xs text-gray-400 mt-1.5 truncate">{slot.notes}</p>}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
