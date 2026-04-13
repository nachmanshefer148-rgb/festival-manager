export const dynamic = "force-dynamic";
import { extendTimeSlot, updateTimeSlotStatus } from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import LiveDashboard from "./LiveDashboard";

export default async function FestivalDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { festival, isAdmin, canViewBudget } = await requireFestivalAccessPage(id);

  const fullFestival = await prisma.festival.findUnique({
    where: { id },
    include: {
      stages: {
        include: {
          timeSlots: {
            include: { artist: true },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      budgetItems: true,
    },
  });

  if (!fullFestival) throw new Error("Festival not found");

  const income = fullFestival.budgetItems
    .filter((b) => b.type === "INCOME")
    .reduce((sum, b) => sum + b.amount, 0);
  const expenses = fullFestival.budgetItems
    .filter((b) => b.type === "EXPENSE")
    .reduce((sum, b) => sum + b.amount, 0);

  const conflicts: string[] = [];
  for (const stage of fullFestival.stages) {
    const slots = stage.timeSlots
      .filter((s) => s.status === "SCHEDULED")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    for (let i = 0; i < slots.length - 1; i++) {
      if (new Date(slots[i].endTime) > new Date(slots[i + 1].startTime)) {
        conflicts.push(
          `קונפליקט בשלב "${stage.name}": ${slots[i].artist?.name ?? "לא ידוע"} ו-${slots[i + 1].artist?.name ?? "לא ידוע"}`
        );
      }
    }
  }

  const stagesData = fullFestival.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    capacity: stage.capacity,
    timeSlots: stage.timeSlots.map((ts) => ({
      id: ts.id,
      startTime: ts.startTime.toISOString(),
      endTime: ts.endTime.toISOString(),
      status: ts.status,
      notes: ts.notes,
      artist: ts.artist
        ? {
            id: ts.artist.id,
            name: ts.artist.name,
            genre: ts.artist.genre,
            setDuration: ts.artist.setDuration,
            soundcheckDuration: ts.artist.soundcheckDuration,
            breakAfter: ts.artist.breakAfter,
          }
        : null,
    })),
  }));

  return (
    <LiveDashboard
      festivalId={id}
      festivalName={festival.name}
      festivalLocation={festival.location}
      stagesData={stagesData}
      conflicts={conflicts}
      showBudget={canViewBudget}
      budgetBalance={income - expenses}
      income={income}
      expenses={expenses}
      isAdmin={isAdmin}
      extendTimeSlot={extendTimeSlot}
      updateTimeSlotStatus={updateTimeSlotStatus}
    />
  );
}
