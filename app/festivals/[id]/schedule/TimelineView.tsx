"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";

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

interface Stage {
  id: string;
  name: string;
  timeSlots: TimeSlot[];
}

interface Props {
  stages: Stage[];
  onEditSlot?: (slot: TimeSlot) => void;
}

const STATUS_BG: Record<string, string> = {
  SCHEDULED: "",
  COMPLETED: "opacity-70",
  CANCELLED: "opacity-30",
};

const SLOT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PERFORMANCE_SCHEDULED: { bg: "bg-violet-500", border: "border-violet-700", text: "text-white" },
  PERFORMANCE_COMPLETED: { bg: "bg-green-500", border: "border-green-700", text: "text-white" },
  PERFORMANCE_CANCELLED: { bg: "bg-gray-300", border: "border-gray-400", text: "text-gray-600" },
  SOUNDCHECK_SCHEDULED: { bg: "bg-amber-400", border: "border-amber-600", text: "text-amber-900" },
  SOUNDCHECK_COMPLETED: { bg: "bg-amber-200", border: "border-amber-400", text: "text-amber-800" },
  SOUNDCHECK_CANCELLED: { bg: "bg-gray-200", border: "border-gray-300", text: "text-gray-500" },
};

function getSlotColor(slot: TimeSlot) {
  const key = `${slot.type}_${slot.status}`;
  return SLOT_COLORS[key] ?? SLOT_COLORS["PERFORMANCE_SCHEDULED"];
}

export default function TimelineView({ stages, onEditSlot }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [tooltip, setTooltip] = useState<{ slot: TimeSlot; x: number; y: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Collect all slots across all stages
  const allSlots = stages.flatMap((s) => s.timeSlots);

  if (allSlots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
        <div className="text-3xl mb-2">🕐</div>
        <p className="font-medium">אין הופעות ביום זה</p>
      </div>
    );
  }

  // Time range: earliest start − 30min to latest end + 30min
  const PADDING_MS = 30 * 60 * 1000;
  const minTime = Math.min(...allSlots.map((s) => new Date(s.startTime).getTime())) - PADDING_MS;
  const maxTime = Math.max(...allSlots.map((s) => new Date(s.endTime).getTime())) + PADDING_MS;
  const totalMs = maxTime - minTime;

  function pct(ms: number) {
    return ((ms - minTime) / totalMs) * 100;
  }

  // Generate hourly tick marks
  const ticks: Date[] = [];
  const tickStart = new Date(minTime);
  tickStart.setMinutes(0, 0, 0);
  if (tickStart.getTime() < minTime) tickStart.setHours(tickStart.getHours() + 1);
  const t = new Date(tickStart);
  while (t.getTime() <= maxTime) {
    ticks.push(new Date(t));
    t.setHours(t.getHours() + 1);
  }

  const nowPct = pct(now.getTime());
  const showNow = now.getTime() >= minTime && now.getTime() <= maxTime;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tick label header */}
      <div className="relative h-8 border-b border-gray-100 bg-gray-50 mx-0" style={{ marginRight: 80 }}>
        {ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${pct(tick.getTime())}%` }}
          >
            <div className="absolute h-full border-l border-gray-200" />
            <span className="text-xs text-gray-400 ml-1 whitespace-nowrap" dir="ltr">
              {tick.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </div>
        ))}
        {showNow && (
          <div className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10" style={{ left: `${nowPct}%` }} />
        )}
      </div>

      {/* Stage rows */}
      <div>
        {stages.map((stage) => (
          <div key={stage.id} className="flex border-b border-gray-100 last:border-0">
            {/* Stage label */}
            <div className="w-20 shrink-0 flex items-center px-3 py-2 bg-gray-50 border-r border-gray-100">
              <span className="text-xs font-semibold text-gray-700 truncate">{stage.name}</span>
            </div>

            {/* Slots track */}
            <div className="flex-1 relative" style={{ height: 56 }}>
              {/* Tick lines */}
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-gray-100"
                  style={{ left: `${pct(tick.getTime())}%` }}
                />
              ))}

              {/* Now line */}
              {showNow && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10"
                  style={{ left: `${nowPct}%` }}
                />
              )}

              {/* Slot blocks */}
              {stage.timeSlots.map((slot) => {
                const slotStart = new Date(slot.startTime).getTime();
                const slotEnd = new Date(slot.endTime).getTime();
                const leftPct = pct(slotStart);
                const widthPct = ((slotEnd - slotStart) / totalMs) * 100;
                const colors = getSlotColor(slot);
                const isSC = slot.type === "SOUNDCHECK";

                return (
                  <div
                    key={slot.id}
                    className={`absolute top-2 bottom-2 rounded border ${colors.bg} ${colors.border} ${colors.text} ${STATUS_BG[slot.status]} flex items-center overflow-hidden cursor-pointer hover:brightness-90 transition-all`}
                    style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                    onClick={() => onEditSlot?.(slot)}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).closest(".relative")?.getBoundingClientRect();
                      if (rect) setTooltip({ slot, x: e.clientX, y: rect.top - 8 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <div className="px-1.5 truncate text-xs font-medium whitespace-nowrap">
                      {isSC && <span className="opacity-70">SC · </span>}
                      {slot.artist?.name ?? "ללא אמן"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-violet-500 border border-violet-700" />
          הופעה
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400 border border-amber-600" />
          סאונדצ׳ק
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500 border border-green-700" />
          הסתיים
        </div>
        {showNow && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-400" />
            עכשיו
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 60 }}
        >
          <p className="font-semibold">{tooltip.slot.artist?.name ?? "ללא אמן"}</p>
          <p className="text-gray-300">{tooltip.slot.type === "SOUNDCHECK" ? "סאונדצ׳ק" : "הופעה"}</p>
          <p dir="ltr">{formatTime(tooltip.slot.startTime)} – {formatTime(tooltip.slot.endTime)}</p>
          {tooltip.slot.technicianName && <p className="text-gray-300">🎚️ {tooltip.slot.technicianName}</p>}
        </div>
      )}
    </div>
  );
}
