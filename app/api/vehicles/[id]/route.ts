import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getGuestFestivalPermissions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const { searchParams } = request.nextUrl;
  const festivalId = searchParams.get("festivalId");

  // Auth: logged-in user or valid guest
  const user = await getCurrentUser();
  if (!user) {
    const guest = await getGuestFestivalPermissions();
    if (!guest || guest.festivalId !== festivalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // id format: "type:realId"  (e.g. "direct:abc", "vendor:abc", "artist:abc", "team:abc")
  const colonIdx = rawId.indexOf(":");
  const type = colonIdx !== -1 ? rawId.slice(0, colonIdx) : "direct";
  const realId = colonIdx !== -1 ? rawId.slice(colonIdx + 1) : rawId;

  if (type === "vendor") {
    const v = await prisma.vendorVehicle.findFirst({
      where: {
        id: realId,
        ...(festivalId ? { vendor: { festivalId } } : {}),
      },
      include: { vendor: { select: { name: true } } },
    });
    if (!v) return NextResponse.json({ valid: false, message: "רכב לא נמצא" }, { status: 404 });
    return NextResponse.json({
      valid: true,
      driverName: v.vendor.name,
      plate: v.plateNumber,
      vendorName: v.vendor.name,
      notes: [v.vehicleType, v.arrivalTime].filter(Boolean).join(" · ") || null,
    });
  }

  if (type === "artist") {
    const v = await prisma.artistVehicle.findFirst({
      where: {
        id: realId,
        ...(festivalId ? { artist: { festivalId } } : {}),
      },
      include: { artist: { select: { name: true } } },
    });
    if (!v) return NextResponse.json({ valid: false, message: "רכב לא נמצא" }, { status: 404 });
    return NextResponse.json({
      valid: true,
      driverName: v.artist.name,
      plate: v.plateNumber,
      vendorName: null,
      notes: [v.vehicleType, v.arrivalTime].filter(Boolean).join(" · ") || null,
    });
  }

  if (type === "team") {
    const m = await prisma.teamMember.findFirst({
      where: {
        id: realId,
        ...(festivalId ? { festivalId } : {}),
      },
      include: { role: { select: { name: true } } },
    });
    if (!m || !m.carNumber) return NextResponse.json({ valid: false, message: "רכב לא נמצא" }, { status: 404 });
    return NextResponse.json({
      valid: true,
      driverName: `${m.firstName} ${m.lastName}`,
      plate: m.carNumber,
      vendorName: m.role.name,
      notes: null,
    });
  }

  // default: "direct" Vehicle table
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: realId,
      ...(festivalId ? { festivalId } : {}),
    },
    include: { vendor: { select: { name: true } } },
  });
  if (!vehicle) return NextResponse.json({ valid: false, message: "רכב לא נמצא" }, { status: 404 });
  return NextResponse.json({
    valid: true,
    driverName: vehicle.driverName,
    plate: vehicle.plate,
    vendorName: vehicle.vendor?.name ?? null,
    notes: vehicle.notes,
  });
}
