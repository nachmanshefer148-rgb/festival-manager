import { cookies } from "next/headers";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth-constants";

export type Role = "admin" | "limited";

const secretFromEnv = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "production" && !secretFromEnv) {
  throw new Error("SESSION_SECRET must be set in production");
}

const SECRET = secretFromEnv ?? "dev-secret-change-in-production";

function signValue(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function parseSession(cookieValue?: string): string | null {
  if (!cookieValue) return null;
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return null;

  const userId = cookieValue.slice(0, dotIdx);
  const sig = cookieValue.slice(dotIdx + 1);
  if (!userId || !sig) return null;

  const expected = signValue(userId);
  const sigBuffer = Buffer.from(sig, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  return userId;
}

export function signSession(userId: string): string {
  return `${userId}.${signValue(userId)}`;
}

export async function getCurrentUserId(): Promise<string | null> {
  const jar = await cookies();
  return parseSession(jar.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("נדרשת התחברות");
  return user;
}

export async function requireCurrentUserId() {
  const user = await requireCurrentUser();
  return user.id;
}

export async function requireCurrentUserPage(from?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(from ? `/login?from=${encodeURIComponent(from)}` : "/login");
  }
  return user;
}

export async function getRole(): Promise<Role> {
  return (await getCurrentUserId()) ? "admin" : "limited";
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
