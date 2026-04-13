import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getGuestFestivalPermissions, requireCurrentUserPage } from "@/lib/auth";

export type FestivalAccessContext = {
  festival: NonNullable<Awaited<ReturnType<typeof prisma.festival.findFirst>>>;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canViewBudget: boolean;
  canViewDocuments: boolean;
};

export async function requireOwnedFestivalPage(festivalId: string) {
  const user = await requireCurrentUserPage(`festivals/${festivalId}`);
  const festival = await prisma.festival.findFirst({
    where: {
      id: festivalId,
      ...(user.role === "SUPER_ADMIN" ? {} : { ownerId: user.id }),
    },
  });

  if (!festival) notFound();
  return { user, festival };
}

export async function requireFestivalAccessPage(festivalId: string): Promise<FestivalAccessContext> {
  const user = await getCurrentUser();

  if (user) {
    const festival = await prisma.festival.findFirst({
      where: {
        id: festivalId,
        ...(user.role === "SUPER_ADMIN" ? {} : { ownerId: user.id }),
      },
    });

    if (!festival) notFound();
    return {
      festival,
      user,
      isAdmin: true,
      isSuperAdmin: user.role === "SUPER_ADMIN",
      canViewBudget: true,
      canViewDocuments: true,
    };
  }

  const guest = await getGuestFestivalPermissions();
  if (!guest || guest.festivalId !== festivalId) notFound();

  const festival = await prisma.festival.findFirst({
    where: {
      id: festivalId,
      viewerAccessEnabled: true,
    },
  });
  if (!festival) notFound();

  return {
    festival,
    user: null,
    isAdmin: false,
    isSuperAdmin: false,
    canViewBudget: guest.showBudget,
    canViewDocuments: guest.showDocuments,
  };
}
