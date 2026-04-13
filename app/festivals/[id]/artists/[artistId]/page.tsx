export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import {
  createArtistContact,
  createArtistFile,
  createArtistPayment,
  createArtistVehicle,
  deleteArtist,
  deleteArtistContact,
  deleteArtistFile,
  deleteArtistPayment,
  deleteArtistVehicle,
  toggleArtistPayment,
  updateArtist,
  updateArtistImage,
} from "@/app/actions";
import { requireOwnedFestivalPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import ArtistDetailClient from "./ArtistDetailClient";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string; artistId: string }>;
}) {
  const { id, artistId } = await params;
  await requireOwnedFestivalPage(id);

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: {
      timeSlots: {
        include: { stage: true },
        orderBy: { startTime: "asc" },
      },
      contacts: true,
      vehicles: true,
      files: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!artist || artist.festivalId !== id) notFound();

  const serialized = {
    ...artist,
    timeSlots: artist.timeSlots.map((ts) => ({
      ...ts,
      startTime: ts.startTime.toISOString(),
      endTime: ts.endTime.toISOString(),
    })),
    files: artist.files.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
    })),
    payments: artist.payments.map((p) => ({
      ...p,
      dueDate: p.dueDate?.toISOString() ?? null,
    })),
  };

  return (
    <ArtistDetailClient
      festivalId={id}
      artist={serialized}
      isAdmin={true}
      canAccessFiles={true}
      showFinancials={true}
      updateArtist={updateArtist}
      updateArtistImage={updateArtistImage}
      deleteArtist={deleteArtist}
      createArtistContact={createArtistContact}
      deleteArtistContact={deleteArtistContact}
      createArtistVehicle={createArtistVehicle}
      deleteArtistVehicle={deleteArtistVehicle}
      createArtistFile={createArtistFile}
      deleteArtistFile={deleteArtistFile}
      createArtistPayment={createArtistPayment}
      toggleArtistPayment={toggleArtistPayment}
      deleteArtistPayment={deleteArtistPayment}
    />
  );
}
