export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setGuestSessionCookie } from "@/lib/auth";

export default async function FestivalViewerEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const festival = await prisma.festival.findFirst({
    where: { viewerToken: token, viewerAccessEnabled: true },
    select: { id: true, viewerShowBudget: true, viewerShowDocuments: true },
  });

  if (!festival) notFound();

  await setGuestSessionCookie({
    festivalId: festival.id,
    showBudget: festival.viewerShowBudget,
    showDocuments: festival.viewerShowDocuments,
  });

  redirect(`/festivals/${festival.id}`);
}
