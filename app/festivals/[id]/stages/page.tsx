export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRole } from "@/lib/auth";
import {
  createStage,
  updateStage,
  deleteStage,
  createStageFile,
  deleteStageFile,
} from "@/app/actions";
import StagesClient from "./StagesClient";

export default async function StagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [role, festival, stages, teamMembers] = await Promise.all([
    getRole(),
    prisma.festival.findUnique({ where: { id } }),
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

  if (!festival) notFound();

  const serializedStages = stages.map((s) => ({
    ...s,
    files: s.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
  }));

  return (
    <StagesClient
      festivalId={id}
      stages={serializedStages}
      teamMembers={teamMembers}
      isAdmin={role === "admin"}
      createStage={createStage}
      updateStage={updateStage}
      deleteStage={deleteStage}
      createStageFile={createStageFile}
      deleteStageFile={deleteStageFile}
    />
  );
}
