export const dynamic = "force-dynamic";
import {
  createBooth,
  createBoothContact,
  createBoothFile,
  createBoothPayment,
  createBoothVehicle,
  deleteBooth,
  deleteBoothContact,
  deleteBoothFile,
  deleteBoothPayment,
  deleteBoothVehicle,
  generateBoothsToken,
  getBoothDetails,
  toggleBoothPayment,
  updateBooth,
} from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import BoothClient from "./BoothClient";

export default async function BoothsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  const [booths, festival] = await Promise.all([
    prisma.booth.findMany({
      where: { festivalId: id },
      select: {
        id: true,
        name: true,
        category: true,
        notes: true,
        boothToken: true,
        createdAt: true,
        festivalId: true,
        _count: {
          select: { contacts: true, vehicles: true, payments: true, files: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.festival.findUnique({
      where: { id },
      select: { boothsToken: true },
    }),
  ]);

  const serialized = booths.map((booth) => ({
    ...booth,
    createdAt: booth.createdAt.toISOString(),
  }));

  return (
    <BoothClient
      festivalId={id}
      booths={serialized}
      boothsToken={festival?.boothsToken ?? null}
      isAdmin={access.isAdmin}
      canAccessFiles={access.canViewDocuments}
      showFinancials={access.canViewBudget}
      createBooth={createBooth}
      updateBooth={updateBooth}
      deleteBooth={deleteBooth}
      getBoothDetails={getBoothDetails}
      generateBoothsToken={generateBoothsToken}
      createBoothContact={createBoothContact}
      deleteBoothContact={deleteBoothContact}
      createBoothVehicle={createBoothVehicle}
      deleteBoothVehicle={deleteBoothVehicle}
      createBoothPayment={createBoothPayment}
      toggleBoothPayment={toggleBoothPayment}
      deleteBoothPayment={deleteBoothPayment}
      createBoothFile={createBoothFile}
      deleteBoothFile={deleteBoothFile}
    />
  );
}
