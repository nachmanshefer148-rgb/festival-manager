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
    prisma.vendor.findMany({ where: { festivalId: id }, select: { id: true, category: true } }),
    prisma.booth.findMany({ where: { festivalId: id }, select: { id: true, category: true } }),
    prisma.budgetItem.findMany({ where: { festivalId: id }, select: { amount: true, type: true, category: true, isPaid: true } }),
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
      vendors={vendors}
      booths={booths}
      budgetItems={budgetItems}
      timeSlots={timeSlots.map((s) => ({
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        artistId: s.artistId,
      }))}
    />
  );
}
