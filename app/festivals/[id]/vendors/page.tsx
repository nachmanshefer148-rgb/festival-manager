export const dynamic = "force-dynamic";
import {
  createVendor,
  createVendorContact,
  createVendorFile,
  createVendorPayment,
  createVendorVehicle,
  deleteVendor,
  deleteVendorContact,
  deleteVendorFile,
  deleteVendorPayment,
  deleteVendorVehicle,
  getVendorDetails,
  toggleVendorPayment,
  updateVendor,
  generateVendorsToken,
  bulkCreateVendors,
  createVendorCategory,
  updateVendorCategory,
  deleteVendorCategory,
} from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import VendorClient from "./VendorClient";

const DEFAULT_VENDOR_CATEGORIES = ["הפקה", "לוגיסטיקה", "מזון ומשקאות", "אבטחה/רפואה"];

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  const festival = await prisma.festival.findUnique({
    where: { id },
    select: { vendorsToken: true },
  });

  let categories = await prisma.vendorCategory.findMany({
    where: { festivalId: id },
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    await prisma.vendorCategory.createMany({
      data: DEFAULT_VENDOR_CATEGORIES.map((name) => ({ name, festivalId: id })),
    });
    categories = await prisma.vendorCategory.findMany({
      where: { festivalId: id },
      orderBy: { name: "asc" },
    });
  }

  const vendors = await prisma.vendor.findMany({
    where: { festivalId: id },
    select: {
      id: true,
      name: true,
      categoryId: true,
      notes: true,
      vendorToken: true,
      createdAt: true,
      festivalId: true,
      _count: {
        select: { contacts: true, vehicles: true, payments: true, files: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = vendors.map((vendor) => ({
    ...vendor,
    category: vendor.categoryId ?? "",
    createdAt: vendor.createdAt.toISOString(),
  }));

  return (
    <VendorClient
      festivalId={id}
      vendors={serialized}
      categories={categories}
      isAdmin={access.isAdmin}
      canAccessFiles={access.canViewDocuments}
      showFinancials={access.canViewBudget}
      vendorsToken={festival?.vendorsToken ?? null}
      createVendor={createVendor}
      updateVendor={updateVendor}
      deleteVendor={deleteVendor}
      getVendorDetails={getVendorDetails}
      createVendorContact={createVendorContact}
      deleteVendorContact={deleteVendorContact}
      createVendorVehicle={createVendorVehicle}
      deleteVendorVehicle={deleteVendorVehicle}
      createVendorPayment={createVendorPayment}
      toggleVendorPayment={toggleVendorPayment}
      deleteVendorPayment={deleteVendorPayment}
      createVendorFile={createVendorFile}
      deleteVendorFile={deleteVendorFile}
      generateVendorsToken={generateVendorsToken}
      bulkCreateVendors={bulkCreateVendors}
      createCategory={createVendorCategory}
      updateCategory={updateVendorCategory}
      deleteCategory={deleteVendorCategory}
    />
  );
}
