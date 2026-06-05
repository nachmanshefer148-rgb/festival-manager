"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireAdmin,
  requireOwnedFestival,
  requireOwnedArtist,
  requireOwnedArtistContact,
  requireOwnedArtistVehicle,
  requireOwnedArtistFile,
  requireOwnedArtistPayment,
} from "@/lib/authorize";
import { assertFestivalMatch, requireString, readString, parseAmount, optionalString, optionalEmail } from "@/lib/action-utils";

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
  await prisma.artistFile.create({ data: { artistId, name, url, isExternal, fileType: fileType || null } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

export async function deleteArtistFile(id: string, artistId: string, festivalId: string) {
  const file = await requireOwnedArtistFile(id);
  assertFestivalMatch(file.artist.festivalId, festivalId);
  if (file.artistId !== artistId) throw new Error("אי התאמה בין קובץ לאמן");
  await prisma.artistFile.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/artists/${artistId}`);
  revalidatePath(`/festivals/${festivalId}/documents`);
}

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
      data: { artistId, description, amount, dueDate: dueDateStr ? new Date(dueDateStr) : null, isPaid: false, budgetItemId: budgetItem.id },
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

export async function submitArtistForm(
  token: string,
  data: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    technicalRiderNotes: string;
    hospitalityRider: string;
    notes: string;
    files: { name: string; url: string; fileType: string }[];
    contacts: { name: string; role: string; phone: string; email: string; idNumber: string }[];
    vehicles: { plateNumber: string; vehicleType: string; arrivalTime: string }[];
  }
) {
  const artist = await prisma.artist.findUnique({ where: { artistToken: token } });
  if (!artist) throw new Error("לינק לא תקין");

  await prisma.artist.update({
    where: { id: artist.id },
    data: {
      contactPhone: data.contactPhone.trim() || artist.contactPhone,
      contactEmail: data.contactEmail.trim() || artist.contactEmail,
      technicalRiderNotes: data.technicalRiderNotes.trim() || null,
      hospitalityRider: data.hospitalityRider.trim() || null,
      privateNotes: data.notes.trim() || null,
    },
  });

  if (data.contacts.length > 0) {
    await prisma.artistContact.createMany({
      data: data.contacts.map((c) => ({
        artistId: artist.id,
        name: c.name.trim(),
        role: c.role.trim() || null,
        phone: c.phone.trim() || null,
        email: c.email.trim() || null,
        idNumber: c.idNumber.trim() || null,
      })),
    });
  }

  if (data.vehicles.length > 0) {
    await prisma.artistVehicle.createMany({
      data: data.vehicles.map((v) => ({
        artistId: artist.id,
        plateNumber: v.plateNumber.trim(),
        vehicleType: v.vehicleType.trim() || null,
        arrivalTime: v.arrivalTime.trim() || null,
      })),
    });
  }

  const normalizedFiles = data.files
    .map((f) => ({ name: f.name.trim(), url: f.url.trim(), fileType: f.fileType.trim() || "other" }))
    .filter((f) => f.name && f.url);

  if (normalizedFiles.length > 0) {
    await prisma.artistFile.createMany({
      data: normalizedFiles.map((f) => ({ artistId: artist.id, name: f.name, url: f.url, fileType: f.fileType, isExternal: false })),
    });
  }

  revalidatePath(`/festivals/${artist.festivalId}/artists`);
  revalidatePath(`/festivals/${artist.festivalId}/artists/${artist.id}`);
  revalidatePath(`/festivals/${artist.festivalId}/documents`);
  revalidatePath(`/festivals/${artist.festivalId}/vehicles`);
}
