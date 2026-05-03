"use client";

import { useState, useEffect } from "react";
import { formatTime, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmDialog";
import TimelineView from "./TimelineView";

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
  type: string;
  notes: string | null;
  technicianName: string | null;
  artistId: string | null;
  artist: Artist | null;
}

interface SetupTask {
  id: string;
  dayLabel: string;
  date: string | null;
  time: string | null;
  category: string | null;
  description: string;
  responsible: string | null;
}

interface Stage {
  id: string;
  name: string;
  capacity: number | null;
  soundcheckStart: string | null;
  soundcheckEnd: string | null;
  performancesStart: string | null;
  performancesEnd: string | null;
  timeSlots: TimeSlot[];
}

interface Props {
  festivalId: string;
  section: "performances" | "technical";
  festival: { startDate: string; endDate: string };
  stages: Stage[];
  artists: Artist[];
  isAdmin: boolean;
  setupTasks: SetupTask[];
  createStage: (formData: FormData) => Promise<void>;
  deleteStage: (id: string, festivalId: string) => Promise<void>;
  createTimeSlot: (formData: FormData) => Promise<{ error?: string }>;
  deleteTimeSlot: (id: string, festivalId: string) => Promise<void>;
  updateTimeSlotStatus: (id: string, status: string, festivalId: string) => Promise<void>;
  updateTimeSlot: (id: string, festivalId: string, formData: FormData) => Promise<{ error?: string }>;
  createSetupTask: (festivalId: string, dayLabel: string, date: string | null, time: string | null, category: string | null, description: string, responsible: string | null) => Promise<void>;
  updateSetupTask: (id: string, festivalId: string, formData: FormData) => Promise<void>;
  deleteSetupTask: (id: string, festivalId: string) => Promise<void>;
}

// Convert ISO string → datetime-local value in local time
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Add minutes to a local datetime-input string (YYYY-MM-DDTHH:MM)
function addMinutesToLocalInput(localInput: string, minutes: number): string {
  const d = new Date(localInput);
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Detect conflicting slots within a list
function computeConflicts(slots: TimeSlot[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      if (a.status === "CANCELLED" || b.status === "CANCELLED") continue;
      const aS = new Date(a.startTime).getTime(), aE = new Date(a.endTime).getTime();
      const bS = new Date(b.startTime).getTime(), bE = new Date(b.endTime).getTime();
      if (aS < bE && aE > bS) { ids.add(a.id); ids.add(b.id); }
    }
  }
  return ids;
}

// Detect slots that fall within another slot's breakAfter window
function computeBreakWarnings(slots: TimeSlot[]): Set<string> {
  const ids = new Set<string>();
  for (const a of slots) {
    if (a.status === "CANCELLED" || a.type !== "PERFORMANCE" || !a.artist || a.artist.breakAfter <= 0) continue;
    const aEnd = new Date(a.endTime).getTime();
    const breakEnd = aEnd + a.artist.breakAfter * 60000;
    for (const b of slots) {
      if (b.id === a.id || b.status === "CANCELLED") continue;
      const bStart = new Date(b.startTime).getTime();
      if (bStart > aEnd && bStart < breakEnd) ids.add(b.id);
    }
  }
  return ids;
}

// Check if HH:MM time falls within a stage window (handles midnight wrap)
function isOutsideWindow(timeHHMM: string, windowStart: string | null, windowEnd: string | null): boolean {
  if (!windowStart || !windowEnd) return false;
  const [th, tm] = timeHHMM.split(":").map(Number);
  const [sh, sm] = windowStart.split(":").map(Number);
  const [eh, em] = windowEnd.split(":").map(Number);
  const t = th * 60 + tm;
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (s <= e) return t < s || t > e;
  // midnight wrap
  return t < s && t > e;
}

export default function ScheduleClient({
  festivalId,
  section,
  festival,
  stages,
  artists,
  isAdmin,
  setupTasks,
  createStage,
  deleteStage,
  createTimeSlot,
  deleteTimeSlot,
  updateTimeSlotStatus,
  updateTimeSlot,
  createSetupTask,
  updateSetupTask,
  deleteSetupTask,
}: Props) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [showAddStage, setShowAddStage] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedStageForSlot, setSelectedStageForSlot] = useState(stages[0]?.id ?? "");
  const [submittingStage, setSubmittingStage] = useState(false);
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [showSetupTasks, setShowSetupTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<SetupTask | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const showPerformances = section === "performances";
  const showTechnical = section === "technical";

  // Optimistic slot overrides for drag feedback (cleared on server revalidation)
  const [optimisticSlots, setOptimisticSlots] = useState<Record<string, { startTime: string; endTime: string }>>({});

  async function handleMoveSlot(slotId: string, newStart: Date, newEnd: Date) {
    // Show new position immediately (no snap-back)
    setOptimisticSlots((prev) => ({
      ...prev,
      [slotId]: { startTime: newStart.toISOString(), endTime: newEnd.toISOString() },
    }));
    const fd = new FormData();
    fd.set("startTime", newStart.toISOString());
    fd.set("endTime", newEnd.toISOString());
    const result = await updateTimeSlot(slotId, festivalId, fd);
    if (result?.error) {
      toast(result.error, "error");
      // Revert optimistic state on error
      setOptimisticSlots((prev) => { const n = { ...prev }; delete n[slotId]; return n; });
    } else {
      setOptimisticSlots((prev) => { const n = { ...prev }; delete n[slotId]; return n; });
    }
  }

  function exportCSV() {
    const BOM = "\uFEFF";
    const header = "במה,אמן,סוג,התחלה,סיום,סטטוס,הערות";
    const rows = stagesWithFiltered.flatMap((stage) =>
      stage.timeSlots.map((slot) =>
        [
          `"${stage.name}"`,
          `"${slot.artist?.name ?? ""}"`,
          slot.type === "SOUNDCHECK" ? "סאונדצ׳ק" : "הופעה",
          formatTime(slot.startTime),
          formatTime(slot.endTime),
          slot.status === "COMPLETED" ? "הסתיים" : slot.status === "CANCELLED" ? "בוטל" : "מתוכנן",
          `"${(slot.notes ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      )
    );
    const csv = BOM + [header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportICal() {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Festival Manager//HE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    for (const stage of stagesWithFiltered) {
      for (const slot of stage.timeSlots) {
        if (!slot.artist) continue;
        lines.push(
          "BEGIN:VEVENT",
          `DTSTART:${fmt(new Date(slot.startTime))}`,
          `DTEND:${fmt(new Date(slot.endTime))}`,
          `SUMMARY:${slot.artist.name} \u2014 ${stage.name}`,
          ...(slot.notes ? [`DESCRIPTION:${slot.notes.replace(/\n/g, "\\n")}`] : []),
          `UID:${slot.id}@festival-manager`,
          "END:VEVENT",
        );
      }
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${selectedDate}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Edit slot state
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editType, setEditType] = useState<"SOUNDCHECK" | "PERFORMANCE">("PERFORMANCE");
  const [editArtistId, setEditArtistId] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editAutoCalc, setEditAutoCalc] = useState(true);
  const [editError, setEditError] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Create slot type
  const [createType, setCreateType] = useState<"SOUNDCHECK" | "PERFORMANCE">("PERFORMANCE");

  // Build date tabs
  const festivalStart = new Date(festival.startDate);
  const festivalEnd = new Date(festival.endDate);
  const dates: string[] = [];
  const cur = new Date(festivalStart);
  while (cur <= festivalEnd) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");

  const stagesWithFiltered = stages.map((stage) => ({
    ...stage,
    timeSlots: stage.timeSlots
      .map((ts) => optimisticSlots[ts.id] ? { ...ts, ...optimisticSlots[ts.id] } : ts)
      .filter((ts) => ts.startTime.split("T")[0] === selectedDate),
  }));

  const formatDateLabel = (d: string) =>
    new Date(d).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" });

  // Initialize edit form when slot opens
  useEffect(() => {
    if (!editingSlot) return;
    setEditType((editingSlot.type as "SOUNDCHECK" | "PERFORMANCE") || "PERFORMANCE");
    setEditArtistId(editingSlot.artistId ?? "");
    setEditStartTime(toLocalInput(editingSlot.startTime));
    setEditEndTime(toLocalInput(editingSlot.endTime));
    setEditAutoCalc(true);
    setEditError("");
  }, [editingSlot]);

  // Auto-recalculate endTime when type/artist/startTime changes
  useEffect(() => {
    if (!editAutoCalc || !editStartTime) return;
    const artist = artists.find((a) => a.id === editArtistId);
    if (!artist) return;
    const duration = editType === "SOUNDCHECK" ? artist.soundcheckDuration : artist.setDuration;
    setEditEndTime(addMinutesToLocalInput(editStartTime, duration));
  }, [editAutoCalc, editType, editArtistId, editStartTime, artists]);

  const stageForEdit = editingSlot ? stages.find((s) => s.timeSlots.some((t) => t.id === editingSlot.id)) : null;
  const editWindowWarning = (() => {
    if (!stageForEdit || !editStartTime) return "";
    const hhmm = editStartTime.slice(11, 16);
    if (editType === "SOUNDCHECK" && isOutsideWindow(hhmm, stageForEdit.soundcheckStart, stageForEdit.soundcheckEnd))
      return `מחוץ לחלון הסאונדצ'ק של הבמה (${stageForEdit.soundcheckStart}–${stageForEdit.soundcheckEnd})`;
    if (editType === "PERFORMANCE" && isOutsideWindow(hhmm, stageForEdit.performancesStart, stageForEdit.performancesEnd))
      return `מחוץ לחלון ההופעות של הבמה (${stageForEdit.performancesStart}–${stageForEdit.performancesEnd})`;
    return "";
  })();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {showTechnical ? "📋 לוז טכני כללי" : "📅 לוח הופעות"}
        </h1>
        <div className="flex gap-2 items-center">
          {showPerformances && (
            <>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 transition-colors ${viewMode === "list" ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  רשימה
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-3 py-1.5 transition-colors ${viewMode === "timeline" ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  ציר זמן
                </button>
              </div>
              <button
                onClick={exportCSV}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                title="ייצוא CSV"
              >
                ↓ CSV
              </button>
              <button
                onClick={exportICal}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                title="ייצוא iCal (Google Calendar)"
              >
                📅 iCal
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                title="הדפס"
              >
                🖨️
              </button>
              {isAdmin && (
                <>
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
                      + תזמן
                    </button>
                  )}
                </>
              )}
            </>
          )}
          {showTechnical && isAdmin && (
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              + הוסף משימה
            </button>
          )}
        </div>
      </div>

      {/* Setup Tasks */}
      {showTechnical && (
      <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSetupTasks(!showSetupTasks)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">📋 לוז טכני כללי</span>
            {setupTasks.length > 0 && (
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{setupTasks.length} משימות</span>
            )}
          </div>
          <span className="text-gray-400 text-sm">{showSetupTasks ? "▲" : "▼"}</span>
        </button>

        {showSetupTasks && (
          <div className="border-t border-gray-100">
            {setupTasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">אין משימות עדיין</p>
            ) : (
              <div>
                {Array.from(new Set(setupTasks.map((t) => t.dayLabel))).map((day) => (
                  <div key={day}>
                    <div className="bg-violet-50 px-4 py-1.5 text-xs font-bold text-violet-700 border-b border-violet-100">{day}</div>
                    <table className="w-full text-sm">
                      <tbody>
                        {setupTasks.filter((t) => t.dayLabel === day).map((task) => (
                          <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                            <td className="px-3 py-2 text-gray-500 w-16 shrink-0" dir="ltr">{task.time ?? ""}</td>
                            <td className="px-2 py-2 text-violet-600 font-medium w-24 shrink-0">{task.category ?? ""}</td>
                            <td className="px-2 py-2 text-gray-800 flex-1">{task.description}</td>
                            <td className="px-2 py-2 text-gray-400 w-24 shrink-0">{task.responsible ?? ""}</td>
                            {isAdmin && (
                              <td className="px-2 py-2 w-16 shrink-0">
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => setEditingTask(task)} className="text-gray-400 hover:text-violet-600 text-xs">✏️</button>
                                  <button onClick={async () => {
                                    const ok = await confirm({ message: "למחוק משימה זו?", danger: true, confirmLabel: "מחק" });
                                    if (ok) { await deleteSetupTask(task.id, festivalId); toast("המשימה נמחקה"); }
                                  }} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            {isAdmin && (
              <div className="px-4 py-2 border-t border-gray-100">
                <button onClick={() => setShowAddTask(true)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                  + הוסף משימה
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Date tabs */}
      {showPerformances && dates.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDate === d ? "bg-violet-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {formatDateLabel(d)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {showPerformances && (stages.length === 0 ? (
        isAdmin ? (
          <button
            onClick={() => setShowAddStage(true)}
            className="w-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors cursor-pointer group"
          >
            <div className="text-4xl mb-2">🎪</div>
            <p className="font-medium">עדיין אין שלבים</p>
            <p className="text-sm mt-1">הוסף שלב ראשון כדי להתחיל</p>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🎪</div>
            <p className="font-medium">עדיין אין שלבים</p>
          </div>
        )
      ) : viewMode === "timeline" ? (
        <TimelineView
          stages={stagesWithFiltered}
          onEditSlot={isAdmin ? (slot) => setEditingSlot(slot) : undefined}
          onMoveSlot={isAdmin ? handleMoveSlot : undefined}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stagesWithFiltered.map((stage) => {
            const conflictIds = computeConflicts(stage.timeSlots);
            const breakWarningIds = computeBreakWarnings(stage.timeSlots);
            return (
              <div key={stage.id} className="min-w-64 flex-shrink-0">
                <div className="bg-violet-700 text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold">{stage.name}</span>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        const ok = await confirm({ message: `למחוק את השלב "${stage.name}"?`, danger: true, confirmLabel: "מחק" });
                        if (ok) { await deleteStage(stage.id, festivalId); toast("השלב נמחק"); }
                      }}
                      className="text-violet-300 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
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
                        hasConflict={conflictIds.has(slot.id)}
                        hasBreakWarning={breakWarningIds.has(slot.id)}
                        onEdit={() => setEditingSlot(slot)}
                        onDelete={deleteTimeSlot}
                        onStatusChange={updateTimeSlotStatus}
                        onToast={toast}
                        onConfirm={confirm}
                      />
                    ))
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => { setSelectedStageForSlot(stage.id); setShowAddSlot(true); }}
                      className="w-full text-xs text-gray-400 hover:text-violet-600 py-2 border border-dashed border-gray-300 rounded-lg hover:border-violet-300 transition-colors"
                    >
                      + הוסף
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

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
              <input name="name" required autoFocus placeholder='שלב ראשי, Stage B...' className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קיבולת</label>
              <input name="capacity" type="number" placeholder="5000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מיקום</label>
              <input name="location" placeholder="צפון הגן..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
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
        <Modal title="תזמן סלוט" onClose={() => { setShowAddSlot(false); setSlotError(""); }}>
          <form
            action={async (fd) => {
              setSubmittingSlot(true);
              setSlotError("");
              // Convert datetime-local (local time) to ISO so the server gets the correct UTC time
              const localStr = fd.get("startTime") as string;
              if (localStr) fd.set("startTime", new Date(localStr).toISOString());
              try {
                const result = await createTimeSlot(fd);
                if (result?.error) { setSlotError(result.error); }
                else { setShowAddSlot(false); toast("הסלוט תוזמן"); }
              } catch { toast("שגיאה בתזמון", "error"); }
              finally { setSubmittingSlot(false); }
            }}
            className="space-y-4"
          >
            <input type="hidden" name="festivalId" value={festivalId} />
            <input type="hidden" name="type" value={createType} />

            {/* Type toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סוג</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => setCreateType("PERFORMANCE")}
                  className={`flex-1 py-2 transition-colors ${createType === "PERFORMANCE" ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  הופעה
                </button>
                <button
                  type="button"
                  onClick={() => setCreateType("SOUNDCHECK")}
                  className={`flex-1 py-2 transition-colors ${createType === "SOUNDCHECK" ? "bg-amber-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  סאונדצ׳ק
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שלב *</label>
              <select name="stageId" defaultValue={selectedStageForSlot} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אמן *</label>
              <select name="artistId" required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="">בחר אמן...</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({createType === "SOUNDCHECK" ? `${a.soundcheckDuration} דק' סאונדצ'ק` : `${a.setDuration} דק' הופעה`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה *</label>
              <input name="startTime" type="datetime-local" required defaultValue={`${selectedDate}T20:00`} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-1">
                שעת הסיום תחושב אוטומטית לפי {createType === "SOUNDCHECK" ? "משך הסאונדצ'ק" : "משך הסט"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טכנאי מפעיל</label>
              <input name="technicianName" placeholder="שם הטכנאי..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea name="notes" rows={2} placeholder="הערות נוספות..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
            </div>

            {slotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">
                ⚠️ {slotError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowAddSlot(false); setSlotError(""); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
              <button type="submit" disabled={submittingSlot} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">{submittingSlot ? "שומר..." : "תזמן"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit TimeSlot Modal */}
      {editingSlot && (
        <Modal title="עריכת סלוט" onClose={() => { setEditingSlot(null); setEditError(""); }}>
          <form
            action={async (fd) => {
              if (!editingSlot) return;
              setSubmittingEdit(true);
              setEditError("");
              // Convert local datetime strings to ISO for correct timezone handling on server
              fd.set("startTime", new Date(editStartTime).toISOString());
              fd.set("endTime", editAutoCalc ? "" : new Date(editEndTime).toISOString());
              fd.set("type", editType);
              fd.set("artistId", editArtistId);
              try {
                const result = await updateTimeSlot(editingSlot.id, festivalId, fd);
                if (result?.error) { setEditError(result.error); }
                else { setEditingSlot(null); toast("הסלוט עודכן"); }
              } catch { toast("שגיאה בעדכון", "error"); }
              finally { setSubmittingEdit(false); }
            }}
            className="space-y-4"
          >
            {/* Type toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סוג</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
                <button type="button" onClick={() => setEditType("PERFORMANCE")}
                  className={`flex-1 py-2 transition-colors ${editType === "PERFORMANCE" ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  הופעה
                </button>
                <button type="button" onClick={() => setEditType("SOUNDCHECK")}
                  className={`flex-1 py-2 transition-colors ${editType === "SOUNDCHECK" ? "bg-amber-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  סאונדצ׳ק
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אמן</label>
              <select value={editArtistId} onChange={(e) => setEditArtistId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="">ללא אמן</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה</label>
                <input
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעת סיום</label>
                <input
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(e) => { setEditEndTime(e.target.value); setEditAutoCalc(false); }}
                  disabled={editAutoCalc}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={editAutoCalc}
                onChange={(e) => setEditAutoCalc(e.target.checked)}
                className="rounded"
              />
              חשב שעת סיום אוטומטית לפי משך האמן
            </label>

            {editWindowWarning && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-3 py-2 rounded-xl">
                ⚠️ {editWindowWarning}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טכנאי מפעיל</label>
              <input name="technicianName" defaultValue={editingSlot.technicianName ?? ""} placeholder="שם הטכנאי..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <textarea name="notes" defaultValue={editingSlot.notes ?? ""} rows={2} placeholder="הערות נוספות..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl">
                ⚠️ {editError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setEditingSlot(null); setEditError(""); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
              <button type="submit" disabled={submittingEdit} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">{submittingEdit ? "שומר..." : "שמור"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add/Edit Setup Task Modal */}
      {(showAddTask || editingTask) && (
        <Modal title={editingTask ? "עריכת משימה" : "הוסף משימה"} onClose={() => { setShowAddTask(false); setEditingTask(null); }}>
          <form
            action={async (fd) => {
              setSubmittingTask(true);
              try {
                if (editingTask) {
                  await updateSetupTask(editingTask.id, festivalId, fd);
                  setEditingTask(null);
                  toast("המשימה עודכנה");
                } else {
                  await createSetupTask(festivalId, fd.get("dayLabel") as string, (fd.get("date") as string) || null, (fd.get("time") as string) || null, (fd.get("category") as string) || null, fd.get("description") as string, (fd.get("responsible") as string) || null);
                  setShowAddTask(false);
                  toast("המשימה נוספה");
                }
              } catch { toast("שגיאה", "error"); }
              finally { setSubmittingTask(false); }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">יום *</label>
                <input name="dayLabel" required defaultValue={editingTask?.dayLabel ?? ""} placeholder='יום א׳ 6/7' className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך (למיון)</label>
                <input name="date" type="date" defaultValue={editingTask?.date ?? ""} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שעה</label>
                <input name="time" type="time" defaultValue={editingTask?.time ?? ""} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מחלקה</label>
                <input name="category" defaultValue={editingTask?.category ?? ""} placeholder="במה, חשמל, שטח..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אחראי</label>
                <input name="responsible" defaultValue={editingTask?.responsible ?? ""} placeholder="שם האחראי" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור *</label>
                <textarea name="description" required defaultValue={editingTask?.description ?? ""} rows={2} placeholder="תיאור המשימה..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowAddTask(false); setEditingTask(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">ביטול</button>
              <button type="submit" disabled={submittingTask} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-60">{submittingTask ? "שומר..." : editingTask ? "שמור" : "הוסף"}</button>
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
  hasConflict,
  hasBreakWarning,
  onEdit,
  onDelete,
  onStatusChange,
  onToast,
  onConfirm,
}: {
  slot: TimeSlot;
  festivalId: string;
  isAdmin: boolean;
  hasConflict: boolean;
  hasBreakWarning: boolean;
  onEdit: () => void;
  onDelete: (id: string, festivalId: string) => Promise<void>;
  onStatusChange: (id: string, status: string, festivalId: string) => Promise<void>;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
  onConfirm: (opts: { message: string; danger?: boolean; confirmLabel?: string }) => Promise<boolean>;
}) {
  const isSoundcheck = slot.type === "SOUNDCHECK";

  const statusBorder: Record<string, string> = {
    SCHEDULED: isSoundcheck ? "border-r-amber-400" : "border-r-blue-400",
    COMPLETED: "border-r-green-400",
    CANCELLED: "border-r-red-400 opacity-60",
  };

  const nextStatus: Record<string, string> = {
    SCHEDULED: "COMPLETED",
    COMPLETED: "SCHEDULED",
    CANCELLED: "SCHEDULED",
  };

  return (
    <div className={`bg-white rounded-xl p-3 border-r-4 shadow-sm ${statusBorder[slot.status] ?? "border-r-gray-300"} ${hasConflict ? "ring-2 ring-red-400 ring-offset-1" : hasBreakWarning ? "ring-2 ring-orange-300 ring-offset-1" : ""}`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isSoundcheck && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">SC</span>
            )}
            <p className="font-semibold text-gray-900 text-sm truncate">{slot.artist?.name ?? "ללא אמן"}</p>
          </div>
          {slot.artist?.genre && <p className="text-xs text-violet-500">{slot.artist.genre}</p>}
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[slot.status]}`}>
              {STATUS_LABELS[slot.status]}
            </span>
            {hasConflict && <span className="text-xs text-red-500 font-medium">⚠️ חפיפה</span>}
            {!hasConflict && hasBreakWarning && <span className="text-xs text-orange-500 font-medium">⏱ הפסקה קצרה</span>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={onEdit} className="text-gray-400 hover:text-violet-600 text-xs transition" title="ערוך">✏️</button>
            <button
              onClick={async () => { await onStatusChange(slot.id, nextStatus[slot.status], festivalId); onToast("הסטטוס עודכן"); }}
              className="text-gray-400 hover:text-violet-600 text-xs transition"
              title="שנה סטטוס"
            >↺</button>
            <button
              onClick={async () => {
                const ok = await onConfirm({ message: "למחוק הופעה זו?", danger: true, confirmLabel: "מחק" });
                if (ok) { await onDelete(slot.id, festivalId); onToast("ההופעה נמחקה"); }
              }}
              className="text-gray-300 hover:text-red-500 text-xs transition"
            >✕</button>
          </div>
        )}
      </div>
      {slot.technicianName && <p className="text-xs text-blue-400 mt-1 truncate">🎚️ {slot.technicianName}</p>}
      {slot.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{slot.notes}</p>}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
