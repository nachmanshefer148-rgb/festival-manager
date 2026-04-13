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
} from "@/app/actions";
import { requireFestivalAccessPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import VendorClient from "./VendorClient";

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireFestivalAccessPage(id);

  const vendors = await prisma.vendor.findMany({
    where: { festivalId: id },
    select: {
      id: true,
      name: true,
      category: true,
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
    createdAt: vendor.createdAt.toISOString(),
  }));

  return (
    <VendorClient
      festivalId={id}
      vendors={serialized}
      isAdmin={access.isAdmin}
      canAccessFiles={access.canViewDocuments}
      showFinancials={access.canViewBudget}
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
    />
  );
}
