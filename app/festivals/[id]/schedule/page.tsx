export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createStage, deleteStage, createTimeSlot, deleteTimeSlot, updateTimeSlotStatus, updateTimeSlot, createSetupTask, updateSetupTask, deleteSetupTask } from "@/app/actions";
import ScheduleClient from "./ScheduleClient";
import { getRole } from "@/lib/auth";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [festival, role] = await Promise.all([
    prisma.festival.findUnique({ where: { id } }),
    getRole(),
  ]);
  if (!festival) notFound();
  const isAdmin = role === "admin";

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
      stages={stages.map((s) => ({
        ...s,
        timeSlots: s.timeSlots.map((ts) => ({
          ...ts,
          startTime: ts.startTime.toISOString(),
          endTime: ts.endTime.toISOString(),
          artist: ts.artist
            ? {
                ...ts.artist,
              }
            : null,
        })),
      }))}
      artists={artists}
      isAdmin={isAdmin}
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
