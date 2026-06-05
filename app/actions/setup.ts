"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOwnedFestival, requireOwnedSetupTask } from "@/lib/authorize";
import { assertFestivalMatch } from "@/lib/action-utils";

export async function createSetupTask(
  festivalId: string,
  dayLabel: string,
  date: string | null,
  time: string | null,
  category: string | null,
  description: string,
  responsible: string | null
) {
  await requireOwnedFestival(festivalId);
  await prisma.festivalSetupTask.create({
    data: { festivalId, dayLabel, date: date || null, time: time || null, category: category || null, description, responsible: responsible || null },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function updateSetupTask(id: string, festivalId: string, formData: FormData) {
  const task = await requireOwnedSetupTask(id);
  assertFestivalMatch(task.festivalId, festivalId);
  await prisma.festivalSetupTask.update({
    where: { id },
    data: {
      dayLabel: formData.get("dayLabel") as string,
      date: (formData.get("date") as string) || null,
      time: (formData.get("time") as string) || null,
      category: (formData.get("category") as string) || null,
      description: formData.get("description") as string,
      responsible: (formData.get("responsible") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function deleteSetupTask(id: string, festivalId: string) {
  const task = await requireOwnedSetupTask(id);
  assertFestivalMatch(task.festivalId, festivalId);
  await prisma.festivalSetupTask.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}
