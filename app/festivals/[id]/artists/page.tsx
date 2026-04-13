export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createArtist, createArtistContact, createArtistVehicle } from "@/app/actions";
import AddArtistModal from "./AddArtistModal";
import ArtistsExportButton from "./ArtistsExportButton";
import { getRole } from "@/lib/auth";

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
  const [festival, role] = await Promise.all([
    prisma.festival.findUnique({ where: { id } }),
    getRole(),
  ]);
  if (!festival) notFound();
  const isAdmin = role === "admin";

  const artists = await prisma.artist.findMany({
    where: { festivalId: id },
    orderBy: { name: "asc" },
    include: { timeSlots: true },
  });

  return (
    <div>
      {/* Header */}
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
          {isAdmin && <AddArtistModal festivalId={id} createArtist={createArtist} createArtistContact={createArtistContact} createArtistVehicle={createArtistVehicle} />}
        </div>
      </div>

      {/* List */}
      {artists.length === 0 ? (
        isAdmin ? (
          <AddArtistModal festivalId={id} createArtist={createArtist} createArtistContact={createArtistContact} createArtistVehicle={createArtistVehicle}>
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 hover:bg-violet-50 hover:border-violet-400 hover:text-violet-500 transition-colors cursor-pointer group">
              <div className="text-4xl mb-2">🎵</div>
              <p className="font-medium">עדיין אין אמנים</p>
              <p className="text-sm mt-1">הוסף אמן ראשון כדי להתחיל</p>
              <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">+ לחץ להוספה</p>
            </div>
          </AddArtistModal>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🎵</div>
            <p className="font-medium">עדיין אין אמנים</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {artists.map((artist) => {
            const scheduledCount = artist.timeSlots.length;
            const status = artist.status ?? "confirmed";
            const initials = artist.name.slice(0, 2).toUpperCase();

            return (
              <Link
                key={artist.id}
                href={`/festivals/${id}/artists/${artist.id}`}
                className="block bg-white rounded-2xl border border-gray-200 px-4 py-3.5 shadow-sm hover:shadow-md hover:border-violet-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="shrink-0 w-11 h-11 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                    {artist.profileImageUrl ? (
                      <img src={artist.profileImageUrl} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-violet-600 font-semibold text-sm">{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
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
                      {scheduledCount > 0 && (
                        <span className="text-violet-500 font-medium">{scheduledCount} הופעות</span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="shrink-0 flex items-center gap-2 text-xs text-gray-400">
                    <div className="hidden sm:flex gap-1.5">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">
                        {artist.setDuration}′
                      </span>
                    </div>
                    <span className="text-gray-300 group-hover:text-violet-400 transition-colors text-base">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
