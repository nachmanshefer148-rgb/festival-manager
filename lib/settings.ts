import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getAppSettings = unstable_cache(
  () => prisma.appSettings.findUnique({ where: { id: "global" } }),
  ["app-settings"],
  { revalidate: 60 }
);
