export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
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

export async function POST(req: NextRequest) {
  const role = await getRole();
  if (role !== "admin") {
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

  const rawFolder = new URL(req.url).searchParams.get("folder") ?? "vendors";
  const folder = rawFolder.replace(/[^a-z0-9_-]/gi, "") || "vendors";

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;

  const blob = await put(`${folder}/${filename}`, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
