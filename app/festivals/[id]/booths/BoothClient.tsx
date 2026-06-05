"use client";

import EntityClient, { EntityConfig, EntityActions, EntitySummary, EntityApplication } from "@/app/components/EntityClient";

const BOOTH_CONFIG: EntityConfig = {
  singularLabel: "דוכן",
  pluralLabel: "דוכנים",
  emptyIcon: "🛒",
  tokenPathPrefix: "/booth/",
  uploadFolder: "booth-files",
  categories: {
    food: { label: "אוכל ושתייה", color: "bg-green-100 text-green-700" },
    merch: { label: "מרצ'נדייז", color: "bg-violet-100 text-violet-700" },
    activities: { label: "פעילויות ומשחקים", color: "bg-yellow-100 text-yellow-700" },
    art: { label: "אמנות ויצירה", color: "bg-pink-100 text-pink-700" },
    services: { label: "שירותים אחרים", color: "bg-blue-100 text-blue-700" },
  },
};

interface Props {
  festivalId: string;
  booths: (Omit<EntitySummary, "token"> & { boothToken: string })[];
  applications: (Omit<EntityApplication, "name"> & { boothName: string })[];
  boothsToken: string | null;
  isAdmin: boolean;
  canAccessFiles?: boolean;
  showFinancials?: boolean;
  createBooth: (fd: FormData) => Promise<void>;
  updateBooth: (id: string, fd: FormData) => Promise<void>;
  deleteBooth: (id: string, festivalId: string) => Promise<void>;
  getBoothDetails: (id: string, festivalId: string) => Promise<any>;
  generateBoothsToken: (festivalId: string) => Promise<string>;
  approveBoothApplication: (id: string, festivalId: string) => Promise<void>;
  rejectBoothApplication: (id: string, festivalId: string) => Promise<void>;
  createBoothContact: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteBoothContact: (id: string, festivalId: string) => Promise<void>;
  createBoothVehicle: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  deleteBoothVehicle: (id: string, festivalId: string) => Promise<void>;
  createBoothPayment: (entityId: string, festivalId: string, fd: FormData) => Promise<void>;
  toggleBoothPayment: (id: string, festivalId: string) => Promise<void>;
  deleteBoothPayment: (id: string, festivalId: string) => Promise<void>;
  createBoothFile: (entityId: string, festivalId: string, name: string, url: string, isExternal: boolean, fileType: string) => Promise<void>;
  deleteBoothFile: (id: string, festivalId: string) => Promise<void>;
}

export default function BoothClient({ booths, applications, boothsToken, getBoothDetails, generateBoothsToken, approveBoothApplication, rejectBoothApplication, createBooth, updateBooth, deleteBooth, createBoothContact, deleteBoothContact, createBoothVehicle, deleteBoothVehicle, createBoothPayment, toggleBoothPayment, deleteBoothPayment, createBoothFile, deleteBoothFile, ...rest }: Props) {
  const items: EntitySummary[] = booths.map(({ boothToken, ...b }) => ({ ...b, token: boothToken }));
  const apps: EntityApplication[] = applications.map(({ boothName, ...a }) => ({ ...a, name: boothName }));

  const actions: EntityActions = {
    create: createBooth,
    update: updateBooth,
    delete: deleteBooth,
    getDetails: async (id, festivalId) => {
      const d = await getBoothDetails(id, festivalId);
      if (!d) return null;
      const { boothToken, ...rest } = d;
      return { ...rest, token: boothToken };
    },
    createContact: createBoothContact,
    deleteContact: deleteBoothContact,
    createVehicle: createBoothVehicle,
    deleteVehicle: deleteBoothVehicle,
    createPayment: createBoothPayment,
    togglePayment: toggleBoothPayment,
    deletePayment: deleteBoothPayment,
    createFile: createBoothFile,
    deleteFile: deleteBoothFile,
  };

  return (
    <EntityClient
      {...rest}
      items={items}
      config={BOOTH_CONFIG}
      actions={actions}
      applications={apps}
      registrationToken={boothsToken}
      generateRegistrationToken={generateBoothsToken}
      approveApplication={approveBoothApplication}
      rejectApplication={rejectBoothApplication}
    />
  );
}
