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
  createBoothCategory,
  updateBoothCategory,
  deleteBoothCategory,
} from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import BoothClient from "./BoothClient";

const DEFAULT_BOOTH_CATEGORIES = ["אוכל ושתייה", "מרצ'נדייז", "פעילויות ומשחקים", "אמנות ויצירה", "שירותים אחרים"];

export default async function BoothsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  let boothCategories = await prisma.boothCategory.findMany({
    where: { festivalId: id },
    orderBy: { name: "asc" },
  });

  if (boothCategories.length === 0) {
    await prisma.boothCategory.createMany({
      data: DEFAULT_BOOTH_CATEGORIES.map((name) => ({ name, festivalId: id })),
    });
    boothCategories = await prisma.boothCategory.findMany({
      where: { festivalId: id },
      orderBy: { name: "asc" },
    });
  }

  const [booths, festival, applications] = await Promise.all([
    prisma.booth.findMany({
      where: { festivalId: id },
      select: {
        id: true,
        name: true,
        categoryId: true,
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

  const serialized = booths.map((b) => ({
    ...b,
    category: b.categoryId ?? "",
    createdAt: b.createdAt.toISOString(),
  }));
  const serializedApps = applications.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));

  return (
    <BoothClient
      festivalId={id}
      booths={serialized}
      categories={boothCategories}
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
      createCategory={createBoothCategory}
      updateCategory={updateBoothCategory}
      deleteCategory={deleteBoothCategory}
    />
  );
}
