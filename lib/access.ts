import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/lib/auth";

export async function requireOwnedFestivalPage(festivalId: string) {
  const user = await requireCurrentUserPage(`festivals/${festivalId}`);
  const festival = await prisma.festival.findFirst({
    where: {
      id: festivalId,
      ownerId: user.id,
    },
  });

  if (!festival) notFound();
  return { user, festival };
}
