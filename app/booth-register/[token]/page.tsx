export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { submitBoothRegistration } from "@/app/actions";
import BoothRegisterForm from "./BoothRegisterForm";

export default async function BoothRegisterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const festival = await prisma.festival.findUnique({
    where: { boothsToken: token },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!festival) {
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {festival.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={festival.logoUrl} alt="לוגו פסטיבל" className="h-16 w-auto object-contain mx-auto mb-3" />
          ) : (
            <div className="text-4xl mb-3">🛒</div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{festival.name}</h1>
          <p className="text-gray-500 text-sm mt-1">רישום דוכן לפסטיבל</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <BoothRegisterForm token={token} submitAction={submitBoothRegistration} />
        </div>
      </div>
    </div>
  );
}
