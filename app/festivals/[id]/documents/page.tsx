export const dynamic = "force-dynamic";
import { createFestivalFile, deleteFestivalFile } from "@/app/actions";
import { requireOwnedFestivalPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { festival } = await requireOwnedFestivalPage(id);

  const [teamMembers, artists, vendors, stages, festivalFiles, setupTasks, communityContacts] = await Promise.all([
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
        contacts: true,
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
        contacts: true,
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
    prisma.festivalSetupTask.findMany({
      where: { festivalId: id },
      orderBy: [{ date: "asc" }, { time: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.festivalCommunityContact.findMany({
      where: { festivalId: id },
      orderBy: { role: "asc" },
    }),
  ]);

  const serializedArtists = artists.map((artist) => ({
    ...artist,
    files: artist.files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
    timeSlots: artist.timeSlots.map((slot) => ({
      ...slot,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
    })),
  }));

  const serializedVendors = vendors.map((vendor) => ({
    ...vendor,
    createdAt: vendor.createdAt.toISOString(),
    files: vendor.files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
  }));

  const serializedStages = stages.map((stage) => ({
    ...stage,
    files: stage.files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
    timeSlots: stage.timeSlots.map((slot) => ({
      ...slot,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
    })),
  }));

  const serializedFestivalFiles = festivalFiles.map((file) => ({
    ...file,
    createdAt: file.createdAt.toISOString(),
  }));

  return (
    <DocumentsClient
      festivalId={id}
      festival={{
        name: festival.name,
        startDate: festival.startDate.toISOString(),
        endDate: festival.endDate.toISOString(),
        location: festival.location,
      }}
      teamMembers={teamMembers}
      artists={serializedArtists}
      vendors={serializedVendors}
      stages={serializedStages}
      festivalFiles={serializedFestivalFiles}
      setupTasks={setupTasks}
      communityContacts={communityContacts}
      isAdmin={true}
      createFestivalFile={createFestivalFile}
      deleteFestivalFile={deleteFestivalFile}
    />
  );
}
