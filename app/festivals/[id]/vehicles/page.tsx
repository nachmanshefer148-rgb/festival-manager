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

  const [directVehicles, vendorVehicles, artistVehicles, teamMembers, vendors, festival] =
    await Promise.all([
      prisma.vehicle.findMany({
        where: { festivalId: id },
        include: { vendor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendorVehicle.findMany({
        where: { vendor: { festivalId: id } },
        include: { vendor: { select: { id: true, name: true } } },
        orderBy: { vendor: { name: "asc" } },
      }),
      prisma.artistVehicle.findMany({
        where: { artist: { festivalId: id } },
        include: { artist: { select: { id: true, name: true } } },
        orderBy: { artist: { name: "asc" } },
      }),
      prisma.teamMember.findMany({
        where: { festivalId: id, carNumber: { not: null } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          carNumber: true,
          role: { select: { name: true } },
        },
        orderBy: { firstName: "asc" },
      }),
      prisma.vendor.findMany({
        where: { festivalId: id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.festival.findUnique({
        where: { id },
        select: { name: true, startDate: true, endDate: true, logoUrl: true },
      }),
    ]);

  return (
    <VehicleClient
      festivalId={id}
      festivalName={festival?.name ?? ""}
      festivalStartDate={festival?.startDate.toISOString() ?? ""}
      festivalEndDate={festival?.endDate.toISOString() ?? ""}
      festivalLogoUrl={festival?.logoUrl ?? null}
      directVehicles={directVehicles.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      }))}
      vendorVehicles={vendorVehicles.map((v) => ({
        id: v.id,
        plate: v.plateNumber,
        vehicleType: v.vehicleType,
        arrivalTime: v.arrivalTime,
        vendorId: v.vendorId,
        vendorName: v.vendor.name,
      }))}
      artistVehicles={artistVehicles.map((v) => ({
        id: v.id,
        plate: v.plateNumber,
        vehicleType: v.vehicleType,
        arrivalTime: v.arrivalTime,
        artistId: v.artistId,
        artistName: v.artist.name,
      }))}
      teamVehicles={teamMembers.map((m) => ({
        id: m.id,
        plate: m.carNumber!,
        memberName: `${m.firstName} ${m.lastName}`,
        roleName: m.role.name,
      }))}
      vendors={vendors}
      isAdmin={access.isAdmin}
      createVehicle={createVehicle}
      updateVehicle={updateVehicle}
      deleteVehicle={deleteVehicle}
    />
  );
}
