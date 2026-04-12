"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  artist: {
    id: string;
    name: string;
    genre: string | null;
    setDuration: number | null;
    soundcheckDuration: number | null;
    breakAfter: number | null;
  } | null;
}

interface Props {
  stageName: string;
  stageCapacity: number | null;
  slots: SlotData[];
  isAdmin: boolean;
  festivalId: string;
  extendTimeSlot: (id: string, extraMinutes: number, festivalId: string) => Promise<void>;
  updateTimeSlotStatus: (id: string, status: string, festivalId: string) => Promise<void>;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export default function StagePanel({
  stageName,
  slots,
  isAdmin,
  festivalId,
  extendTimeSlot,
  updateTimeSlotStatus,
}: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [extending, setExtending] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const scheduledSlots = slots
    .filter((s) => s.status === "SCHEDULED")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const liveSlot = scheduledSlots.find(
    (s) => new Date(s.startTime) <= now && now < new Date(s.endTime)
  );

  const nextSlot = scheduledSlots.find((s) => new Date(s.startTime) > now);

  // Soundcheck window: soundcheckDuration minutes before startTime
  const soundcheckSlot =
    !liveSlot && nextSlot && nextSlot.artist?.soundcheckDuration
      ? (() => {
          const scStart = new Date(new Date(nextSlot.startTime).getTime() - nextSlot.artist!.soundcheckDuration! * 60000);
          return scStart <= now && now < new Date(nextSlot.startTime) ? nextSlot : null;
        })()
      : null;

  async function handleExtend(minutes: number) {
    if (!liveSlot) return;
    setBusy(true);
    try {
      await extendTimeSlot(liveSlot.id, minutes, festivalId);
      router.refresh();
    } finally {
      setBusy(false);
      setExtending(false);
      setShowCustom(false);
      setCustomMin("");
    }
  }

  async function handleComplete() {
    if (!liveSlot) return;
    const ok = window.confirm(`לסמן את ${liveSlot.artist?.name ?? "הסט"} כסיום?`);
    if (!ok) return;
    setBusy(true);
    try {
      await updateTimeSlotStatus(liveSlot.id, "COMPLETED", festivalId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // LIVE state
  if (liveSlot) {
    const start = new Date(liveSlot.startTime).getTime();
    const end = new Date(liveSlot.endTime).getTime();
    const total = end - start;
    const elapsed = now.getTime() - start;
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const remaining = end - now.getTime();
    const isWarning = remaining < 10 * 60 * 1000;

    return (
      <div className="bg-gray-900 rounded-2xl border border-red-600 shadow-lg shadow-red-900/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-red-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-bold tracking-widest uppercase">Live</span>
          </div>
          <span className="text-white/80 text-sm font-semibold">{stageName}</span>
        </div>

        {/* Artist */}
        <div className="px-5 py-4">
          <p className="text-white text-3xl font-black tracking-tight leading-none">
            {liveSlot.artist?.name ?? "—"}
          </p>
          {liveSlot.artist?.genre && (
            <p className="text-gray-400 text-sm mt-1 uppercase tracking-wider">
              {liveSlot.artist.genre}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{fmtTime(liveSlot.startTime)}</span>
              <span className={isWarning ? "text-red-400 font-bold animate-pulse" : "text-gray-300"}>
                נותר {fmtCountdown(remaining)}
              </span>
              <span>{fmtTime(liveSlot.endTime)}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isWarning
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-violet-600 to-fuchsia-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {!showCustom ? (
                <>
                  <button
                    onClick={() => handleExtend(5)}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleExtend(10)}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setShowCustom(true)}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    +?
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={busy}
                    className="mr-auto px-3 py-1.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    ✓ סיים
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    placeholder="דקות"
                    className="w-20 px-2 py-1.5 rounded-lg bg-gray-800 text-white text-sm border border-gray-600 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={() => handleExtend(Number(customMin))}
                    disabled={busy || !customMin || Number(customMin) <= 0}
                    className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition-colors"
                  >
                    הוסף
                  </button>
                  <button
                    onClick={() => { setShowCustom(false); setCustomMin(""); }}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-colors"
                  >
                    ביטול
                  </button>
                </>
              )}
            </div>
          )}

          {/* Next slot preview */}
          {nextSlot && (
            <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500">
              <span className="text-gray-400 font-medium">הבא: </span>
              <span className="text-gray-300">{nextSlot.artist?.name ?? "—"}</span>
              <span className="mx-1">·</span>
              <span>{fmtTime(nextSlot.startTime)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SOUNDCHECK state
  if (soundcheckSlot) {
    const scEnd = new Date(soundcheckSlot.startTime).getTime();
    const timeToStart = scEnd - now.getTime();

    return (
      <div className="bg-gray-900 rounded-2xl border border-amber-500 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-amber-500/20 border-b border-amber-500/30">
          <span className="text-amber-400 text-sm font-bold tracking-widest uppercase">Soundcheck</span>
          <span className="text-gray-400 text-sm">{stageName}</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-white text-2xl font-black">{soundcheckSlot.artist?.name ?? "—"}</p>
          {soundcheckSlot.artist?.genre && (
            <p className="text-gray-400 text-sm uppercase tracking-wider mt-1">{soundcheckSlot.artist.genre}</p>
          )}
          <p className="text-amber-400 text-lg font-bold mt-3">
            הופעה בעוד {fmtCountdown(timeToStart)}
          </p>
          <p className="text-gray-500 text-xs mt-1">התחלה: {fmtTime(soundcheckSlot.startTime)}</p>
        </div>
      </div>
    );
  }

  // CHANGEOVER / NEXT state
  if (nextSlot) {
    const msToNext = new Date(nextSlot.startTime).getTime() - now.getTime();

    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700">
          <span className="text-gray-400 text-sm font-bold tracking-widest uppercase">Changeover</span>
          <span className="text-gray-500 text-sm">{stageName}</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-gray-500 text-sm mb-1">הבא</p>
          <p className="text-white text-2xl font-black">{nextSlot.artist?.name ?? "—"}</p>
          {nextSlot.artist?.genre && (
            <p className="text-gray-400 text-sm uppercase tracking-wider mt-1">{nextSlot.artist.genre}</p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tabular-nums">{fmtCountdown(msToNext)}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">התחלה: {fmtTime(nextSlot.startTime)}</p>
          {nextSlot.artist?.soundcheckDuration && (
            <p className="text-gray-500 text-xs">
              סאונדצ'ק: {fmtTime(new Date(new Date(nextSlot.startTime).getTime() - nextSlot.artist.soundcheckDuration * 60000).toISOString())}
            </p>
          )}
        </div>
      </div>
    );
  }

  // DONE state
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-800/50 border-b border-gray-800">
        <span className="text-gray-600 text-sm font-bold tracking-widest uppercase">Done</span>
        <span className="text-gray-600 text-sm">{stageName}</span>
      </div>
      <div className="px-5 py-6 text-center">
        <p className="text-gray-600 text-sm">סיום הופעות</p>
      </div>
    </div>
  );
}
