import { prisma } from "@/lib/prisma";
import { submitVendorForm } from "@/app/actions";
import VendorForm from "./VendorForm";

export default async function VendorFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { vendorToken: token },
    include: {
      festival: { select: { name: true } },
      contacts: true,
      vehicles: true,
    },
  });

  if (!vendor) {
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
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{vendor.festival.name}</p>
          <p className="text-gray-400 text-xs mt-1">מלא/י את פרטי אנשי הקשר והרכבים שלך</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <VendorForm
            token={token}
            initialContacts={vendor.contacts}
            initialVehicles={vendor.vehicles}
            submitAction={submitVendorForm}
          />
        </div>
      </div>
    </div>
  );
}
