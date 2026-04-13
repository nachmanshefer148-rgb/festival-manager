import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signGuestSession } from "@/lib/auth";
import { GUEST_SESSION_COOKIE } from "@/lib/auth-constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const festival = await prisma.festival.findFirst({
    where: { viewerToken: token, viewerAccessEnabled: true },
    select: { id: true, viewerShowBudget: true, viewerShowDocuments: true },
  });

  if (!festival) {
    return new NextResponse("לינק לא תקין", { status: 404 });
  }

  const cookieValue = signGuestSession({
    festivalId: festival.id,
    showBudget: festival.viewerShowBudget,
    showDocuments: festival.viewerShowDocuments,
  });

  const response = NextResponse.redirect(
    new URL(`/festivals/${festival.id}`, request.url)
  );

  response.cookies.set(GUEST_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
  });

  return response;
}
