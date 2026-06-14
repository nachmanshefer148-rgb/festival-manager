export const dynamic = "force-dynamic";

import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireFestivalAccessPage(id);

  const [festival, artists, teamMembers, vendors, booths, budgetItems, timeSlots] = await Promise.all([
    prisma.festival.findUnique({ where: { id }, select: { name: true, startDate: true, endDate: true } }),
    prisma.artist.findMany({ where: { festivalId: id }, select: { id: true, name: true, genre: true, status: true, fee: true } }),
    prisma.teamMember.findMany({ where: { festivalId: id }, select: { id: true, role: { select: { name: true } } } }),
    prisma.vendor.findMany({ where: { festivalId: id }, select: { id: true, categoryId: true } }),
    prisma.booth.findMany({ where: { festivalId: id }, select: { id: true, categoryId: true } }),
    prisma.budgetItem.findMany({ where: { festivalId: id }, select: { amount: true, type: true, categoryId: true, isPaid: true } }),
    prisma.timeSlot.findMany({
      where: { stage: { festivalId: id }, type: "PERFORMANCE" },
      select: { startTime: true, endTime: true, artistId: true },
    }),
  ]);

  if (!festival) return <div className="p-8 text-gray-500">פסטיבל לא נמצא</div>;

  return (
    <AnalyticsDashboard
      festival={festival}
      artists={artists}
      teamMembers={teamMembers}
      vendors={vendors.map((v) => ({ id: v.id, category: v.categoryId ?? "" }))}
      booths={booths.map((b) => ({ id: b.id, category: b.categoryId ?? "" }))}
      budgetItems={budgetItems.map((b) => ({ ...b, category: b.categoryId ?? null }))}
      timeSlots={timeSlots.map((s) => ({
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        artistId: s.artistId,
      }))}
    />
  );
}
