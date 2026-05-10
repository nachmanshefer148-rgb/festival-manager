export const dynamic = "force-dynamic";
import Link from "next/link";
import { createArtist, createArtistContact, createArtistVehicle, deleteArtist } from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/app/components/DeleteButton";
import AddArtistModal from "./AddArtistModal";
import ArtistsExportButton from "./ArtistsExportButton";
import ArtistLinkButton from "./ArtistLinkButton";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "מאושר",
  pending: "ממתין",
  cancelled: "בוטל",
};
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
};

export default async function ArtistsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  const artists = await prisma.artist.findMany({
    where: { festivalId: id },
    orderBy: { name: "asc" },
    include: { timeSlots: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">🎤 אמנים</h1>
          {artists.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {artists.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {artists.length > 0 && <ArtistsExportButton artists={artists} />}
          {access.isAdmin && (
            <AddArtistModal festivalId={id} createArtist={createArtist} createArtistContact={createArtistContact} createArtistVehicle={createArtistVehicle} />
          )}
        </div>
      </div>

      {artists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🎤</div>
          <p className="text-lg font-medium">עדיין אין אמנים</p>
          {access.isAdmin && <p className="text-sm mt-1">הוסף אמן ראשון כדי להתחיל</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {artists.map((artist) => {
            const status = artist.status ?? "confirmed";
            const scheduledCount = artist.timeSlots.filter((slot) => slot.status === "SCHEDULED").length;

            return (
              <div
                key={artist.id}
                className="group bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/festivals/${id}/artists/${artist.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                        {artist.name}
                      </span>
                      {artist.genre && (
                        <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                          {artist.genre}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.confirmed}`}>
                        {STATUS_LABELS[status] ?? "מאושר"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                      {artist.contactPhone && <span>📞 {artist.contactPhone}</span>}
                      {artist.contactEmail && <span className="hidden sm:inline">✉️ {artist.contactEmail}</span>}
                      {scheduledCount > 0 && <span className="text-violet-500 font-medium">{scheduledCount} הופעות</span>}
                    </div>
                  </Link>

                  <div className="shrink-0 flex items-center gap-2 text-xs text-gray-400">
                    <div className="hidden sm:flex gap-1.5">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">
                        {artist.setDuration}′
                      </span>
                    </div>
                    {access.isAdmin && (
                      <ArtistLinkButton artistToken={artist.artistToken} />
                    )}
                    {access.isAdmin && (
                      <DeleteButton
                        action={async () => {
                          "use server";
                          await deleteArtist(artist.id, id);
                        }}
                        confirm={`למחוק את האמן "${artist.name}"? כל הקבצים, אנשי הקשר והתשלומים המשויכים יימחקו גם הם.`}
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        🗑 מחק
                      </DeleteButton>
                    )}
                    <span className="text-gray-300 group-hover:text-violet-400 transition-colors text-base">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
