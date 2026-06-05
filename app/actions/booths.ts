"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  requireOwnedFestival,
  requireOwnedBooth,
  requireOwnedBoothContact,
  requireOwnedBoothVehicle,
  requireOwnedBoothPayment,
  requireOwnedBoothFile,
} from "@/lib/authorize";
import { assertFestivalMatch, requireString, readString, parseAmount } from "@/lib/action-utils";

export async function getBoothDetails(boothId: string, festivalId: string) {
  await requireOwnedBooth(boothId);
  const booth = await prisma.booth.findUnique({
    where: { id: boothId, festivalId },
    include: {
      contacts: true,
      vehicles: true,
      payments: { orderBy: { dueDate: "asc" } },
      files: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booth) return null;
  return {
    ...booth,
    createdAt: booth.createdAt.toISOString(),
    payments: booth.payments.map((p) => ({ ...p, dueDate: p.dueDate?.toISOString() ?? null })),
    files: booth.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
  };
}

export async function createBooth(formData: FormData) {
  const festivalId = requireString(formData, "festivalId", "מזהה פסטיבל");
  await requireOwnedFestival(festivalId);
  await prisma.booth.create({
    data: {
      festivalId,
      name: requireString(formData, "name", "שם"),
      category: requireString(formData, "category", "קטגוריה"),
      notes: readString(formData, "notes") || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function updateBooth(id: string, formData: FormData) {
  const booth = await requireOwnedBooth(id);
  await prisma.booth.update({
    where: { id },
    data: {
      name: requireString(formData, "name", "שם"),
      category: requireString(formData, "category", "קטגוריה"),
      notes: readString(formData, "notes") || null,
    },
  });
  revalidatePath(`/festivals/${booth.festivalId}/booths`);
}

export async function deleteBooth(id: string, festivalId: string) {
  const booth = await requireOwnedBooth(id);
  assertFestivalMatch(booth.festivalId, festivalId);
  await prisma.booth.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function createBoothContact(boothId: string, festivalId: string, formData: FormData) {
  const booth = await requireOwnedBooth(boothId);
  assertFestivalMatch(booth.festivalId, festivalId);
  await prisma.boothContact.create({
    data: {
      boothId,
      name: requireString(formData, "name", "שם"),
      role: readString(formData, "role") || null,
      phone: readString(formData, "phone") || null,
      email: readString(formData, "email") || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function deleteBoothContact(id: string, festivalId: string) {
  const contact = await requireOwnedBoothContact(id);
  assertFestivalMatch(contact.booth.festivalId, festivalId);
  await prisma.boothContact.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function createBoothVehicle(boothId: string, festivalId: string, formData: FormData) {
  const booth = await requireOwnedBooth(boothId);
  assertFestivalMatch(booth.festivalId, festivalId);
  await prisma.boothVehicle.create({
    data: {
      boothId,
      plateNumber: requireString(formData, "plateNumber", "מספר רישוי"),
      vehicleType: readString(formData, "vehicleType") || null,
      arrivalTime: readString(formData, "arrivalTime") || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function deleteBoothVehicle(id: string, festivalId: string) {
  const vehicle = await requireOwnedBoothVehicle(id);
  assertFestivalMatch(vehicle.booth.festivalId, festivalId);
  await prisma.boothVehicle.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function createBoothPayment(boothId: string, festivalId: string, formData: FormData) {
  const booth = await requireOwnedBooth(boothId);
  assertFestivalMatch(booth.festivalId, festivalId);
  const amount = parseAmount(formData.get("amount"), "סכום");
  const description = requireString(formData, "description", "תיאור");
  const dueDateStr = readString(formData, "dueDate");

  await prisma.$transaction(async (tx) => {
    const budgetItem = await tx.budgetItem.create({
      data: {
        festivalId,
        description: `${booth.name} — ${description}`,
        amount: Math.round(amount),
        type: "EXPENSE",
        vendor: booth.name,
        isPaid: false,
        date: dueDateStr ? new Date(dueDateStr) : new Date(),
      },
    });
    await tx.boothPayment.create({
      data: { boothId, description, amount, dueDate: dueDateStr ? new Date(dueDateStr) : null, isPaid: false, budgetItemId: budgetItem.id },
    });
  });

  revalidatePath(`/festivals/${festivalId}/booths`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleBoothPayment(id: string, festivalId: string) {
  const payment = await requireOwnedBoothPayment(id);
  assertFestivalMatch(payment.booth.festivalId, festivalId);
  const newPaid = !payment.isPaid;
  await prisma.$transaction(async (tx) => {
    await tx.boothPayment.update({ where: { id }, data: { isPaid: newPaid } });
    if (payment.budgetItemId) {
      await tx.budgetItem.update({ where: { id: payment.budgetItemId }, data: { isPaid: newPaid } });
    }
  });
  revalidatePath(`/festivals/${festivalId}/booths`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function deleteBoothPayment(id: string, festivalId: string) {
  const payment = await requireOwnedBoothPayment(id);
  assertFestivalMatch(payment.booth.festivalId, festivalId);
  await prisma.$transaction(async (tx) => {
    if (payment.budgetItemId) {
      await tx.budgetItem.delete({ where: { id: payment.budgetItemId } });
    }
    await tx.boothPayment.delete({ where: { id } });
  });
  revalidatePath(`/festivals/${festivalId}/booths`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function createBoothFile(
  boothId: string,
  festivalId: string,
  name: string,
  url: string,
  isExternal: boolean,
  fileType: string
) {
  const booth = await requireOwnedBooth(boothId);
  assertFestivalMatch(booth.festivalId, festivalId);
  await prisma.boothFile.create({ data: { boothId, name, url, isExternal, fileType: fileType || null } });
  revalidatePath(`/festivals/${festivalId}/booths`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function deleteBoothFile(id: string, festivalId: string) {
  const file = await requireOwnedBoothFile(id);
  assertFestivalMatch(file.booth.festivalId, festivalId);
  await prisma.boothFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/booths`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function generateBoothsToken(festivalId: string) {
  await requireOwnedFestival(festivalId);
  const token = randomUUID();
  await prisma.festival.update({ where: { id: festivalId }, data: { boothsToken: token } });
  revalidatePath(`/festivals/${festivalId}/booths`);
  return token;
}

export async function submitBoothRegistration(
  token: string,
  boothName: string,
  category: string,
  contactName: string,
  contactPhone: string,
  contactEmail: string,
  notes: string
) {
  const festival = await prisma.festival.findUnique({ where: { boothsToken: token }, select: { id: true } });
  if (!festival) throw new Error("לינק לא תקין");
  await prisma.boothApplication.create({
    data: {
      festivalId: festival.id,
      boothName: boothName.trim(),
      category: category.trim(),
      contactName: contactName.trim() || null,
      contactPhone: contactPhone.trim() || null,
      contactEmail: contactEmail.trim() || null,
      notes: notes.trim() || null,
    },
  });
  revalidatePath(`/festivals/${festival.id}/booths`);
}

export async function approveBoothApplication(id: string, festivalId: string) {
  await requireOwnedFestival(festivalId);
  const app = await prisma.boothApplication.findFirst({ where: { id, festivalId } });
  if (!app) throw new Error("בקשה לא נמצאה");
  await prisma.$transaction(async (tx) => {
    const booth = await tx.booth.create({
      data: { festivalId, name: app.boothName, category: app.category, notes: app.notes || null },
    });
    if (app.contactName) {
      await tx.boothContact.create({
        data: { boothId: booth.id, name: app.contactName, phone: app.contactPhone || null, email: app.contactEmail || null },
      });
    }
    await tx.boothApplication.delete({ where: { id } });
  });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function rejectBoothApplication(id: string, festivalId: string) {
  await requireOwnedFestival(festivalId);
  const app = await prisma.boothApplication.findFirst({ where: { id, festivalId }, select: { id: true } });
  if (!app) throw new Error("בקשה לא נמצאה");
  await prisma.boothApplication.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/booths`);
}

export async function submitBoothForm(
  token: string,
  contacts: { name: string; role: string; phone: string; email: string }[],
  vehicles: { plateNumber: string; vehicleType: string; arrivalTime: string }[]
) {
  const booth = await prisma.booth.findUnique({ where: { boothToken: token } });
  if (!booth) throw new Error("לינק לא תקין");

  const normalizedContacts = contacts
    .slice(0, 50)
    .map((c) => ({ name: c.name.trim(), role: c.role.trim() || null, phone: c.phone.trim() || null, email: c.email.trim() || null }))
    .filter((c) => c.name);

  const normalizedVehicles = vehicles
    .slice(0, 20)
    .map((v) => ({ plateNumber: v.plateNumber.trim(), vehicleType: v.vehicleType.trim() || null, arrivalTime: v.arrivalTime.trim() || null }))
    .filter((v) => v.plateNumber);

  await prisma.$transaction(async (tx) => {
    await tx.boothContact.deleteMany({ where: { boothId: booth.id } });
    await tx.boothVehicle.deleteMany({ where: { boothId: booth.id } });
    if (normalizedContacts.length > 0) {
      await tx.boothContact.createMany({ data: normalizedContacts.map((c) => ({ boothId: booth.id, ...c })) });
    }
    if (normalizedVehicles.length > 0) {
      await tx.boothVehicle.createMany({ data: normalizedVehicles.map((v) => ({ boothId: booth.id, ...v })) });
    }
  });

  revalidatePath(`/festivals/${booth.festivalId}/booths`);
  revalidatePath(`/festivals/${booth.festivalId}/vehicles`);
}
