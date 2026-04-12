"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes } from "@/lib/utils";
import { getRole, clearSessionCookie } from "@/lib/auth";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const role = await getRole();
  if (role !== "admin") throw new Error("אין הרשאה");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}

// ─── Festivals ───────────────────────────────────────────────────────────────

export async function createFestival(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  const festival = await prisma.festival.create({
    data: {
      name,
      description: description || null,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  redirect(`/festivals/${festival.id}`);
}

export async function deleteFestival(id: string) {
  await requireAdmin();
  await prisma.festival.delete({ where: { id } });
  revalidatePath("/");
}

// ─── Artists ─────────────────────────────────────────────────────────────────

export async function createArtist(formData: FormData): Promise<{ id: string }> {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;

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
  const artist = await prisma.artist.update({
    where: { id: artistId },
    data: { profileImageUrl: imageUrl },
  });
  revalidatePath(`/festivals/${artist.festivalId}/artists`);
  revalidatePath(`/festivals/${artist.festivalId}/artists/${artistId}`);
}

export async function updateArtist(id: string, formData: FormData) {
  await requireAdmin();
  const artist = await prisma.artist.findUniqueOrThrow({ where: { id } });

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
  await requireAdmin();
  await prisma.artist.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists`);
}

// ─── Artist Contacts ──────────────────────────────────────────────────────────

export async function createArtistContact(artistId: string, festivalId: string, formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.artistContact.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

// ─── Artist Vehicles ──────────────────────────────────────────────────────────

export async function createArtistVehicle(artistId: string, festivalId: string, formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.artistFile.create({
    data: { artistId, name, url, isExternal, fileType: fileType || null },
  });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

export async function deleteArtistFile(id: string, artistId: string, festivalId: string) {
  await requireAdmin();
  await prisma.artistFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
}

// ─── Artist Payments ──────────────────────────────────────────────────────────

export async function createArtistPayment(artistId: string, festivalId: string, formData: FormData) {
  await requireAdmin();
  const artist = await prisma.artist.findUniqueOrThrow({ where: { id: artistId } });
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("dueDate") as string;

  const budgetItem = await prisma.budgetItem.create({
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

  await prisma.artistPayment.create({
    data: {
      artistId,
      description,
      amount,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      isPaid: false,
      budgetItemId: budgetItem.id,
    },
  });

  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleArtistPayment(id: string, artistId: string, festivalId: string) {
  await requireAdmin();
  const payment = await prisma.artistPayment.findUniqueOrThrow({ where: { id } });
  const newPaid = !payment.isPaid;

  await prisma.artistPayment.update({ where: { id }, data: { isPaid: newPaid } });

  if (payment.budgetItemId) {
    await prisma.budgetItem.update({ where: { id: payment.budgetItemId }, data: { isPaid: newPaid } });
  }

  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function deleteArtistPayment(id: string, artistId: string, festivalId: string) {
  await requireAdmin();
  const payment = await prisma.artistPayment.findUniqueOrThrow({ where: { id } });

  if (payment.budgetItemId) {
    await prisma.budgetItem.delete({ where: { id: payment.budgetItemId } });
  }

  await prisma.artistPayment.delete({ where: { id } });

  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

// ─── Stages ──────────────────────────────────────────────────────────────────

export async function createStage(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;

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
  await requireAdmin();
  const stage = await prisma.stage.findUniqueOrThrow({ where: { id } });

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
  await requireAdmin();
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
  await requireAdmin();
  await prisma.stageFile.create({ data: { stageId, name, url, isExternal, fileType } });
  revalidatePath(`/festivals/${festivalId}/stages`);
}

export async function deleteStageFile(id: string, stageId: string, festivalId: string) {
  await requireAdmin();
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
  await requireAdmin();
  await prisma.festivalFile.create({ data: { festivalId, name, url, isExternal, fileType } });
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function deleteFestivalFile(id: string, festivalId: string) {
  await requireAdmin();
  await prisma.festivalFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/documents`);
}

// ─── Time Slots ──────────────────────────────────────────────────────────────

export async function createTimeSlot(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  const stageId = formData.get("stageId") as string;
  const artistId = formData.get("artistId") as string;
  const startTime = new Date(formData.get("startTime") as string);

  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw new Error("Artist not found");

  const endTime = addMinutes(startTime, artist.setDuration);

  await prisma.timeSlot.create({
    data: {
      stageId,
      artistId,
      startTime,
      endTime,
      notes: (formData.get("notes") as string) || null,
      technicianName: (formData.get("technicianName") as string) || null,
    },
  });

  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function updateTimeSlot(id: string, festivalId: string, formData: FormData) {
  await requireAdmin();
  await prisma.timeSlot.update({
    where: { id },
    data: {
      notes: (formData.get("notes") as string) || null,
      technicianName: (formData.get("technicianName") as string) || null,
    },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function updateTimeSlotStatus(id: string, status: string, festivalId: string) {
  await requireAdmin();
  await prisma.timeSlot.update({
    where: { id },
    data: { status: status as "SCHEDULED" | "CANCELLED" | "COMPLETED" },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function deleteTimeSlot(id: string, festivalId: string) {
  await requireAdmin();
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function extendTimeSlot(id: string, extraMinutes: number, festivalId: string) {
  await requireAdmin();
  const slot = await prisma.timeSlot.findUnique({ where: { id } });
  if (!slot) throw new Error("Slot not found");
  const newEndTime = addMinutes(slot.endTime, extraMinutes);
  await prisma.timeSlot.update({ where: { id }, data: { endTime: newEndTime } });
  revalidatePath(`/festivals/${festivalId}`);
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function getVendorDetails(vendorId: string, festivalId: string) {
  const role = await getRole();
  if (!role) throw new Error("אין הרשאה");
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

  await prisma.teamMemberRole.create({
    data: {
      name: formData.get("name") as string,
      festivalId,
    },
  });

  revalidatePath(`/festivals/${festivalId}/team`);
}

export async function deleteTeamRole(id: string, festivalId: string) {
  await requireAdmin();
  await prisma.teamMemberRole.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function createTeamMember(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;

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
  await requireAdmin();
  const member = await prisma.teamMember.findUniqueOrThrow({ where: { id } });

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
  await requireAdmin();
  await prisma.teamMember.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function createBudgetItem(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;

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
  await requireAdmin();
  const item = await prisma.budgetItem.findUniqueOrThrow({ where: { id } });

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
  await requireAdmin();
  await prisma.budgetItem.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleBudgetItemPaid(id: string, isPaid: boolean, festivalId: string) {
  await requireAdmin();
  await prisma.budgetItem.update({ where: { id }, data: { isPaid } });
  revalidatePath(`/festivals/${festivalId}/budget`);
}

// ─── Team Applications ────────────────────────────────────────────────────────

export async function generateInviteToken(festivalId: string) {
  await requireAdmin();
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
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      carNumber: (formData.get("carNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });
}

export async function approveTeamApplication(applicationId: string, roleId: string) {
  await requireAdmin();
  const app = await prisma.teamApplication.findUniqueOrThrow({ where: { id: applicationId } });

  await prisma.teamMember.create({
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

  await prisma.teamApplication.update({
    where: { id: applicationId },
    data: { status: "approved" },
  });

  revalidatePath(`/festivals/${app.festivalId}/team`);
}

export async function rejectTeamApplication(applicationId: string) {
  await requireAdmin();
  const app = await prisma.teamApplication.findUniqueOrThrow({ where: { id: applicationId } });
  await prisma.teamApplication.delete({ where: { id: applicationId } });
  revalidatePath(`/festivals/${app.festivalId}/team`);
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

export async function createVendor(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;

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
  await requireAdmin();
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id } });

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
  await requireAdmin();
  await prisma.vendor.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

// ─── Vendor Contacts ─────────────────────────────────────────────────────────

export async function createVendorContact(vendorId: string, festivalId: string, formData: FormData) {
  await requireAdmin();

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
  await requireAdmin();
  await prisma.vendorContact.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

// ─── Vendor Vehicles ─────────────────────────────────────────────────────────

export async function createVendorVehicle(vendorId: string, festivalId: string, formData: FormData) {
  await requireAdmin();

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
  await requireAdmin();
  await prisma.vendorVehicle.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

// ─── Vendor Payments ─────────────────────────────────────────────────────────

export async function createVendorPayment(vendorId: string, festivalId: string, formData: FormData) {
  await requireAdmin();
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("dueDate") as string;

  const budgetItem = await prisma.budgetItem.create({
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

  await prisma.vendorPayment.create({
    data: {
      vendorId,
      description,
      amount,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      isPaid: false,
      budgetItemId: budgetItem.id,
    },
  });

  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function toggleVendorPayment(id: string, festivalId: string) {
  await requireAdmin();
  const payment = await prisma.vendorPayment.findUniqueOrThrow({ where: { id } });
  const newPaid = !payment.isPaid;

  await prisma.vendorPayment.update({ where: { id }, data: { isPaid: newPaid } });

  if (payment.budgetItemId) {
    await prisma.budgetItem.update({ where: { id: payment.budgetItemId }, data: { isPaid: newPaid } });
  }

  revalidatePath(`/festivals/${festivalId}/vendors`);
  revalidatePath(`/festivals/${festivalId}/budget`);
}

export async function deleteVendorPayment(id: string, festivalId: string) {
  await requireAdmin();
  const payment = await prisma.vendorPayment.findUniqueOrThrow({ where: { id } });

  if (payment.budgetItemId) {
    await prisma.budgetItem.delete({ where: { id: payment.budgetItemId } });
  }

  await prisma.vendorPayment.delete({ where: { id } });

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
  await requireAdmin();

  await prisma.vendorFile.create({
    data: { vendorId, name, url, isExternal, fileType: fileType || null },
  });

  revalidatePath(`/festivals/${festivalId}/vendors`);
}

export async function deleteVendorFile(id: string, festivalId: string) {
  await requireAdmin();
  await prisma.vendorFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/vendors`);
}

// ─── Vendor Self-Service Form ─────────────────────────────────────────────────

// ─── Setup Tasks (לוז טכני כללי) ─────────────────────────────────────────────

export async function createSetupTask(festivalId: string, dayLabel: string, date: string | null, time: string | null, category: string | null, description: string, responsible: string | null) {
  await requireAdmin();
  await prisma.festivalSetupTask.create({
    data: { festivalId, dayLabel, date: date || null, time: time || null, category: category || null, description, responsible: responsible || null },
  });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

export async function updateSetupTask(id: string, festivalId: string, formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
  await prisma.festivalSetupTask.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/schedule`);
}

// ─── Community Contacts (גורמים חיצוניים) ────────────────────────────────────

export async function createCommunityContact(festivalId: string, formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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

  // Replace strategy: delete all existing, then insert new
  await prisma.vendorContact.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendorVehicle.deleteMany({ where: { vendorId: vendor.id } });

  if (contacts.length > 0) {
    await prisma.vendorContact.createMany({
      data: contacts.map((c) => ({
        vendorId: vendor.id,
        name: c.name,
        role: c.role || null,
        phone: c.phone || null,
        email: c.email || null,
      })),
    });
  }

  if (vehicles.length > 0) {
    await prisma.vendorVehicle.createMany({
      data: vehicles.map((v) => ({
        vendorId: vendor.id,
        plateNumber: v.plateNumber,
        vehicleType: v.vehicleType || null,
        arrivalTime: v.arrivalTime || null,
      })),
    });
  }

  revalidatePath(`/festivals/${vendor.festivalId}/vendors`);
}
