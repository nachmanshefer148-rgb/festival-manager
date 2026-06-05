"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import {
  requireAdmin,
  requireOwnedFestival,
  requireFestivalOwner,
  requireOwnedFestivalFile,
} from "@/lib/authorize";
import { setGuestSessionCookie } from "@/lib/auth";
import { assertFestivalMatch } from "@/lib/action-utils";

export async function createFestival(formData: FormData) {
  const user = await requireAdmin();
  const festival = await prisma.festival.create({
    data: {
      ownerId: user.id,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      location: formData.get("location") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
    },
  });
  redirect(`/festivals/${festival.id}`);
}

export async function updateFestival(id: string, formData: FormData) {
  await requireOwnedFestival(id);
  await prisma.festival.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      location: formData.get("location") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
    },
  });
  revalidatePath("/");
  revalidatePath(`/festivals/${id}`);
}

export async function updateFestivalLogo(festivalId: string, logoUrl: string | null) {
  await requireOwnedFestival(festivalId);
  await prisma.festival.update({ where: { id: festivalId }, data: { logoUrl } });
  revalidatePath(`/festivals/${festivalId}`);
  revalidatePath(`/festivals/${festivalId}/settings`);
  revalidatePath(`/festivals/${festivalId}/vehicles/permit-preview`);
}

export async function deleteFestival(id: string, password: string) {
  const { user } = await requireFestivalOwner(id);
  const bcrypt = await import("bcryptjs");
  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!fullUser) throw new Error("משתמש לא נמצא");
  const valid = await bcrypt.compare(password, fullUser.passwordHash);
  if (!valid) throw new Error("סיסמה שגויה");
  await prisma.festival.delete({ where: { id } });
  revalidatePath("/");
}

export async function addFestivalMember(festivalId: string, email: string) {
  await requireFestivalOwner(festivalId);
  const targetUser = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (!targetUser) throw new Error("משתמש עם אימייל זה לא נמצא");
  await prisma.festivalMember.upsert({
    where: { userId_festivalId: { userId: targetUser.id, festivalId } },
    create: { userId: targetUser.id, festivalId },
    update: {},
  });
  revalidatePath(`/festivals/${festivalId}/settings`);
  return targetUser;
}

export async function removeFestivalMember(festivalId: string, userId: string) {
  await requireFestivalOwner(festivalId);
  await prisma.festivalMember.deleteMany({ where: { festivalId, userId } });
  revalidatePath(`/festivals/${festivalId}/settings`);
}

export async function generateInviteToken(festivalId: string) {
  await requireOwnedFestival(festivalId);
  const token = randomUUID();
  await prisma.festival.update({ where: { id: festivalId }, data: { inviteToken: token } });
  revalidatePath(`/festivals/${festivalId}/team`);
  return token;
}

export async function saveFestivalViewerAccess(festivalId: string, formData: FormData) {
  const festival = await requireOwnedFestival(festivalId);
  const viewerAccessEnabled = formData.get("viewerAccessEnabled") === "on";
  const viewerShowBudget = viewerAccessEnabled && formData.get("viewerShowBudget") === "on";
  const viewerShowDocuments = viewerAccessEnabled && formData.get("viewerShowDocuments") === "on";
  const viewerToken = viewerAccessEnabled ? festival.viewerToken ?? randomUUID() : null;
  await prisma.festival.update({
    where: { id: festivalId },
    data: { viewerAccessEnabled, viewerShowBudget, viewerShowDocuments, viewerToken },
  });
  revalidatePath(`/festivals/${festivalId}/team`);
  revalidatePath(`/festivals/${festivalId}`);
}

export async function generateFestivalViewerToken(festivalId: string) {
  await requireOwnedFestival(festivalId);
  const token = randomUUID();
  await prisma.festival.update({
    where: { id: festivalId },
    data: { viewerToken: token, viewerAccessEnabled: true },
  });
  revalidatePath(`/festivals/${festivalId}/team`);
  return token;
}

export async function enterFestivalViewer(token: string) {
  const festival = await prisma.festival.findFirst({
    where: { viewerToken: token, viewerAccessEnabled: true },
    select: { id: true, viewerShowBudget: true, viewerShowDocuments: true },
  });
  if (!festival) throw new Error("לינק צפייה לא תקין");
  await setGuestSessionCookie({
    festivalId: festival.id,
    showBudget: festival.viewerShowBudget,
    showDocuments: festival.viewerShowDocuments,
  });
  redirect(`/festivals/${festival.id}`);
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
