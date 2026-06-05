"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addMinutes, formatTime } from "@/lib/utils";
import {
  requireAdmin,
  requireOwnedFestival,
  requireOwnedStage,
  requireOwnedStageFile,
  requireOwnedTimeSlot,
  requireOwnedArtist,
} from "@/lib/authorize";
import { assertFestivalMatch } from "@/lib/action-utils";

export async function createStage(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);
  await prisma.stage.create({
    data: {
      festivalId,
      name: formData.get("name") as string,
      capacity: parseInt(formData.get("capacity") as string) || null,
      location: (formData.get("location") as string) || null,
      soundcheckStart: (formData.get("soundcheckStart") as string) || null,
      soundcheckEnd: (formData.get("soundcheckEnd") as string) || null,
      performancesStart: (formData.get("performancesStart") as string) || null,
      performancesEnd: (formData.get("performancesEnd") as string) || null,
      managerId: (formData.get("managerId") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
  revalidatePath(`/festivals/${festivalId}/stages`);
}

export async function updateStage(id: string, formData: FormData) {
  const stage = await requireOwnedStage(id);
  await prisma.stage.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      capacity: parseInt(formData.get("capacity") as string) || null,
      location: (formData.get("location") as string) || null,
      soundcheckStart: (formData.get("soundcheckStart") as string) || null,
      soundcheckEnd: (formData.get("soundcheckEnd") as string) || null,
      performancesStart: (formData.get("performancesStart") as string) || null,
      performancesEnd: (formData.get("performancesEnd") as string) || null,
      managerId: (formData.get("managerId") as string) || null,
    },
  });
  revalidatePath(`/festivals/${stage.festivalId}/stages`);
  revalidatePath(`/festivals/${stage.festivalId}/schedule`);
}

export async function deleteStage(id: string, festivalId: string) {
  const stage = await requireOwnedStage(id);
  assertFestivalMatch(stage.festivalId, festivalId);
  await prisma.stage.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/schedule`);
  revalidatePath(`/festivals/${festivalId}/stages`);
}

export async function createStageFile(
  stageId: string,
  festivalId: string,
  name: string,
  url: string,
  isExternal: boolean,
  fileType: string
) {
  const stage = await requireOwnedStage(stageId);
  assertFestivalMatch(stage.festivalId, festivalId);
  await prisma.stageFile.create({ data: { stageId, name, url, isExternal, fileType } });
  revalidatePath(`/festivals/${festivalId}/stages`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function deleteStageFile(id: string, stageId: string, festivalId: string) {
  const file = await requireOwnedStageFile(id);
  assertFestivalMatch(file.stage.festivalId, festivalId);
  if (file.stageId !== stageId) throw new Error("אי התאמה בין קובץ לבמה");
  await prisma.stageFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/stages`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function createTimeSlot(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  const stageId = formData.get("stageId") as string;
  const artistId = formData.get("artistId") as string;
  await requireOwnedFestival(festivalId);
  const stage = await requireOwnedStage(stageId);
  assertFestivalMatch(stage.festivalId, festivalId);
  const ownedArtist = await requireOwnedArtist(artistId);
  assertFestivalMatch(ownedArtist.festivalId, festivalId);

  const startTime = new Date(formData.get("startTime") as string);
  const type = (formData.get("type") as string) || "PERFORMANCE";
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw new Error("Artist not found");

  const duration = type === "SOUNDCHECK" ? artist.soundcheckDuration : artist.setDuration;
  const endTime = addMinutes(startTime, duration);

  const conflicts = await prisma.timeSlot.findMany({
    where: { stageId, status: { not: "CANCELLED" }, startTime: { lt: endTime }, endTime: { gt: startTime } },
    include: { artist: true },
  });

  if (conflicts.length > 0) {
    const c = conflicts[0];
    return { error: `חפיפה עם ${c.artist?.name ?? "ללא אמן"} (${formatTime(c.startTime)}–${formatTime(c.endTime)})` };
  }

  await prisma.timeSlot.create({
    data: {
      stageId,
      artistId,
      startTime,
      endTime,
      type: type as "SOUNDCHECK" | "PERFORMANCE",
      notes: (formData.get("notes") as string) || null,
      technicianName: (formData.get("technicianName") as string) || null,
    },
  });

  revalidatePath(`/festivals/${festivalId}/schedule`);
  return {};
}

export async function updateTimeSlot(id: string, festivalId: string, formData: FormData): Promise<{ error?: string }> {
  await requireOwnedFestival(festivalId);
  const ownedSlot = await requireOwnedTimeSlot(id);
  assertFestivalMatch(ownedSlot.stage.festivalId, festivalId);

  const notes = (formData.get("notes") as string) || null;
  const technicianName = (formData.get("technicianName") as string) || null;
  const type = formData.get("type") as "SOUNDCHECK" | "PERFORMANCE" | null;
  const artistId = formData.get("artistId") as string | null;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { notes, technicianName };
  if (type) updateData.type = type;
  if (artistId !== null) updateData.artistId = artistId || null;

  if (startTimeStr) {
    const startTime = new Date(startTimeStr);
    let endTime: Date;

    if (endTimeStr) {
      endTime = new Date(endTimeStr);
    } else {
      const currentSlot = await prisma.timeSlot.findUnique({ where: { id }, select: { artistId: true, type: true } });
      const resolvedArtistId = artistId || currentSlot?.artistId;
      const resolvedType = type || currentSlot?.type || "PERFORMANCE";
      let duration = 60;
      if (resolvedArtistId) {
        const artist = await prisma.artist.findUnique({ where: { id: resolvedArtistId } });
        if (artist) duration = resolvedType === "SOUNDCHECK" ? artist.soundcheckDuration : artist.setDuration;
      }
      endTime = addMinutes(startTime, duration);
    }

    const currentSlot = await prisma.timeSlot.findUnique({ where: { id }, select: { stageId: true } });
    if (currentSlot) {
      const conflicts = await prisma.timeSlot.findMany({
        where: {
          stageId: currentSlot.stageId,
          id: { not: id },
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: { artist: true },
      });
      if (conflicts.length > 0) {
        const c = conflicts[0];
        return { error: `חפיפה עם ${c.artist?.name ?? "ללא אמן"} (${formatTime(c.startTime)}–${formatTime(c.endTime)})` };
      }
    }

    updateData.startTime = startTime;
    updateData.endTime = endTime;
  }

  await prisma.timeSlot.update({ where: { id }, data: updateData });
  revalidatePath(`/festivals/${festivalId}/schedule`);
  return {};
}

export async function updateTimeSlotStatus(id: string, status: string, festivalId: string) {
  const slot = await requireOwnedTimeSlot(id);
  assertFestivalMatch(slot.stage.festivalId, festivalId);
  await prisma.timeSlot.update({
    where: { id },
    data: { status: status as "SCHEDULED" | "CANCELLED" | "COMPLETED" },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function deleteTimeSlot(id: string, festivalId: string) {
  const slot = await requireOwnedTimeSlot(id);
  assertFestivalMatch(slot.stage.festivalId, festivalId);
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function extendTimeSlot(id: string, extraMinutes: number, festivalId: string) {
  const ownedSlot = await requireOwnedTimeSlot(id);
  assertFestivalMatch(ownedSlot.stage.festivalId, festivalId);
  const slot = await prisma.timeSlot.findUnique({ where: { id } });
  if (!slot) throw new Error("Slot not found");
  await prisma.timeSlot.update({ where: { id }, data: { endTime: addMinutes(slot.endTime, extraMinutes) } });
  revalidatePath(`/festivals/${festivalId}`);
  revalidatePath(`/festivals/${festivalId}/schedule`);
}
