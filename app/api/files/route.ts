export const dynamic = 'force-dynamic';
import { list } from "@vercel/blob";
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

  const { blobs } = await list({ prefix: pathname, limit: 1 });
  if (!blobs.length) {
    return NextResponse.json({ error: "הקובץ לא נמצא" }, { status: 404 });
  }

  return NextResponse.redirect(blobs[0].url);
}
