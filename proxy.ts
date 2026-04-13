import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

// Edge-safe: just extract the role prefix without HMAC (full verification happens server-side)
function getRoleFromCookie(cookieValue?: string): string {
  if (!cookieValue) return "limited";
  const role = cookieValue.split(".")[0];
  if (role === "admin" || role === "viewer") return role;
  return "limited";
}

export function proxy(req: NextRequest) {
  const role = getRoleFromCookie(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/settings") && role !== "admin") {
    return NextResponse.redirect(new URL("/login?from=settings", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*"],
};
