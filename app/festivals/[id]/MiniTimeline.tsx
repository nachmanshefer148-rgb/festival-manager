"use client";

import { useState, useEffect } from "react";
import { SlotData } from "./StagePanel";

interface StageRow {
  id: string;
  name: string;
  slots: SlotData[];
}

interface Props {
  stages: StageRow[];
}

export default function MiniTimeline({ stages }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000); // update every 10s — timeline doesn't need per-second accuracy
    return () => clearInterval(t);
  }, []);
  // Determine the visible window: earliest slot start or now-30min, to latest slot end or now+3h
  const allSlots = stages.flatMap((s) => s.slots).filter((s) => s.status !== "CANCELLED");
  if (allSlots.length === 0) return null;

  const earliestStart = Math.min(...allSlots.map((s) => new Date(s.startTime).getTime()));
  const latestEnd = Math.max(...allSlots.map((s) => new Date(s.endTime).getTime()));

  const windowStart = Math.min(earliestStart, now.getTime() - 30 * 60000);
  const windowEnd = Math.max(latestEnd, now.getTime() + 3 * 60 * 60000);
  const windowDuration = windowEnd - windowStart;

  function pct(ts: number) {
    return ((ts - windowStart) / windowDuration) * 100;
  }

  function fmtHour(ts: number) {
    return new Date(ts).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  }

  const nowPct = pct(now.getTime());

  // Tick marks every hour
  const ticks: number[] = [];
  const tickStart = new Date(windowStart);
  tickStart.setMinutes(0, 0, 0);
  tickStart.setTime(tickStart.getTime() + 3600000); // first full hour
  for (let t = tickStart.getTime(); t < windowEnd; t += 3600000) {
    ticks.push(t);
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 overflow-hidden">
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">Timeline</p>
      <div className="space-y-2">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-2">
            <span className="text-gray-500 text-xs w-20 shrink-0 text-left truncate">{stage.name}</span>
            <div className="relative flex-1 h-6 bg-gray-800 rounded-md overflow-hidden">
              {stage.slots
                .filter((s) => s.status !== "CANCELLED")
                .map((slot) => {
                  const left = pct(new Date(slot.startTime).getTime());
                  const width = pct(new Date(slot.endTime).getTime()) - left;
                  const isLive =
                    slot.status === "SCHEDULED" &&
                    new Date(slot.startTime) <= now &&
                    now < new Date(slot.endTime);
                  const isDone = slot.status === "COMPLETED";

                  return (
                    <div
                      key={slot.id}
                      className={`absolute top-1 bottom-1 rounded-sm flex items-center justify-center overflow-hidden ${
                        isDone
                          ? "bg-gray-700"
                          : isLive
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                          : "bg-gray-600"
                      }`}
                      style={{
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.min(100 - Math.max(0, left), width)}%`,
                      }}
                      title={slot.artist?.name ?? "—"}
                    >
                      <span className="text-white text-[9px] font-medium truncate px-1 leading-none">
                        {slot.artist?.name ?? "—"}
                      </span>
                    </div>
                  );
                })}

              {/* Now marker */}
              {nowPct >= 0 && nowPct <= 100 && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                  style={{ left: `${nowPct}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hour ticks */}
      <div className="relative ml-22 mt-1 h-4 flex-1" style={{ marginLeft: "5.5rem" }}>
        <div className="relative w-full h-full">
          {ticks.map((t) => {
            const p = pct(t);
            if (p < 0 || p > 100) return null;
            return (
              <span
                key={t}
                className="absolute text-gray-600 text-[9px] transform -translate-x-1/2"
                style={{ left: `${p}%` }}
              >
                {fmtHour(t)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
