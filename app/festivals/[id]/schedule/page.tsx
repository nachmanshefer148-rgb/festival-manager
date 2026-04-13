export const dynamic = "force-dynamic";
import {
  createSetupTask,
  createStage,
  createTimeSlot,
  deleteSetupTask,
  deleteStage,
  deleteTimeSlot,
  updateSetupTask,
  updateTimeSlot,
  updateTimeSlotStatus,
} from "@/app/actions";
import { requireOwnedFestivalPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { festival } = await requireOwnedFestivalPage(id);

  const [stages, artists, setupTasks] = await Promise.all([
    prisma.stage.findMany({
      where: { festivalId: id },
      include: {
        timeSlots: {
          include: { artist: true },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.artist.findMany({
      where: { festivalId: id },
      orderBy: { name: "asc" },
    }),
    prisma.festivalSetupTask.findMany({
      where: { festivalId: id },
      orderBy: [{ date: "asc" }, { time: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <ScheduleClient
      festivalId={id}
      festival={{ startDate: festival.startDate.toISOString(), endDate: festival.endDate.toISOString() }}
      stages={stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        capacity: stage.capacity,
        soundcheckStart: stage.soundcheckStart,
        soundcheckEnd: stage.soundcheckEnd,
        performancesStart: stage.performancesStart,
        performancesEnd: stage.performancesEnd,
        timeSlots: stage.timeSlots.map((slot) => ({
          ...slot,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          artist: slot.artist ? { ...slot.artist } : null,
        })),
      }))}
      artists={artists}
      isAdmin={true}
      setupTasks={setupTasks}
      createStage={createStage}
      deleteStage={deleteStage}
      createTimeSlot={createTimeSlot}
      deleteTimeSlot={deleteTimeSlot}
      updateTimeSlotStatus={updateTimeSlotStatus}
      updateTimeSlot={updateTimeSlot}
      createSetupTask={createSetupTask}
      updateSetupTask={updateSetupTask}
      deleteSetupTask={deleteSetupTask}
    />
  );
}
