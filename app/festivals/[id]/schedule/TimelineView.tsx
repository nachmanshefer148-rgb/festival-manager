"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatTime } from "@/lib/utils";
import {
  DndContext,
  useDraggable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

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
  onMoveSlot?: (slotId: string, newStart: Date, newEnd: Date) => Promise<void>;
}

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

function snapToMinutes(ms: number, minutes: number): number {
  const snapMs = minutes * 60 * 1000;
  return Math.round(ms / snapMs) * snapMs;
}

function zoomLabel(z: number): string {
  if (z >= 1) return `${z}x`;
  if (z === 0.5) return "½x";
  if (z === 0.25) return "¼x";
  return "⅛x";
}

function DraggableSlot({
  slot,
  style,
  className,
  children,
  disabled,
}: {
  slot: TimeSlot;
  style: React.CSSProperties;
  className: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot.id,
    disabled,
  });

  const finalStyle: React.CSSProperties = {
    ...style,
    ...(transform ? { transform: `translateX(${transform.x}px)` } : {}),
    opacity: isDragging ? 0.65 : 1,
    zIndex: isDragging ? 50 : undefined,
    cursor: disabled ? "pointer" : "grab",
  };

  return (
    <div ref={setNodeRef} style={finalStyle} className={className} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

const ROW_HEIGHT = 72;
const LABEL_WIDTH = 80;
const ZOOM_LEVELS = [0.125, 0.25, 0.5, 1, 2, 4, 8];

export default function TimelineView({ stages, onEditSlot, onMoveSlot }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [tooltip, setTooltip] = useState<{ slot: TimeSlot; x: number; y: number } | null>(null);
  const [movingSlotId, setMovingSlotId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollPct, setScrollPct] = useState(0);

  const innerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const zoomIn = useCallback(() => setZoom((z) => {
    const idx = ZOOM_LEVELS.indexOf(z);
    return ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)];
  }), []);

  const zoomOut = useCallback(() => setZoom((z) => {
    const idx = ZOOM_LEVELS.indexOf(z);
    return ZOOM_LEVELS[Math.max(idx - 1, 0)];
  }), []);

  // Sync scroll position for the pan bar
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setScrollPct(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [zoom]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const allSlots = stages.flatMap((s) => s.timeSlots);

  if (allSlots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
        <div className="text-3xl mb-2">🕐</div>
        <p className="font-medium">אין הופעות ביום זה</p>
      </div>
    );
  }

  const PADDING_MS = 30 * 60 * 1000;
  const baseMin = Math.min(...allSlots.map((s) => new Date(s.startTime).getTime())) - PADDING_MS;
  const baseMax = Math.max(...allSlots.map((s) => new Date(s.endTime).getTime())) + PADDING_MS;
  const center = (baseMin + baseMax) / 2;
  const halfRange = (baseMax - baseMin) / 2;
  const minTime = zoom < 1 ? center - halfRange / zoom : baseMin;
  const maxTime = zoom < 1 ? center + halfRange / zoom : baseMax;
  const totalMs = maxTime - minTime;

  function pct(ms: number) {
    return ((ms - minTime) / totalMs) * 100;
  }

  // Hourly tick marks
  const ticks: Date[] = [];
  const tickStart = new Date(minTime);
  tickStart.setMinutes(0, 0, 0);
  if (tickStart.getTime() < minTime) tickStart.setHours(tickStart.getHours() + 1);
  const t = new Date(tickStart);
  while (t.getTime() <= maxTime) {
    ticks.push(new Date(t));
    t.setHours(t.getHours() + 1);
  }

  // Midnight markers (day boundaries)
  const midnights: Date[] = [];
  const mCursor = new Date(minTime);
  mCursor.setHours(0, 0, 0, 0);
  if (mCursor.getTime() <= minTime) mCursor.setDate(mCursor.getDate() + 1);
  while (mCursor.getTime() <= maxTime) {
    midnights.push(new Date(mCursor));
    mCursor.setDate(mCursor.getDate() + 1);
  }

  const nowPct = pct(now.getTime());
  const showNow = now.getTime() >= minTime && now.getTime() <= maxTime;
  const canScroll = zoom > 1;

  function handleDragEnd(event: DragEndEvent) {
    if (!event.delta || !onMoveSlot) return;
    const slotId = String(event.active.id);
    const slot = allSlots.find((s) => s.id === slotId);
    if (!slot) return;

    const trackWidth = (innerRef.current?.offsetWidth ?? LABEL_WIDTH) - LABEL_WIDTH;
    if (trackWidth <= 0) return;

    const deltaMs = (event.delta.x / trackWidth) * totalMs;
    const snapped = snapToMinutes(deltaMs, 5);
    if (snapped === 0) return;

    const newStart = new Date(new Date(slot.startTime).getTime() + snapped);
    const newEnd = new Date(new Date(slot.endTime).getTime() + snapped);

    setMovingSlotId(slotId);
    onMoveSlot(slotId, newStart, newEnd).finally(() => setMovingSlotId(null));
  }

  function handlePanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = (Number(e.target.value) / 100) * maxScroll;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Toolbar: zoom controls */}
        <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400 ml-1">זום:</span>
          <button
            onClick={zoomOut}
            disabled={zoom === ZOOM_LEVELS[0]}
            className="w-6 h-6 rounded text-sm font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >−</button>
          <span className="text-xs text-gray-600 w-10 text-center">{zoomLabel(zoom)}</span>
          <button
            onClick={zoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="w-6 h-6 rounded text-sm font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >+</button>
        </div>

        {/* Scrollable area */}
        <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
          <div
            ref={innerRef}
            style={{ width: zoom > 1 ? `${zoom * 100}%` : "100%", minWidth: "100%" }}
            key={zoom}
          >
            {/* Hour tick header */}
            <div className="relative h-8 border-b border-gray-100 bg-gray-50" style={{ marginLeft: LABEL_WIDTH }}>
              {ticks.map((tick, i) => {
                const p = pct(tick.getTime());
                if (p < 0 || p > 100) return null;
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{ left: `${p}%` }}
                  >
                    <div className="absolute h-full border-l border-gray-200" />
                    <span className="text-xs text-gray-400 ml-1 whitespace-nowrap" dir="ltr">
                      {tick.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                  </div>
                );
              })}

              {/* Midnight markers in header */}
              {midnights.map((midnight, i) => {
                const p = pct(midnight.getTime());
                if (p < 0 || p > 100) return null;
                return (
                  <div
                    key={`mid-h-${i}`}
                    className="absolute top-0 bottom-0 z-10"
                    style={{ left: `${p}%` }}
                  >
                    <div className="absolute h-full border-l-2 border-gray-400" />
                    <span className="absolute top-0.5 ml-1 text-[10px] font-semibold text-gray-600 whitespace-nowrap bg-gray-50 pr-1">
                      {midnight.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })}
                    </span>
                  </div>
                );
              })}

              {/* Now line */}
              {showNow && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-red-400 z-20"
                  style={{ left: `${nowPct}%` }}
                />
              )}
            </div>

            {/* Stage rows */}
            <div>
              {stages.map((stage) => (
                <div key={stage.id} className="flex border-b border-gray-100 last:border-0">
                  {/* Stage label */}
                  <div
                    className="shrink-0 flex items-center px-3 py-2 bg-gray-50 border-r border-gray-100"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="text-xs font-semibold text-gray-700 truncate">{stage.name}</span>
                  </div>

                  {/* Track */}
                  <div className="flex-1 relative" style={{ height: ROW_HEIGHT }}>
                    {/* Hourly grid lines */}
                    {ticks.map((tick, i) => {
                      const p = pct(tick.getTime());
                      if (p < 0 || p > 100) return null;
                      return (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-gray-100"
                          style={{ left: `${p}%` }}
                        />
                      );
                    })}

                    {/* Midnight lines in rows */}
                    {midnights.map((midnight, i) => {
                      const p = pct(midnight.getTime());
                      if (p < 0 || p > 100) return null;
                      return (
                        <div
                          key={`mid-r-${i}`}
                          className="absolute top-0 bottom-0 border-l-2 border-gray-300 z-10"
                          style={{ left: `${p}%` }}
                        />
                      );
                    })}

                    {/* Now line */}
                    {showNow && (
                      <div
                        className="absolute top-0 bottom-0 border-l-2 border-red-400 z-20"
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
                      const isDraggable = !!onMoveSlot && slot.status !== "CANCELLED";
                      const isMoving = movingSlotId === slot.id;

                      const slotStyle: React.CSSProperties = {
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 0.5)}%`,
                      };

                      const slotClass = [
                        "absolute top-3 bottom-3 rounded border flex flex-col justify-center overflow-hidden transition-opacity",
                        colors.bg,
                        colors.border,
                        colors.text,
                        slot.status === "CANCELLED" ? "opacity-30" : "",
                        slot.status === "COMPLETED" ? "opacity-70" : "",
                        isMoving ? "animate-pulse" : "",
                      ].filter(Boolean).join(" ");

                      return (
                        <div key={slot.id}>
                          <DraggableSlot slot={slot} style={slotStyle} className={slotClass} disabled={!isDraggable}>
                            <div
                              className="px-1.5 w-full"
                              onClick={() => onEditSlot?.(slot)}
                              onMouseEnter={(e) => setTooltip({ slot, x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <p className="text-xs font-semibold truncate leading-tight">
                                {isSC && <span className="opacity-70">SC · </span>}
                                {slot.artist?.name ?? "ללא אמן"}
                              </p>
                              <p className="text-[10px] opacity-75 truncate leading-tight" dir="ltr">
                                {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                              </p>
                            </div>
                          </DraggableSlot>

                          {/* breakAfter buffer */}
                          {slot.type === "PERFORMANCE" &&
                            slot.status !== "CANCELLED" &&
                            slot.artist &&
                            slot.artist.breakAfter > 0 &&
                            (() => {
                              const breakLeft = pct(slotEnd);
                              const breakWidth = (slot.artist.breakAfter * 60000 / totalMs) * 100;
                              return (
                                <div
                                  className="absolute top-3 bottom-3 bg-orange-100 border border-orange-300 border-dashed opacity-70 rounded-sm pointer-events-none"
                                  style={{ left: `${breakLeft}%`, width: `${breakWidth}%` }}
                                />
                              );
                            })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pan bar — shown only when zoomed in (content wider than container) */}
        {canScroll && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">◁</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(scrollPct * 100)}
              onChange={handlePanChange}
              className="flex-1 h-1.5 appearance-none rounded-full bg-gray-200 accent-violet-600 cursor-pointer"
            />
            <span className="text-xs text-gray-400 shrink-0">▷</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
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
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-dashed bg-orange-100 border-orange-300" />
            הפסקה אחרי הופעה
          </div>
          {midnights.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-r-2 border-gray-400" />
              חציית חצות
            </div>
          )}
          {showNow && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-400" />
              עכשיו
            </div>
          )}
          {onMoveSlot && (
            <div className="flex items-center gap-1.5 text-gray-400 mr-auto">
              גרור הופעה להזזתה בציר הזמן
            </div>
          )}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 90 }}
          >
            <p className="font-semibold">{tooltip.slot.artist?.name ?? "ללא אמן"}</p>
            <p className="text-gray-300">{tooltip.slot.type === "SOUNDCHECK" ? "סאונדצ׳ק" : "הופעה"}</p>
            <p dir="ltr" className="text-gray-200">
              {formatTime(tooltip.slot.startTime)} – {formatTime(tooltip.slot.endTime)}
            </p>
            {(tooltip.slot.artist?.breakAfter ?? 0) > 0 && (
              <p className="text-orange-300">הפסקה: {tooltip.slot.artist!.breakAfter} דק׳</p>
            )}
            {tooltip.slot.technicianName && (
              <p className="text-gray-300">🎚️ {tooltip.slot.technicianName}</p>
            )}
            {onMoveSlot && tooltip.slot.status !== "CANCELLED" && (
              <p className="text-gray-500 mt-0.5">גרור להזזה · לחץ לעריכה</p>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}
