export const dynamic = "force-dynamic";
import {
  approveTeamApplication,
  createCommunityContact,
  createTeamMember,
  createTeamRole,
  deleteCommunityContact,
  deleteTeamMember,
  deleteTeamRole,
  generateInviteToken,
  rejectTeamApplication,
  updateCommunityContact,
  updateTeamMember,
} from "@/app/actions";
import { requireOwnedFestivalPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import TeamClient from "./TeamClient";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { festival } = await requireOwnedFestivalPage(id);

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
      isAdmin={true}
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
