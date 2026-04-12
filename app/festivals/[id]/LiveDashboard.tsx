"use client";

import { memo } from "react";
import LiveClock from "./LiveClock";
import StagePanel, { SlotData } from "./StagePanel";
import MiniTimeline from "./MiniTimeline";

interface StageData {
  id: string;
  name: string;
  capacity: number | null;
  timeSlots: SlotData[];
}

interface Props {
  festivalId: string;
  festivalName: string;
  festivalLocation: string | null;
  stagesData: StageData[];
  conflicts: string[];
  showBudget: boolean;
  budgetBalance: number;
  income: number;
  expenses: number;
  isAdmin: boolean;
  extendTimeSlot: (id: string, extraMinutes: number, festivalId: string) => Promise<void>;
  updateTimeSlotStatus: (id: string, status: string, festivalId: string) => Promise<void>;
}

// Memoize heavy panels so they only re-render when their props change,
// not when the clock ticks in LiveClock.
const MemoStagePanel = memo(StagePanel);
const MemoTimeline = memo(MiniTimeline);

export default function LiveDashboard({
  festivalId,
  festivalName,
  festivalLocation,
  stagesData,
  conflicts,
  showBudget,
  budgetBalance,
  income,
  expenses,
  isAdmin,
  extendTimeSlot,
  updateTimeSlotStatus,
}: Props) {
  const stageCount = stagesData.length;
  const gridClass =
    stageCount === 1
      ? "max-w-2xl mx-auto"
      : stageCount === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
      : stageCount === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto";

  const balanceColor = budgetBalance >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Top bar — LiveClock is isolated here so only it re-renders every second */}
      <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 sm:px-6 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white font-black text-xl sm:text-2xl truncate">{festivalName}</h1>
            {festivalLocation && (
              <p className="text-gray-500 text-xs truncate">{festivalLocation}</p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {showBudget && (
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className={`text-lg font-black tabular-nums ${balanceColor}`}>
                  {budgetBalance >= 0 ? "+" : ""}
                  {budgetBalance.toLocaleString("he-IL")}₪
                </span>
                <span className="text-gray-600">
                  הכנסות {income.toLocaleString()} · הוצאות {expenses.toLocaleString()}
                </span>
              </div>
            )}
            <LiveClock />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="bg-red-950 border border-red-700 rounded-xl p-4 space-y-1">
            <p className="text-red-400 text-sm font-bold">⚠ קונפליקטים</p>
            {conflicts.map((c, i) => (
              <p key={i} className="text-red-300 text-sm">{c}</p>
            ))}
          </div>
        )}

        {/* Stage panels — each panel manages its own internal clock */}
        <div className={gridClass}>
          {stagesData.map((stage) => (
            <MemoStagePanel
              key={stage.id}
              stageName={stage.name}
              stageCapacity={stage.capacity}
              slots={stage.timeSlots}
              isAdmin={isAdmin}
              festivalId={festivalId}
              extendTimeSlot={extendTimeSlot}
              updateTimeSlotStatus={updateTimeSlotStatus}
            />
          ))}
        </div>

        {/* Mobile budget */}
        {showBudget && (
          <div className="sm:hidden bg-gray-900 rounded-xl border border-gray-800 p-4 flex justify-between items-center">
            <span className="text-gray-400 text-sm">יתרה</span>
            <span className={`text-xl font-black tabular-nums ${balanceColor}`}>
              {budgetBalance >= 0 ? "+" : ""}
              {budgetBalance.toLocaleString("he-IL")}₪
            </span>
          </div>
        )}

        {/* Mini timeline — manages its own internal clock */}
        <MemoTimeline
          stages={stagesData.map((s) => ({ id: s.id, name: s.name, slots: s.timeSlots }))}
        />
      </main>
    </div>
  );
}
