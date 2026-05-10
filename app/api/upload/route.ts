export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { getRole } from "@/lib/auth";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const FOLDER_CONFIG = {
  "artist-images": { access: "public", storageFolder: "artist-images" },
  "artist-files": { access: "private", storageFolder: "artist-files" },
  "stage-files": { access: "private", storageFolder: "stage-files" },
  "festival-files": { access: "private", storageFolder: "festival-files" },
  "vendor-files": { access: "private", storageFolder: "vendor-files" },
  "festival-logo": { access: "public", storageFolder: "festival-logo" },
} as const;

type UploadFolder = keyof typeof FOLDER_CONFIG;

function isUploadFolder(value: string): value is UploadFolder {
  return value in FOLDER_CONFIG;
}

function getExtension(filename: string): string {
  const clean = filename.trim().toLowerCase();
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) return "";
  const ext = clean.slice(lastDot).replace(/[^a-z0-9.]/g, "");
  return ext.length <= 10 ? ext : "";
}

export async function POST(req: NextRequest) {
  const role = await getRole();
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "לא נשלח קובץ" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 10MB)" }, { status: 400 });
  }

  const rawFolder = new URL(req.url).searchParams.get("folder") ?? "vendor-files";
  if (!isUploadFolder(rawFolder)) {
    return NextResponse.json({ error: "יעד העלאה לא תקין" }, { status: 400 });
  }

  const folder = FOLDER_CONFIG[rawFolder];
  const filename = `${randomUUID()}${getExtension(file.name)}`;

  const blob = await put(`${folder.storageFolder}/${filename}`, file, {
    access: folder.access,
    contentType: file.type,
  });

  const url =
    folder.access === "private"
      ? `/api/files?pathname=${encodeURIComponent(blob.pathname)}`
      : blob.url;

  return NextResponse.json({ url });
}
