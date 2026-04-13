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

  const balanceColor = budgetBalance >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Info bar — clock + budget summary */}
      <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-3">
        <LiveClock />
        {showBudget && (
          <div className="flex flex-col items-end text-xs">
            <span className={`text-lg font-black tabular-nums ${balanceColor}`}>
              {budgetBalance >= 0 ? "+" : ""}
              {budgetBalance.toLocaleString("he-IL")}₪
            </span>
            <span className="text-gray-400">
              הכנסות {income.toLocaleString()} · הוצאות {expenses.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          <p className="text-red-700 text-sm font-bold">⚠ קונפליקטים</p>
          {conflicts.map((c, i) => (
            <p key={i} className="text-red-600 text-sm">{c}</p>
          ))}
        </div>
      )}

      {/* Stage panels */}
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

      {/* Mini timeline */}
      <MemoTimeline
        stages={stagesData.map((s) => ({ id: s.id, name: s.name, slots: s.timeSlots }))}
      />
    </div>
  );
}
