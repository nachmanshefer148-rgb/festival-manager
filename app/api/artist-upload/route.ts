export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
];

const MAX_SIZE = 10 * 1024 * 1024;

function getExtension(filename: string): string {
  const clean = filename.trim().toLowerCase();
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) return "";
  const ext = clean.slice(lastDot).replace(/[^a-z0-9.]/g, "");
  return ext.length <= 10 ? ext : "";
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "חסר טוקן אמן" }, { status: 400 });
  }

  const artist = await prisma.artist.findUnique({
    where: { artistToken: token },
    select: { id: true },
  });

  if (!artist) {
    return NextResponse.json({ error: "לינק לא תקין" }, { status: 403 });
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

  const filename = `${randomUUID()}${getExtension(file.name)}`;
  const blob = await put(`artist-files/${filename}`, file, {
    access: "private",
    contentType: file.type,
  });

  return NextResponse.json({
    url: `/api/files?pathname=${encodeURIComponent(blob.pathname)}`,
  });
}
