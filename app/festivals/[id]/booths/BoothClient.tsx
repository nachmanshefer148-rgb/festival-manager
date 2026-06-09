"use client";

import EntityClient, { EntityConfig, EntityActions, EntitySummary, EntityApplication } from "@/app/components/EntityClient";
import ExcelImportModal from "@/app/components/ExcelImportModal";
import { Download } from "lucide-react";
import { mapColumn, buildWorkbook, downloadWorkbook, generateTemplate } from "@/lib/excel-utils";
import { bulkCreateBooths, BulkBoothItem } from "@/app/actions/booths";

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

const TEMPLATE_HEADERS = ["שם", "קטגוריה", "הערות", "איש קשר", "טלפון", "מייל", "רישוי רכב"];
const PREVIEW_COLUMNS = [
  { label: "שם", key: "שם" },
  { label: "קטגוריה", key: "קטגוריה" },
  { label: "איש קשר", key: "איש קשר" },
  { label: "טלפון", key: "טלפון" },
];

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

export default function BoothClient({
  booths, applications, boothsToken, getBoothDetails, generateBoothsToken,
  approveBoothApplication, rejectBoothApplication,
  createBooth, updateBooth, deleteBooth,
  createBoothContact, deleteBoothContact, createBoothVehicle, deleteBoothVehicle,
  createBoothPayment, toggleBoothPayment, deleteBoothPayment,
  createBoothFile, deleteBoothFile,
  ...rest
}: Props) {
  const items: EntitySummary[] = booths.map(({ boothToken, ...b }) => ({ ...b, token: boothToken }));
  const apps: EntityApplication[] = applications.map(({ boothName, ...a }) => ({ ...a, name: boothName }));
  const { festivalId, isAdmin } = rest;

  const actions: EntityActions = {
    create: createBooth,
    update: updateBooth,
    delete: deleteBooth,
    getDetails: async (id, fid) => {
      const d = await getBoothDetails(id, fid);
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

  async function handleImport(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
    const mapped: BulkBoothItem[] = rows.map((row) => ({
      name: mapColumn(row, ["שם", "name", "דוכן", "booth"]),
      category: mapColumn(row, ["קטגוריה", "category", "סוג", "type"]) || undefined,
      notes: mapColumn(row, ["הערות", "notes", "comment"]) || undefined,
      contactName: mapColumn(row, ["איש קשר", "contact", "נציג"]) || undefined,
      contactPhone: mapColumn(row, ["טלפון", "phone", "נייד"]) || undefined,
      contactEmail: mapColumn(row, ["מייל", "email"]) || undefined,
      vehiclePlate: mapColumn(row, ["רישוי רכב", "plate", "רישוי"]) || undefined,
    }));
    const r = await bulkCreateBooths(festivalId, mapped);
    return { imported: r.created, skipped: r.skipped };
  }

  function handleExport() {
    const rows = items.map((item) => ({
      "שם": item.name,
      "קטגוריה": BOOTH_CONFIG.categories[item.category]?.label ?? item.category,
      "הערות": item.notes ?? "",
      "אנשי קשר": item._count.contacts,
      "רכבים": item._count.vehicles,
    }));
    const data = buildWorkbook(["שם", "קטגוריה", "הערות", "אנשי קשר", "רכבים"], rows);
    downloadWorkbook("booths.xlsx", data);
  }

  const extraButtons = isAdmin ? (
    <>
      <ExcelImportModal
        entityLabel="דוכנים"
        templateHeaders={TEMPLATE_HEADERS}
        templateFilename="template-booths.xlsx"
        previewColumns={PREVIEW_COLUMNS}
        onImport={handleImport}
      />
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        ייצא אקסל
      </button>
      <button
        type="button"
        onClick={() => generateTemplate("template-booths.xlsx", TEMPLATE_HEADERS)}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        תבנית ריקה
      </button>
    </>
  ) : null;

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
      extraHeaderButtons={extraButtons}
    />
  );
}
