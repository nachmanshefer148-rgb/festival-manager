import { cookies } from "next/headers";
import crypto from "crypto";
import { SESSION_COOKIE } from "@/lib/auth-constants";

export type Role = "admin" | "viewer" | "limited";

const secretFromEnv = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "production" && !secretFromEnv) {
  throw new Error("SESSION_SECRET must be set in production");
}

const SECRET = secretFromEnv ?? "dev-secret-change-in-production";

export function isAuthenticatedRole(role: Role): role is "admin" | "viewer" {
  return role === "admin" || role === "viewer";
}

function signValue(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function signRole(role: "admin" | "viewer"): string {
  const sig = signValue(role);
  return `${role}.${sig}`;
}

export function parseRole(cookieValue?: string): Role {
  if (!cookieValue) return "limited";
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return "limited";
  const role = cookieValue.slice(0, dotIdx);
  const sig = cookieValue.slice(dotIdx + 1);
  const expected = signValue(role);
  const sigBuffer = Buffer.from(sig, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return "limited";
  }

  if (role === "admin" || role === "viewer") return role;
  return "limited";
}

export async function getRole(): Promise<Role> {
  const jar = await cookies();
  return parseRole(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(role: "admin" | "viewer") {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signRole(role), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
