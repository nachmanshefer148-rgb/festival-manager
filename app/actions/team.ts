"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireAdmin,
  requireOwnedFestival,
  requireOwnedTeamRole,
  requireOwnedTeamMember,
  requireOwnedTeamApplication,
  requireOwnedCommunityContact,
} from "@/lib/authorize";
import { assertFestivalMatch, requireString, optionalString, optionalEmail } from "@/lib/action-utils";

export async function createTeamRole(formData: FormData) {
  await requireAdmin();
  const festivalId = formData.get("festivalId") as string;
  await requireOwnedFestival(festivalId);
  await prisma.teamMemberRole.create({ data: { name: formData.get("name") as string, festivalId } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

export async function deleteTeamRole(id: string, festivalId: string) {
  const role = await requireOwnedTeamRole(id);
  assertFestivalMatch(role.festivalId, festivalId);
  await prisma.teamMemberRole.delete({ where: { id } });
  revalidatePath(`/festivals/${festivalId}/team`);
}

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
    if (role.festivalId !== app.festivalId) throw new Error("תפקיד לא שייך לפסטיבל");
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
    await tx.teamApplication.update({ where: { id: applicationId }, data: { status: "approved" } });
  });

  revalidatePath(`/festivals/${app.festivalId}/team`);
}

export async function rejectTeamApplication(applicationId: string) {
  const app = await requireOwnedTeamApplication(applicationId);
  await prisma.teamApplication.delete({ where: { id: applicationId } });
  revalidatePath(`/festivals/${app.festivalId}/team`);
}

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

