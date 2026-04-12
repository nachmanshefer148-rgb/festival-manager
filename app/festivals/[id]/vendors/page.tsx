export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRole } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import {
  createVendor,
  updateVendor,
  deleteVendor,
  createVendorContact,
  deleteVendorContact,
  createVendorVehicle,
  deleteVendorVehicle,
  createVendorPayment,
  toggleVendorPayment,
  deleteVendorPayment,
  createVendorFile,
  deleteVendorFile,
  getVendorDetails,
} from "@/app/actions";
import VendorClient from "./VendorClient";

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [festival, role, settings] = await Promise.all([
    prisma.festival.findUnique({ where: { id } }),
    getRole(),
    getAppSettings(),
  ]);

  if (!festival) notFound();

  // Fetch only summary fields + counts — no nested contacts/vehicles/payments/files
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

  const serialized = vendors.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  const showFinancials = role !== "limited" || (settings?.showBudget ?? true);

  return (
    <VendorClient
      festivalId={id}
      vendors={serialized}
      isAdmin={role === "admin"}
      showFinancials={showFinancials}
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
