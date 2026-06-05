"use client";

import EntityClient, { EntityConfig, EntityActions, EntitySummary } from "@/app/components/EntityClient";

const VENDOR_CONFIG: EntityConfig = {
  singularLabel: "ספק",
  pluralLabel: "ספקים",
  emptyIcon: "🏢",
  tokenPathPrefix: "/vendor/",
  uploadFolder: "vendor-files",
  categories: {
    production: { label: "הפקה", color: "bg-violet-100 text-violet-700" },
    logistics: { label: "לוגיסטיקה", color: "bg-blue-100 text-blue-700" },
    food: { label: "מזון ומשקאות", color: "bg-green-100 text-green-700" },
    security: { label: "אבטחה/רפואה", color: "bg-red-100 text-red-700" },
  },
};

interface Props {
  festivalId: string;
  vendors: (Omit<EntitySummary, "token"> & { vendorToken: string })[];
  isAdmin: boolean;
  canAccessFiles?: boolean;
  showFinancials?: boolean;
  createVendor: (fd: FormData) => Promise<void>;
  updateVendor: (id: string, fd: FormData) => Promise<void>;
  deleteVendor: (id: string, festivalId: string) => Promise<void>;
  getVendorDetails: (id: string, festivalId: string) => Promise<any>;
  createVendorContact: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorContact: (id: string, festivalId: string) => Promise<void>;
  createVendorVehicle: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteVendorVehicle: (id: string, festivalId: string) => Promise<void>;
  createVendorPayment: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleVendorPayment: (id: string, festivalId: string) => Promise<void>;
  deleteVendorPayment: (id: string, festivalId: string) => Promise<void>;
  createVendorFile: (entityId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteVendorFile: (id: string, festivalId: string) => Promise<void>;
}

export default function VendorClient({ vendors, getVendorDetails, createVendor, updateVendor, deleteVendor, createVendorContact, deleteVendorContact, createVendorVehicle, deleteVendorVehicle, createVendorPayment, toggleVendorPayment, deleteVendorPayment, createVendorFile, deleteVendorFile, ...rest }: Props) {
  const items: EntitySummary[] = vendors.map(({ vendorToken, ...v }) => ({ ...v, token: vendorToken }));

  const actions: EntityActions = {
    create: createVendor,
    update: updateVendor,
    delete: deleteVendor,
    getDetails: async (id, festivalId) => {
      const d = await getVendorDetails(id, festivalId);
      if (!d) return null;
      const { vendorToken, ...rest } = d;
      return { ...rest, token: vendorToken };
    },
    createContact: createVendorContact,
    deleteContact: deleteVendorContact,
    createVehicle: createVendorVehicle,
    deleteVehicle: deleteVendorVehicle,
    createPayment: createVendorPayment,
    togglePayment: toggleVendorPayment,
    deletePayment: deleteVendorPayment,
    createFile: createVendorFile,
    deleteFile: deleteVendorFile,
  };

  return (
    <EntityClient
      {...rest}
      items={items}
      config={VENDOR_CONFIG}
      actions={actions}
    />
  );
}
