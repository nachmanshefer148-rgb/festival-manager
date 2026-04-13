import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUEST_SESSION_COOKIE, SESSION_COOKIE } from "@/lib/auth-constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const hasGuestSession = Boolean(req.cookies.get(GUEST_SESSION_COOKIE)?.value);

  if (!hasSession && !hasGuestSession && (pathname === "/" || pathname.startsWith("/festivals") || pathname.startsWith("/settings"))) {
    const from = pathname === "/" ? "" : `?from=${encodeURIComponent(pathname.slice(1))}`;
    return NextResponse.redirect(new URL(`/login${from}`, req.url));
  }

  // Guest viewers must not access the home page or settings — only /festivals/:id/*
  if (!hasSession && hasGuestSession && (pathname === "/" || pathname.startsWith("/settings"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/festivals/:path*", "/settings/:path*", "/forgot-password", "/reset-password/:path*"],
};
