export const dynamic = "force-dynamic";
import { createStage, createStageFile, deleteStage, deleteStageFile, updateStage } from "@/app/actions";
import { requireOwnedFestivalPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import StagesClient from "./StagesClient";

export default async function StagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwnedFestivalPage(id);

  const [stages, teamMembers] = await Promise.all([
    prisma.stage.findMany({
      where: { festivalId: id },
      include: {
        files: { orderBy: { createdAt: "desc" } },
        manager: { include: { role: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { festivalId: id },
      include: { role: true },
      orderBy: [{ lastName: "asc" }],
    }),
  ]);

  const serializedStages = stages.map((stage) => ({
    ...stage,
    files: stage.files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
  }));

  return (
    <StagesClient
      festivalId={id}
      stages={serializedStages}
      teamMembers={teamMembers}
      isAdmin={true}
      canAccessFiles={true}
      createStage={createStage}
      updateStage={updateStage}
      deleteStage={deleteStage}
      createStageFile={createStageFile}
      deleteStageFile={deleteStageFile}
    />
  );
}
