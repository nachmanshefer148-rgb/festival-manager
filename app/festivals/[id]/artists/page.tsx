export const dynamic = "force-dynamic";
import { createArtist, createArtistContact, createArtistVehicle } from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import AddArtistModal from "./AddArtistModal";
import ArtistsClient from "./ArtistsClient";

export default async function ArtistsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  const artists = await prisma.artist.findMany({
    where: { festivalId: id },
    orderBy: { name: "asc" },
    include: {
      timeSlots: { select: { status: true } },
      contacts: { select: { id: true, name: true, role: true, phone: true, email: true } },
      vehicles: { select: { id: true, plateNumber: true } },
    },
  });

  const addButton = access.isAdmin ? (
    <AddArtistModal
      festivalId={id}
      createArtist={createArtist}
      createArtistContact={createArtistContact}
      createArtistVehicle={createArtistVehicle}
    />
  ) : null;

  return (
    <ArtistsClient
      festivalId={id}
      artists={artists.map((a) => ({
        ...a,
        festivalId: id,
        status: a.status ?? "confirmed",
      }))}
      isAdmin={access.isAdmin}
      addArtistButton={addButton}
    />
  );
}
