"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes, formatTime } from "@/lib/utils";
import { clearSessionCookie, requireCurrentUserId } from "@/lib/auth";
import { randomUUID } from "crypto";

async function requireAdmin() {
  return requireCurrentUserId();
}

async function requireOwnedFestival(festivalId: string) {
  const userId = await requireAdmin();
  const festival = await prisma.festival.findFirst({
    where: { id: festivalId, ownerId: userId },
    select: { id: true, ownerId: true, inviteToken: true },
  });
  if (!festival) throw new Error("אין הרשאה לפסטיבל הזה");
  return festival;
}

async function requireOwnedArtist(artistId: string) {
  const userId = await requireAdmin();
  const artist = await prisma.artist.findFirst({
    where: { id: artistId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true, name: true },
  });
  if (!artist) throw new Error("אין הרשאה לאמן הזה");
  return artist;
}

async function requireOwnedStage(stageId: string) {
  const userId = await requireAdmin();
  const stage = await prisma.stage.findFirst({
    where: { id: stageId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!stage) throw new Error("אין הרשאה לבמה הזו");
  return stage;
}

async function requireOwnedTimeSlot(timeSlotId: string) {
  const userId = await requireAdmin();
  const timeSlot = await prisma.timeSlot.findFirst({
    where: { id: timeSlotId, stage: { festival: { ownerId: userId } } },
    select: { id: true, stageId: true, stage: { select: { festivalId: true } } },
  });
  if (!timeSlot) throw new Error("אין הרשאה לחריץ הזמן הזה");
  return timeSlot;
}

async function requireOwnedTeamRole(roleId: string) {
  const userId = await requireAdmin();
  const role = await prisma.teamMemberRole.findFirst({
    where: { id: roleId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!role) throw new Error("אין הרשאה לתפקיד הזה");
  return role;
}

async function requireOwnedTeamMember(memberId: string) {
  const userId = await requireAdmin();
  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!member) throw new Error("אין הרשאה לאיש הצוות הזה");
  return member;
}

async function requireOwnedBudgetItem(itemId: string) {
  const userId = await requireAdmin();
  const item = await prisma.budgetItem.findFirst({
    where: { id: itemId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!item) throw new Error("אין הרשאה לפריט התקציב הזה");
  return item;
}

async function requireOwnedTeamApplication(applicationId: string) {
  const userId = await requireAdmin();
  const application = await prisma.teamApplication.findFirst({
    where: { id: applicationId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true, firstName: true, lastName: true, email: true, phone: true, carNumber: true, notes: true },
  });
  if (!application) throw new Error("אין הרשאה לבקשה הזו");
  return application;
}

async function requireOwnedVendor(vendorId: string) {
  const userId = await requireAdmin();
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true, name: true, vendorToken: true },
  });
  if (!vendor) throw new Error("אין הרשאה לספק הזה");
  return vendor;
}

async function requireOwnedArtistPayment(paymentId: string) {
  const userId = await requireAdmin();
  const payment = await prisma.artistPayment.findFirst({
    where: { id: paymentId, artist: { festival: { ownerId: userId } } },
    select: { id: true, artistId: true, budgetItemId: true, isPaid: true, artist: { select: { festivalId: true } } },
  });
  if (!payment) throw new Error("אין הרשאה לתשלום הזה");
  return payment;
}

async function requireOwnedVendorPayment(paymentId: string) {
  const userId = await requireAdmin();
  const payment = await prisma.vendorPayment.findFirst({
    where: { id: paymentId, vendor: { festival: { ownerId: userId } } },
    select: { id: true, vendorId: true, budgetItemId: true, isPaid: true, vendor: { select: { festivalId: true } } },
  });
  if (!payment) throw new Error("אין הרשאה לתשלום הזה");
  return payment;
}

async function requireOwnedSetupTask(taskId: string) {
  const userId = await requireAdmin();
  const task = await prisma.festivalSetupTask.findFirst({
    where: { id: taskId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!task) throw new Error("אין הרשאה למשימה הזו");
  return task;
}

async function requireOwnedCommunityContact(contactId: string) {
  const userId = await requireAdmin();
  const contact = await prisma.festivalCommunityContact.findFirst({
    where: { id: contactId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

async function requireOwnedArtistContact(contactId: string) {
  const userId = await requireAdmin();
  const contact = await prisma.artistContact.findFirst({
    where: { id: contactId, artist: { festival: { ownerId: userId } } },
    select: { id: true, artistId: true, artist: { select: { festivalId: true } } },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

async function requireOwnedArtistVehicle(vehicleId: string) {
  const userId = await requireAdmin();
  const vehicle = await prisma.artistVehicle.findFirst({
    where: { id: vehicleId, artist: { festival: { ownerId: userId } } },
    select: { id: true, artistId: true, artist: { select: { festivalId: true } } },
  });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  return vehicle;
}

async function requireOwnedArtistFile(fileId: string) {
  const userId = await requireAdmin();
  const file = await prisma.artistFile.findFirst({
    where: { id: fileId, artist: { festival: { ownerId: userId } } },
    select: { id: true, artistId: true, artist: { select: { festivalId: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

async function requireOwnedStageFile(fileId: string) {
  const userId = await requireAdmin();
  const file = await prisma.stageFile.findFirst({
    where: { id: fileId, stage: { festival: { ownerId: userId } } },
    select: { id: true, stageId: true, stage: { select: { festivalId: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

async function requireOwnedFestivalFile(fileId: string) {
  const userId = await requireAdmin();
  const file = await prisma.festivalFile.findFirst({
    where: { id: fileId, festival: { ownerId: userId } },
    select: { id: true, festivalId: true },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

async function requireOwnedVendorContact(contactId: string) {
  const userId = await requireAdmin();
  const contact = await prisma.vendorContact.findFirst({
    where: { id: contactId, vendor: { festival: { ownerId: userId } } },
    select: { id: true, vendor: { select: { festivalId: true, id: true } } },
  });
  if (!contact) throw new Error("אין הרשאה לאיש הקשר הזה");
  return contact;
}

async function requireOwnedVendorVehicle(vehicleId: string) {
  const userId = await requireAdmin();
  const vehicle = await prisma.vendorVehicle.findFirst({
    where: { id: vehicleId, vendor: { festival: { ownerId: userId } } },
    select: { id: true, vendor: { select: { festivalId: true, id: true } } },
  });
  if (!vehicle) throw new Error("אין הרשאה לרכב הזה");
  return vehicle;
}

async function requireOwnedVendorFile(fileId: string) {
  const userId = await requireAdmin();
  const file = await prisma.vendorFile.findFirst({
    where: { id: fileId, vendor: { festival: { ownerId: userId } } },
    select: { id: true, vendor: { select: { festivalId: true, id: true } } },
  });
  if (!file) throw new Error("אין הרשאה לקובץ הזה");
  return file;
}

function assertFestivalMatch(actualFestivalId: string, expectedFestivalId: string) {
  if (actualFestivalId !== expectedFestivalId) {
    throw new Error("אי התאמה בין משאב לפסטיבל");
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requireString(formData: FormData, key: string, label: string, maxLength = 200): string {
  const value = readString(formData, key);
  if (!value) throw new Error(`${label} הוא שדה חובה`);
  if (value.length > maxLength) throw new Error(`${label} ארוך מדי`);
  return value;
}

function optionalString(value: unknown, maxLength = 1000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function optionalEmail(value: unknown): string | null {
  const email = optionalString(value, 320);
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (!EMAIL_RE.test(normalized)) throw new Error("כתובת האימייל לא תקינה");
  return normalized;
}

function parseAmount(value: unknown, label: string): number {
  if (typeof value !== "string") throw new Error(`${label} חייב להיות מספר`);
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} חייב להיות מספר תקין`);
  return amount;
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}

// ─── Festivals ───────────────────────────────────────────────────────────────

export async function createFestival(formData: FormData) {
  const userId = await requireAdmin();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  const festival = await prisma.festival.create({
    data: {
      ownerId: userId,
      name,
      description: description || null,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  redirect(`/festivals/${festival.id}`);
}

export async function updateFestival(id: string, formData: FormData) {
  await requireOwnedFestival(id);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  await prisma.festival.update({
    where: { id },
    data: {
      name,
      description: description || null,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/");
  revalidatePath(`/festivals/${id}`);
}

export async function deleteFestival(id: string) {
  await requireOwnedFestival(id);
  await prisma.festival.delete({ where: { id } });
  revalidatePath("/");
}

// ─── Artists ─────────────────────────────────────────────────────────────────

export async function createArtist(formData: FormData): Promise<{ id: string }> {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);

  const artist = await prisma.artist.create({
    data: {
      festivalId,
      name: formData.get("name") as string,
      genre: (formData.get("genre") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      contactPhone: (formData.get("contactPhone") as string) || null,
      bio: (formData.get("bio") as string) || null,
      setDuration: parseInt(formData.get("setDuration") as string) || 60,
      soundcheckDuration: parseInt(formData.get("soundcheckDuration") as string) || 30,
      breakAfter: parseInt(formData.get("breakAfter") as string) || 15,
    },
  });

  revalidatePath(`/festivals/${festivalId}/artists`);
  return { id: artist.id };
}

export async function updateArtistImage(artistId: string, imageUrl: string) {
  await requireAdmin();
  await requireOwnedArtist(artistId);
  const artist = await prisma.artist.update({
    where: { id: artistId },
    data: { profileImageUrl: imageUrl },
  });
  revalidatePath(`/festivals/${artist.festivalId}/artists`);
  revalidatePath(`/festivals/${artist.festivalId}/artists/${artistId}`);
}

export async function updateArtist(id: string, formData: FormData) {
  await requireAdmin();
  const artist = await requireOwnedArtist(id);

  await prisma.artist.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      genre: (formData.get("genre") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      contactPhone: (formData.get("contactPhone") as string) || null,
      bio: (formData.get("bio") as string) || null,
      setDuration: parseInt(formData.get("setDuration") as string) || 60,
      soundcheckDuration: parseInt(formData.get("soundcheckDuration") as string) || 30,
      breakAfter: parseInt(formData.get("breakAfter") as string) || 15,
      status: (formData.get("status") as string) || "confirmed",
      profileImageUrl: (formData.get("profileImageUrl") as string) || null,
      privateNotes: (formData.get("privateNotes") as string) || null,
      agentName: (formData.get("agentName") as string) || null,
      agentPhone: (formData.get("agentPhone") as string) || null,
      agentEmail: (formData.get("agentEmail") as string) || null,
      fee: formData.get("fee") ? parseFloat(formData.get("fee") as string) : null,
      instagramUrl: (formData.get("instagramUrl") as string) || null,
      facebookUrl: (formData.get("facebookUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      spotifyUrl: (formData.get("spotifyUrl") as string) || null,
      stageSize: (formData.get("stageSize") as string) || null,
      paSystemRequired: formData.get("paSystemRequired") === "true",
      monitorsCount: parseInt(formData.get("monitorsCount") as string) || 2,
      microphonesCount: parseInt(formData.get("microphonesCount") as string) || 2,
      djEquipmentRequired: formData.get("djEquipmentRequired") === "true",
      electricalRequirements: (formData.get("electricalRequirements") as string) || null,
      lightingNotes: (formData.get("lightingNotes") as string) || null,
      backlineNotes: (formData.get("backlineNotes") as string) || null,
      hospitalityRider: (formData.get("hospitalityRider") as string) || null,
      technicalRiderNotes: (formData.get("technicalRiderNotes") as string) || null,
      technicalRiderPdfUrl: (formData.get("technicalRiderPdfUrl") as string) || null,
    },
  });

  revalidatePath(`/festivals/${artist.festivalId}/artists`);
  revalidatePath(`/festivals/${artist.festivalId}/artists/${id}`);
}

export async function deleteArtist(id: string, festivalId: string) {
  const artist = await requireOwnedArtist(id);
  assertFestivalMatch(artist.festivalId, festivalId);
  await prisma.artist.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists`);
}

// ─── Artist Contacts ──────────────────────────────────────────────────────────

export async function createArtistContact(artistId: string, festivalId: string, formData: FormData) {
  const artist = await requireOwnedArtist(artistId);
  assertFestivalMatch(artist.festivalId, festivalId);
  await prisma.artistContact.create({
    data: {
      artistId,
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      idNumber: (formData.get("idNumber") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

export async function updateArtistContact(id: string, artistId: string, festivalId: string, formData: FormData) {
  const contact = await requireOwnedArtistContact(id);
  assertFestivalMatch(contact.artist.festivalId, festivalId);
  if (contact.artistId !== artistId) throw new Error("אי התאמה בין איש קשר לאמן");
  await prisma.artistContact.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      idNumber: (formData.get("idNumber") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

export async function deleteArtistContact(id: string, artistId: string, festivalId: string) {
  const contact = await requireOwnedArtistContact(id);
  assertFestivalMatch(contact.artist.festivalId, festivalId);
  if (contact.artistId !== artistId) throw new Error("אי התאמה בין איש קשר לאמן");
  await prisma.artistContact.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

// ─── Artist Vehicles ──────────────────────────────────────────────────────────

export async function createArtistVehicle(artistId: string, festivalId: string, formData: FormData) {
  const artist = await requireOwnedArtist(artistId);
  assertFestivalMatch(artist.festivalId, festivalId);
  await prisma.artistVehicle.create({
    data: {
      artistId,
      plateNumber: formData.get("plateNumber") as string,
      vehicleType: (formData.get("vehicleType") as string) || null,
      arrivalTime: (formData.get("arrivalTime") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

export async function deleteArtistVehicle(id: string, artistId: string, festivalId: string) {
  const vehicle = await requireOwnedArtistVehicle(id);
  assertFestivalMatch(vehicle.artist.festivalId, festivalId);
  if (vehicle.artistId !== artistId) throw new Error("אי התאמה בין רכב לאמן");
  await prisma.artistVehicle.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

// ─── Artist Files ─────────────────────────────────────────────────────────────

export async function createArtistFile(
  artistId: string,
  festivalId: string,
  name: string,
  url: string,
  isExternal: boolean,
  fileType: string
) {
  const artist = await requireOwnedArtist(artistId);
  assertFestivalMatch(artist.festivalId, festivalId);
  await prisma.artistFile.create({
    data: { artistId, name, url, isExternal, fileType: fileType || null },
  });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

export async function deleteArtistFile(id: string, artistId: string, festivalId: string) {
  const file = await requireOwnedArtistFile(id);
  assertFestivalMatch(file.artist.festivalId, festivalId);
  if (file.artistId !== artistId) throw new Error("אי התאמה בין קובץ לאמן");
  await prisma.artistFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

// ─── Artist Payments ──────────────────────────────────────────────────────────

export async function createArtistPayment(artistId: string, festivalId: string, formData: FormData) {
  const artist = await requireOwnedArtist(artistId);
  assertFestivalMatch(artist.festivalId, festivalId);
  const amount = parseAmount(formData.get("amount"), "סכום");
  const description = requireString(formData, "description", "תיאור");
  const dueDateStr = readString(formData, "dueDate");

  await prisma.$transaction(async (tx) => {
    const budgetItem = await tx.budgetItem.create({
      data: {
        festivalId,
        description: `${artist.name} — ${description}`,
        amount: Math.round(amount),
        type: "EXPENSE",
        category: "אמנים",
        isPaid: false,
        date: dueDateStr ? new Date(dueDateStr) : new Date(),
      },
    });

    await tx.artistPayment.create({
      data: {
        artistId,
        description,
        amount,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        isPaid: false,
        budgetItemId: budgetItem.id,
      },
    });
  });

  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleArtistPayment(id: string, artistId: string, festivalId: string) {
  const payment = await requireOwnedArtistPayment(id);
  assertFestivalMatch(payment.artist.festivalId, festivalId);
  if (payment.artistId !== artistId) throw new Error("אי התאמה בין תשלום לאמן");
  const newPaid = !payment.isPaid;

  await prisma.$transaction(async (tx) => {
    await tx.artistPayment.update({ where: { id }, data: { isPaid: newPaid } });

    if (payment.budgetItemId) {
      await tx.budgetItem.update({ where: { id: payment.budgetItemId }, data: { isPaid: newPaid } });
    }
  });

  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function deleteArtistPayment(id: string, artistId: string, festivalId: string) {
  const payment = await requireOwnedArtistPayment(id);
  assertFestivalMatch(payment.artist.festivalId, festivalId);
  if (payment.artistId !== artistId) throw new Error("אי התאמה בין תשלום לאמן");

  await prisma.$transaction(async (tx) => {
    if (payment.budgetItemId) {
      await tx.budgetItem.delete({ where: { id: payment.budgetItemId } });
    }

    await tx.artistPayment.delete({ where: { id } });
  });

  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

// ─── Stages ──────────────────────────────────────────────────────────────────

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
}

export async function deleteStageFile(id: string, stageId: string, festivalId: string) {
  const file = await requireOwnedStageFile(id);
  assertFestivalMatch(file.stage.festivalId, festivalId);
  if (file.stageId !== stageId) throw new Error("אי התאמה בין קובץ לבמה");
  await prisma.stageFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/stages`);
}

export async function createFestivalFile(
  festivalId: string,
  name: string,
  url: string,
  isExternal: boolean,
  fileType: string
) {
  await requireOwnedFestival(festivalId);
  await prisma.festivalFile.create({ data: { festivalId, name, url, isExternal, fileType } });
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function deleteFestivalFile(id: string, festivalId: string) {
  const file = await requireOwnedFestivalFile(id);
  assertFestivalMatch(file.festivalId, festivalId);
  await prisma.festivalFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/documents`);
}

// ─── Time Slots ──────────────────────────────────────────────────────────────

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
    where: {
      stageId,
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
      const currentSlot = await prisma.timeSlot.findUnique({
        where: { id },
        select: { artistId: true, type: true },
      });
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
  const newEndTime = addMinutes(slot.endTime, extraMinutes);
  await prisma.timeSlot.update({ where: { id }, data: { endTime: newEndTime } });
  revalidatePath(`/festivals/${festivalId}`);
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

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

// ─── Team Roles ───────────────────────────────────────────────────────────────

export async function createTeamRole(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);

  await prisma.teamMemberRole.create({
    data: {
      name: formData.get("name") as string,
      festivalId,
    },
  });

  revalidatePath(`/festivals/${festivalId}/team`);
}

export async function deleteTeamRole(id: string, festivalId: string) {
  const role = await requireOwnedTeamRole(id);
  assertFestivalMatch(role.festivalId, festivalId);
  await prisma.teamMemberRole.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function createTeamMember(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);
  const role = await requireOwnedTeamRole(formData.get("roleId") as string);
  assertFestivalMatch(role.festivalId, festivalId);

  await prisma.teamMember.create({
    data: {
      festivalId,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      roleId: formData.get("roleId") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      carNumber: (formData.get("carNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/festivals/${festivalId}/team`);
}

export async function updateTeamMember(id: string, formData: FormData) {
  const member = await requireOwnedTeamMember(id);
  const role = await requireOwnedTeamRole(formData.get("roleId") as string);
  assertFestivalMatch(role.festivalId, member.festivalId);

  await prisma.teamMember.update({
    where: { id },
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      roleId: formData.get("roleId") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      carNumber: (formData.get("carNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/festivals/${member.festivalId}/team`);
}

export async function deleteTeamMember(id: string, festivalId: string) {
  const member = await requireOwnedTeamMember(id);
  assertFestivalMatch(member.festivalId, festivalId);
  await prisma.teamMember.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function createBudgetItem(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);

  await prisma.budgetItem.create({
    data: {
      festivalId,
      description: formData.get("description") as string,
      amount: parseInt(formData.get("amount") as string),
      type: formData.get("type") as "INCOME" | "EXPENSE",
      category: (formData.get("category") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isPaid: formData.get("isPaid") === "true",
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
    },
  });

  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function updateBudgetItem(id: string, formData: FormData) {
  const item = await requireOwnedBudgetItem(id);

  await prisma.budgetItem.update({
    where: { id },
    data: {
      description: formData.get("description") as string,
      amount: parseInt(formData.get("amount") as string),
      type: formData.get("type") as "INCOME" | "EXPENSE",
      category: (formData.get("category") as string) || null,
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isPaid: formData.get("isPaid") === "true",
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
    },
  });

  revalidatePath(`/festivals/${item.festivalId}/budget`);
}

export async function deleteBudgetItem(id: string, festivalId: string) {
  const item = await requireOwnedBudgetItem(id);
  assertFestivalMatch(item.festivalId, festivalId);
  await prisma.budgetItem.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleBudgetItemPaid(id: string, isPaid: boolean, festivalId: string) {
  const item = await requireOwnedBudgetItem(id);
  assertFestivalMatch(item.festivalId, festivalId);
  await prisma.budgetItem.update({ where: { id }, data: { isPaid } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

// ─── Team Applications ────────────────────────────────────────────────────────

export async function generateInviteToken(festivalId: string) {
  await requireOwnedFestival(festivalId);
  const token = randomUUID();
  await prisma.festival.update({
    where: { id: festivalId },
    data: { inviteToken: token },
  });
  revalidatePath(`/festivals/${festivalId}/team`);
  return token;
}

export async function submitTeamApplication(token: string, formData: FormData) {
  const festival = await prisma.festival.findUnique({ where: { inviteToken: token } });
  if (!festival) throw new Error("לינק לא תקין");

  await prisma.teamApplication.create({
    data: {
      festivalId: festival.id,
      firstName: requireString(formData, "firstName", "שם פרטי"),
      lastName: requireString(formData, "lastName", "שם משפחה"),
      email: optionalEmail(formData.get("email")),
      phone: optionalString(formData.get("phone"), 50),
      carNumber: optionalString(formData.get("carNumber"), 30),
      notes: optionalString(formData.get("notes"), 2000),
    },
  });
}

export async function approveTeamApplication(applicationId: string, roleId: string) {
  const app = await requireOwnedTeamApplication(applicationId);
  const ownedRole = await requireOwnedTeamRole(roleId);
  assertFestivalMatch(ownedRole.festivalId, app.festivalId);

  await prisma.$transaction(async (tx) => {
    const role = await tx.teamMemberRole.findUniqueOrThrow({ where: { id: roleId } });
    if (role.festivalId !== app.festivalId) {
      throw new Error("תפקיד לא שייך לפסטיבל");
    }

    await tx.teamMember.create({
      data: {
        festivalId: app.festivalId,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        carNumber: app.carNumber,
        notes: app.notes,
        roleId,
      },
    });

    await tx.teamApplication.update({
      where: { id: applicationId },
      data: { status: "approved" },
    });
  });

  revalidatePath(`/festivals/${app.festivalId}/team`);
}

export async function rejectTeamApplication(applicationId: string) {
  const app = await requireOwnedTeamApplication(applicationId);
  await prisma.teamApplication.delete({ where: { id: applicationId } });
  revalidatePath(`/festivals/${app.festivalId}/team`);
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

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

// ─── Vendor Contacts ─────────────────────────────────────────────────────────

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

// ─── Vendor Vehicles ─────────────────────────────────────────────────────────

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

// ─── Vendor Payments ─────────────────────────────────────────────────────────

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
      data: {
        vendorId,
        description,
        amount,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        isPaid: false,
        budgetItemId: budgetItem.id,
      },
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

// ─── Vendor Files ─────────────────────────────────────────────────────────────

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

  await prisma.vendorFile.create({
    data: { vendorId, name, url, isExternal, fileType: fileType || null },
  });

  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function deleteVendorFile(id: string, festivalId: string) {
  const file = await requireOwnedVendorFile(id);
  assertFestivalMatch(file.vendor.festivalId, festivalId);
  await prisma.vendorFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

// ─── Vendor Self-Service Form ─────────────────────────────────────────────────

// ─── Setup Tasks (לוז טכני כללי) ─────────────────────────────────────────────

export async function createSetupTask(festivalId: string, dayLabel: string, date: string | null, time: string | null, category: string | null, description: string, responsible: string | null) {
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

// ─── Community Contacts (גורמים חיצוניים) ────────────────────────────────────

export async function createCommunityContact(festivalId: string, formData: FormData) {
  await requireOwnedFestival(festivalId);
  await prisma.festivalCommunityContact.create({
    data: {
      festivalId,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/team`);
}

export async function updateCommunityContact(id: string, festivalId: string, formData: FormData) {
  const contact = await requireOwnedCommunityContact(id);
  assertFestivalMatch(contact.festivalId, festivalId);
  await prisma.festivalCommunityContact.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/team`);
}

export async function deleteCommunityContact(id: string, festivalId: string) {
  const contact = await requireOwnedCommunityContact(id);
  assertFestivalMatch(contact.festivalId, festivalId);
  await prisma.festivalCommunityContact.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

// ─── Vendor Self-Service Form ─────────────────────────────────────────────────

export async function submitVendorForm(
  token: string,
  contacts: { name: string; role: string; phone: string; email: string }[],
  vehicles: { plateNumber: string; vehicleType: string; arrivalTime: string }[]
) {
  const vendor = await prisma.vendor.findUnique({ where: { vendorToken: token } });
  if (!vendor) throw new Error("לינק לא תקין");

  const normalizedContacts = contacts
    .slice(0, 50)
    .map((contact) => ({
      name: contact.name.trim(),
      role: optionalString(contact.role, 100),
      phone: optionalString(contact.phone, 50),
      email: optionalEmail(contact.email),
    }))
    .filter((contact) => contact.name || contact.role || contact.phone || contact.email)
    .map((contact) => ({
      ...contact,
      name: contact.name || (() => { throw new Error("לכל איש קשר חייב להיות שם"); })(),
    }));

  const normalizedVehicles = vehicles
    .slice(0, 50)
    .map((vehicle) => ({
      plateNumber: vehicle.plateNumber.trim(),
      vehicleType: optionalString(vehicle.vehicleType, 100),
      arrivalTime: optionalString(vehicle.arrivalTime, 20),
    }))
    .filter((vehicle) => vehicle.plateNumber || vehicle.vehicleType || vehicle.arrivalTime)
    .map((vehicle) => ({
      ...vehicle,
      plateNumber: vehicle.plateNumber || (() => { throw new Error("לכל רכב חייב להיות מספר רכב"); })(),
    }));

  await prisma.$transaction(async (tx) => {
    await tx.vendorContact.deleteMany({ where: { vendorId: vendor.id } });
    await tx.vendorVehicle.deleteMany({ where: { vendorId: vendor.id } });

    if (normalizedContacts.length > 0) {
      await tx.vendorContact.createMany({
        data: normalizedContacts.map((contact) => ({
          vendorId: vendor.id,
          name: contact.name,
          role: contact.role,
          phone: contact.phone,
          email: contact.email,
        })),
      });
    }

    if (normalizedVehicles.length > 0) {
      await tx.vendorVehicle.createMany({
        data: normalizedVehicles.map((vehicle) => ({
          vendorId: vendor.id,
          plateNumber: vehicle.plateNumber,
          vehicleType: vehicle.vehicleType,
          arrivalTime: vehicle.arrivalTime,
        })),
      });
    }
  });

  revalidatePath(`/festivals/${vendor.festivalId}/vendors`);
}
