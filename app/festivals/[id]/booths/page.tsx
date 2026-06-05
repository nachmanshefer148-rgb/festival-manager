export const dynamic = "force-dynamic";
import {
  approveBoothApplication,
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
  rejectBoothApplication,
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

  const [booths, festival, applications] = await Promise.all([
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
    prisma.boothApplication.findMany({
      where: { festivalId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serialized = booths.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() }));
  const serializedApps = applications.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));

  return (
    <BoothClient
      festivalId={id}
      booths={serialized}
      applications={serializedApps}
      boothsToken={festival?.boothsToken ?? null}
      isAdmin={access.isAdmin}
      canAccessFiles={access.canViewDocuments}
      showFinancials={access.canViewBudget}
      createBooth={createBooth}
      updateBooth={updateBooth}
      deleteBooth={deleteBooth}
      getBoothDetails={getBoothDetails}
      generateBoothsToken={generateBoothsToken}
      approveBoothApplication={approveBoothApplication}
      rejectBoothApplication={rejectBoothApplication}
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
