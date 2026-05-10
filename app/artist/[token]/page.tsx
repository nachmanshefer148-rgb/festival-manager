export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { submitArtistForm } from "@/app/actions";
import ArtistForm from "./ArtistForm";

export default async function ArtistFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const artist = await prisma.artist.findUnique({
    where: { artistToken: token },
    include: {
      festival: { select: { name: true, logoUrl: true } },
      files: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, fileType: true },
      },
    },
  });

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4">🎤</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">הלינק לא תקין</h1>
          <p className="text-gray-500 text-sm">בקש לינק חדש מהמארגן.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-12" dir="rtl">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          {artist.festival.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artist.festival.logoUrl} alt="לוגו פסטיבל" className="h-16 w-auto object-contain mx-auto mb-3" />
          ) : (
            <div className="text-4xl mb-3">🎤</div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{artist.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{artist.festival.name}</p>
          <p className="text-gray-400 text-xs mt-1">מלא/י את הפרטים הטכניים שלך</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <ArtistForm
            token={token}
            initialData={{
              contactPhone: artist.contactPhone ?? "",
              contactEmail: artist.contactEmail ?? "",
              technicalRiderNotes: artist.technicalRiderNotes ?? "",
              hospitalityRider: artist.hospitalityRider ?? "",
              files: artist.files.map((file) => ({
                id: file.id,
                name: file.name,
                fileType: file.fileType ?? "other",
              })),
            }}
            submitAction={submitArtistForm}
          />
        </div>
      </div>
    </div>
  );
}
