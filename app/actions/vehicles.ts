"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOwnedFestival } from "@/lib/authorize";

export async function createVehicle(festivalId: string, formData: FormData) {
  await requireOwnedFestival(festivalId);
  await prisma.vehicle.create({
    data: {
      festivalId,
      driverName: formData.get("driverName") as string,
      plate: formData.get("plate") as string,
      vendorId: (formData.get("vendorId") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/vehicles`);
}

export async function updateVehicle(id: string, festivalId: string, formData: FormData) {
  await requireOwnedFestival(festivalId);
  const vehicle = await prisma.vehicle.findFirst({ where: { id, festivalId }, select: { id: true } });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  await prisma.vehicle.update({
    where: { id },
    data: {
      driverName: formData.get("driverName") as string,
      plate: formData.get("plate") as string,
      vendorId: (formData.get("vendorId") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/vehicles`);
}

export async function deleteVehicle(id: string, festivalId: string) {
  await requireOwnedFestival(festivalId);
  const vehicle = await prisma.vehicle.findFirst({ where: { id, festivalId }, select: { id: true } });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  await prisma.vehicle.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vehicles`);
}
