export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRole } from "@/lib/auth";
import { createFestivalFile, deleteFestivalFile } from "@/app/actions";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [role, festival, teamMembers, artists, vendors, stages, festivalFiles] =
    await Promise.all([
      getRole(),
      prisma.festival.findUnique({ where: { id } }),
      prisma.teamMember.findMany({
        where: { festivalId: id },
        include: { role: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      prisma.artist.findMany({
        where: { festivalId: id },
        include: {
          files: { orderBy: { createdAt: "desc" } },
          vehicles: true,
          timeSlots: {
            include: { stage: true },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.vendor.findMany({
        where: { festivalId: id },
        include: {
          files: { orderBy: { createdAt: "desc" } },
          vehicles: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.stage.findMany({
        where: { festivalId: id },
        include: {
          files: { orderBy: { createdAt: "desc" } },
          timeSlots: {
            include: { artist: true },
            orderBy: { startTime: "asc" },
          },
          manager: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.festivalFile.findMany({
        where: { festivalId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  if (!festival) notFound();

  // Serialize dates
  const serializedArtists = artists.map((a) => ({
    ...a,
    files: a.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    timeSlots: a.timeSlots.map((ts) => ({
      ...ts,
      startTime: ts.startTime.toISOString(),
      endTime: ts.endTime.toISOString(),
    })),
  }));

  const serializedVendors = vendors.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    files: v.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
  }));

  const serializedStages = stages.map((s) => ({
    ...s,
    files: s.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    timeSlots: s.timeSlots.map((ts) => ({
      ...ts,
      startTime: ts.startTime.toISOString(),
      endTime: ts.endTime.toISOString(),
    })),
  }));

  const serializedFestivalFiles = festivalFiles.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <DocumentsClient
      festivalId={id}
      festival={{ name: festival.name, startDate: festival.startDate.toISOString(), endDate: festival.endDate.toISOString(), location: festival.location }}
      teamMembers={teamMembers}
      artists={serializedArtists}
      vendors={serializedVendors}
      stages={serializedStages}
      festivalFiles={serializedFestivalFiles}
      isAdmin={role === "admin"}
      createFestivalFile={createFestivalFile}
      deleteFestivalFile={deleteFestivalFile}
    />
  );
}
