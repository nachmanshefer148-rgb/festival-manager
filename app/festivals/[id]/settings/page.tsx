export const dynamic = "force-dynamic";
import { requireOwnedFestivalPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  addFestivalMember,
  removeFestivalMember,
  deleteFestival,
  updateFestivalLogo,
} from "@/app/actions";
import FestivalSettingsClient from "./FestivalSettingsClient";

export default async function FestivalSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, festival } = await requireOwnedFestivalPage(id);

  const isOwner = festival.ownerId === user.id || user.role === "SUPER_ADMIN";

  const members = await prisma.festivalMember.findMany({
    where: { festivalId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <FestivalSettingsClient
      festivalId={id}
      festivalName={festival.name}
      isOwner={isOwner}
      logoUrl={festival.logoUrl ?? null}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        createdAt: m.createdAt.toISOString(),
      }))}
      addFestivalMember={addFestivalMember}
      removeFestivalMember={removeFestivalMember}
      deleteFestival={deleteFestival}
      updateFestivalLogo={updateFestivalLogo}
    />
  );
}
