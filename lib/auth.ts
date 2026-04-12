import { cookies } from "next/headers";
import crypto from "crypto";

export type Role = "admin" | "viewer" | "limited";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
const COOKIE = "fs-session";

export function signRole(role: "admin" | "viewer"): string {
  const sig = crypto.createHmac("sha256", SECRET).update(role).digest("hex");
  return `${role}.${sig}`;
}

export function parseRole(cookieValue?: string): Role {
  if (!cookieValue) return "limited";
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return "limited";
  const role = cookieValue.slice(0, dotIdx);
  const sig = cookieValue.slice(dotIdx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(role).digest("hex");
  if (sig !== expected) return "limited";
  if (role === "admin" || role === "viewer") return role;
  return "limited";
}

export async function getRole(): Promise<Role> {
  const jar = await cookies();
  return parseRole(jar.get(COOKIE)?.value);
}

export async function setSessionCookie(role: "admin" | "viewer") {
  const jar = await cookies();
  jar.set(COOKIE, signRole(role), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
