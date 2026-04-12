export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
  createTeamRole,
  deleteTeamRole,
  generateInviteToken,
  approveTeamApplication,
  rejectTeamApplication,
  createCommunityContact,
  updateCommunityContact,
  deleteCommunityContact,
} from "@/app/actions";
import TeamClient from "./TeamClient";
import { getRole } from "@/lib/auth";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [festival, role] = await Promise.all([
    prisma.festival.findUnique({ where: { id } }),
    getRole(),
  ]);
  if (!festival) notFound();
  const isAdmin = role === "admin";

  const [members, roles, applications, communityContacts] = await Promise.all([
    prisma.teamMember.findMany({
      where: { festivalId: id },
      include: { role: true },
      orderBy: [{ role: { name: "asc" } }, { lastName: "asc" }],
    }),
    prisma.teamMemberRole.findMany({
      where: { festivalId: id },
      orderBy: { name: "asc" },
    }),
    prisma.teamApplication.findMany({
      where: { festivalId: id, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.festivalCommunityContact.findMany({
      where: { festivalId: id },
      orderBy: { role: "asc" },
    }),
  ]);

  return (
    <TeamClient
      festivalId={id}
      members={members}
      roles={roles}
      isAdmin={isAdmin}
      inviteToken={festival.inviteToken}
      applications={applications}
      createTeamMember={createTeamMember}
      deleteTeamMember={deleteTeamMember}
      updateTeamMember={updateTeamMember}
      createTeamRole={createTeamRole}
      deleteTeamRole={deleteTeamRole}
      generateInviteToken={generateInviteToken}
      approveTeamApplication={approveTeamApplication}
      rejectTeamApplication={rejectTeamApplication}
      communityContacts={communityContacts}
      createCommunityContact={createCommunityContact}
      updateCommunityContact={updateCommunityContact}
      deleteCommunityContact={deleteCommunityContact}
    />
  );
}
