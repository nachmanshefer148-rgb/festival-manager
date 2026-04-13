import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && (pathname === "/" || pathname.startsWith("/festivals") || pathname.startsWith("/settings"))) {
    const from = pathname === "/" ? "" : `?from=${encodeURIComponent(pathname.slice(1))}`;
    return NextResponse.redirect(new URL(`/login${from}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/festivals/:path*", "/settings/:path*"],
};
