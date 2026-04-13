export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { enterFestivalViewer } from "@/app/actions";

export default async function FestivalViewerEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    await enterFestivalViewer(token);
  } catch {
    notFound();
  }
  return null;
}
