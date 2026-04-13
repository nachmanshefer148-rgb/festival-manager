export const dynamic = 'force-dynamic';
import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "נדרשת התחברות כדי לצפות בקובץ" }, { status: 403 });
  }

  const pathname = req.nextUrl.searchParams.get("pathname");
  if (!pathname) {
    return NextResponse.json({ error: "חסר נתיב לקובץ" }, { status: 400 });
  }

  const blob = await get(pathname, { access: "private", useCache: false });
  if (!blob || !blob.stream) {
    return NextResponse.json({ error: "הקובץ לא נמצא" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    status: 200,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": blob.blob.contentType ?? "application/octet-stream",
    },
  });
}
