"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  requireAdmin,
  requireOwnedFestival,
  requireOwnedVendor,
  requireOwnedVendorContact,
  requireOwnedVendorVehicle,
  requireOwnedVendorPayment,
  requireOwnedVendorFile,
} from "@/lib/authorize";
import { assertFestivalMatch, requireString, readString, parseAmount, optionalString, optionalEmail } from "@/lib/action-utils";
import type { BulkVendorItem } from "@/lib/vendor-types";

export async function getVendorDetails(vendorId: string, festivalId: string) {
  await requireOwnedFestival(festivalId);
  await requireOwnedVendor(vendorId);
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId, festivalId },
    include: {
      contacts: true,
      vehicles: true,
      payments: { orderBy: { dueDate: "asc" } },
      files: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vendor) return null;
  return {
    ...vendor,
    createdAt: vendor.createdAt.toISOString(),
    payments: vendor.payments.map((p) => ({ ...p, dueDate: p.dueDate?.toISOString() ?? null })),
    files: vendor.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
  };
}

export async function createVendor(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);
  await prisma.vendor.create({
    data: {
      festivalId,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function updateVendor(id: string, formData: FormData) {
  const vendor = await requireOwnedVendor(id);
  await prisma.vendor.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/festivals/${vendor.festivalId}/vendors`);
}

export async function deleteVendor(id: string, festivalId: string) {
  const vendor = await requireOwnedVendor(id);
  assertFestivalMatch(vendor.festivalId, festivalId);
  await prisma.vendor.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function createVendorContact(vendorId: string, festivalId: string, formData: FormData) {
  const vendor = await requireOwnedVendor(vendorId);
  assertFestivalMatch(vendor.festivalId, festivalId);
  await prisma.vendorContact.create({
    data: {
      vendorId,
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function deleteVendorContact(id: string, festivalId: string) {
  const contact = await requireOwnedVendorContact(id);
  assertFestivalMatch(contact.vendor.festivalId, festivalId);
  await prisma.vendorContact.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function createVendorVehicle(vendorId: string, festivalId: string, formData: FormData) {
  const vendor = await requireOwnedVendor(vendorId);
  assertFestivalMatch(vendor.festivalId, festivalId);
  await prisma.vendorVehicle.create({
    data: {
      vendorId,
      plateNumber: formData.get("plateNumber") as string,
      vehicleType: (formData.get("vehicleType") as string) || null,
      arrivalTime: (formData.get("arrivalTime") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function deleteVendorVehicle(id: string, festivalId: string) {
  const vehicle = await requireOwnedVendorVehicle(id);
  assertFestivalMatch(vehicle.vendor.festivalId, festivalId);
  await prisma.vendorVehicle.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function createVendorPayment(vendorId: string, festivalId: string, formData: FormData) {
  const vendor = await requireOwnedVendor(vendorId);
  assertFestivalMatch(vendor.festivalId, festivalId);
  const amount = parseAmount(formData.get("amount"), "סכום");
  const description = requireString(formData, "description", "תיאור");
  const dueDateStr = readString(formData, "dueDate");

  await prisma.$transaction(async (tx) => {
    const budgetItem = await tx.budgetItem.create({
      data: {
        festivalId,
        description: `${vendor.name} — ${description}`,
        amount: Math.round(amount),
        type: "EXPENSE",
        vendor: vendor.name,
        isPaid: false,
        date: dueDateStr ? new Date(dueDateStr) : new Date(),
      },
    });
    await tx.vendorPayment.create({
      data: { vendorId, description, amount, dueDate: dueDateStr ? new Date(dueDateStr) : null, isPaid: false, budgetItemId: budgetItem.id },
    });
  });

  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleVendorPayment(id: string, festivalId: string) {
  const payment = await requireOwnedVendorPayment(id);
  assertFestivalMatch(payment.vendor.festivalId, festivalId);
  const newPaid = !payment.isPaid;
  await prisma.$transaction(async (tx) => {
    await tx.vendorPayment.update({ where: { id }, data: { isPaid: newPaid } });
    if (payment.budgetItemId) {
      await tx.budgetItem.update({ where: { id: payment.budgetItemId }, data: { isPaid: newPaid } });
    }
  });
  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function deleteVendorPayment(id: string, festivalId: string) {
  const payment = await requireOwnedVendorPayment(id);
  assertFestivalMatch(payment.vendor.festivalId, festivalId);
  await prisma.$transaction(async (tx) => {
    if (payment.budgetItemId) {
      await tx.budgetItem.delete({ where: { id: payment.budgetItemId } });
    }
    await tx.vendorPayment.delete({ where: { id } });
  });
  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function createVendorFile(
  vendorId: string,
  festivalId: string,
  name: string,
  url: string,
  isExternal: boolean,
  fileType: string
) {
  const vendor = await requireOwnedVendor(vendorId);
  assertFestivalMatch(vendor.festivalId, festivalId);
  await prisma.vendorFile.create({ data: { vendorId, name, url, isExternal, fileType: fileType || null } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function deleteVendorFile(id: string, festivalId: string) {
  const file = await requireOwnedVendorFile(id);
  assertFestivalMatch(file.vendor.festivalId, festivalId);
  await prisma.vendorFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function generateVendorsToken(festivalId: string) {
  await requireOwnedFestival(festivalId);
  const token = randomUUID();
  await prisma.festival.update({ where: { id: festivalId }, data: { vendorsToken: token } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
  return token;
}

export async function registerNewVendorByToken(
  festivalToken: string,
  name: string,
  category: string,
  notes: string
) {
  const festival = await prisma.festival.findUnique({
    where: { vendorsToken: festivalToken },
    select: { id: true },
  });
  if (!festival) throw new Error("לינק לא תקין");
  const vendor = await prisma.vendor.create({
    data: {
      festivalId: festival.id,
      name: name.trim(),
      category: category.trim(),
      notes: notes.trim() || null,
    },
  });
  revalidatePath(`/festivals/${festival.id}/vendors`);
  return vendor.vendorToken;
}

export async function bulkCreateVendors(festivalId: string, items: BulkVendorItem[]) {
  await requireAdmin();
  await requireOwnedFestival(festivalId);
  const limited = items.slice(0, 500);
  await prisma.$transaction(async (tx) => {
    for (const item of limited) {
      const name = item.name?.trim();
      if (!name) continue;
      const category = item.category?.trim() || "production";
      const vendor = await tx.vendor.create({
        data: {
          festivalId,
          name,
          category,
          notes: item.notes?.trim() || null,
        },
      });
      if (item.contactName?.trim()) {
        await tx.vendorContact.create({
          data: {
            vendorId: vendor.id,
            name: item.contactName.trim(),
            phone: item.contactPhone?.trim() || null,
            email: item.contactEmail?.trim() || null,
          },
        });
      }
    }
  });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function submitVendorForm(
  token: string,
  contacts: { name: string; role: string; phone: string; email: string }[],
  vehicles: { plateNumber: string; vehicleType: string; arrivalTime: string }[],
  notes?: string
) {
  const vendor = await prisma.vendor.findUnique({ where: { vendorToken: token } });
  if (!vendor) throw new Error("לינק לא תקין");

  const normalizedContacts = contacts
    .slice(0, 50)
    .map((c) => ({
      name: c.name.trim(),
      role: optionalString(c.role, 100),
      phone: optionalString(c.phone, 50),
      email: optionalEmail(c.email),
    }))
    .filter((c) => c.name || c.role || c.phone || c.email)
    .map((c) => ({
      ...c,
      name: c.name || (() => { throw new Error("לכל איש קשר חייב להיות שם"); })(),
    }));

  const normalizedVehicles = vehicles
    .slice(0, 50)
    .map((v) => ({
      plateNumber: v.plateNumber.trim(),
      vehicleType: optionalString(v.vehicleType, 100),
      arrivalTime: optionalString(v.arrivalTime, 20),
    }))
    .filter((v) => v.plateNumber || v.vehicleType || v.arrivalTime)
    .map((v) => ({
      ...v,
      plateNumber: v.plateNumber || (() => { throw new Error("לכל רכב חייב להיות מספר רכב"); })(),
    }));

  await prisma.$transaction(async (tx) => {
    await tx.vendor.update({ where: { id: vendor.id }, data: { notes: notes?.trim() || null } });
    await tx.vendorContact.deleteMany({ where: { vendorId: vendor.id } });
    await tx.vendorVehicle.deleteMany({ where: { vendorId: vendor.id } });
    if (normalizedContacts.length > 0) {
      await tx.vendorContact.createMany({
        data: normalizedContacts.map((c) => ({ vendorId: vendor.id, name: c.name, role: c.role, phone: c.phone, email: c.email })),
      });
    }
    if (normalizedVehicles.length > 0) {
      await tx.vendorVehicle.createMany({
        data: normalizedVehicles.map((v) => ({ vendorId: vendor.id, plateNumber: v.plateNumber, vehicleType: v.vehicleType, arrivalTime: v.arrivalTime })),
      });
    }
  });

  revalidatePath(`/festivals/${vendor.festivalId}/vendors`);
}
