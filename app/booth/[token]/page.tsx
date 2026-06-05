export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { submitBoothForm } from "@/app/actions";
import BoothForm from "./BoothForm";

export default async function BoothFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const booth = await prisma.booth.findUnique({
    where: { boothToken: token },
    include: {
      festival: { select: { name: true, logoUrl: true } },
      contacts: true,
      vehicles: true,
    },
  });

  if (!booth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">הלינק לא תקין</h1>
          <p className="text-gray-500 text-sm">יתכן שהלינק שגוי. בקש לינק חדש מהמארגן.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-12" dir="rtl">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          {booth.festival.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booth.festival.logoUrl} alt="לוגו פסטיבל" className="h-16 w-auto object-contain mx-auto mb-3" />
          ) : (
            <div className="text-4xl mb-3">🛒</div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{booth.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{booth.festival.name}</p>
          <p className="text-gray-400 text-xs mt-1">מלא/י את פרטי אנשי הקשר והרכבים שלך</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <BoothForm
            token={token}
            initialContacts={booth.contacts}
            initialVehicles={booth.vehicles}
            submitAction={submitBoothForm}
          />
        </div>
      </div>
    </div>
  );
}
