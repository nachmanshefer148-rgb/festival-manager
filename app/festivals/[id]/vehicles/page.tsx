export const dynamic = "force-dynamic";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createVehicle, updateVehicle, deleteVehicle } from "@/app/actions";
import VehicleClient from "./VehicleClient";

export default async function VehiclesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  const [vehicles, vendors, festival] = await Promise.all([
    prisma.vehicle.findMany({
      where: { festivalId: id },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendor.findMany({
      where: { festivalId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.festival.findUnique({
      where: { id },
      select: { name: true, startDate: true, endDate: true },
    }),
  ]);

  const serialized = vehicles.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <VehicleClient
      festivalId={id}
      festivalName={festival?.name ?? ""}
      festivalStartDate={festival?.startDate.toISOString() ?? ""}
      festivalEndDate={festival?.endDate.toISOString() ?? ""}
      vehicles={serialized}
      vendors={vendors}
      isAdmin={access.isAdmin}
      createVehicle={createVehicle}
      updateVehicle={updateVehicle}
      deleteVehicle={deleteVehicle}
    />
  );
}
