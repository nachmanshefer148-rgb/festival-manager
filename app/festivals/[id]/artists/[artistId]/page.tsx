import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRole } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import {
  updateArtist,
  deleteArtist,
  createArtistContact,
  deleteArtistContact,
  createArtistVehicle,
  deleteArtistVehicle,
  createArtistFile,
  deleteArtistFile,
  createArtistPayment,
  toggleArtistPayment,
  deleteArtistPayment,
} from "@/app/actions";
import ArtistDetailClient from "./ArtistDetailClient";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string; artistId: string }>;
}) {
  const { id, artistId } = await params;

  const [role, settings, artist] = await Promise.all([
    getRole(),
    getAppSettings(),
    prisma.artist.findUnique({
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
    }),
  ]);

  if (!artist || artist.festivalId !== id) notFound();

  // Serialize dates
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

  const showFinancials = role !== "limited" || (settings?.showBudget ?? true);

  return (
    <ArtistDetailClient
      festivalId={id}
      artist={serialized}
      isAdmin={role === "admin"}
      showFinancials={showFinancials}
      updateArtist={updateArtist}
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
