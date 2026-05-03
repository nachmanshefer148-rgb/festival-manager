import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getGuestFestivalPermissions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const festivalId = searchParams.get("festivalId");

  // Auth check: must be logged in or a valid guest of this festival
  const user = await getCurrentUser();
  if (!user) {
    const guest = await getGuestFestivalPermissions();
    if (!guest || guest.festivalId !== festivalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      ...(festivalId ? { festivalId } : {}),
    },
    include: { vendor: { select: { name: true } } },
  });

  if (!vehicle) {
    return NextResponse.json(
      { valid: false, message: "רכב לא נמצא" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    driverName: vehicle.driverName,
    plate: vehicle.plate,
    vendorName: vehicle.vendor?.name ?? null,
    notes: vehicle.notes,
  });
}
