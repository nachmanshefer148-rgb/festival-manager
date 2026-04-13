import { cookies } from "next/headers";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GUEST_SESSION_COOKIE, SESSION_COOKIE } from "@/lib/auth-constants";

export type Role = "super_admin" | "admin" | "limited";
export type FestivalViewerPermissions = {
  festivalId: string;
  showBudget: boolean;
  showDocuments: boolean;
};

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

export function signGuestSession(payload: FestivalViewerPermissions): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signValue(encodedPayload)}`;
}

function parseGuestSession(cookieValue?: string): FestivalViewerPermissions | null {
  if (!cookieValue) return null;
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx === -1) return null;

  const encodedPayload = cookieValue.slice(0, dotIdx);
  const sig = cookieValue.slice(dotIdx + 1);
  if (!encodedPayload || !sig) return null;

  const expected = signValue(encodedPayload);
  const sigBuffer = Buffer.from(sig, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as FestivalViewerPermissions;
    if (!parsed?.festivalId) return null;
    return {
      festivalId: parsed.festivalId,
      showBudget: Boolean(parsed.showBudget),
      showDocuments: Boolean(parsed.showDocuments),
    };
  } catch {
    return null;
  }
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
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
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
  const user = await getCurrentUser();
  if (user?.role === "SUPER_ADMIN") return "super_admin";
  if (user) return "admin";
  return "limited";
}

export async function getGuestFestivalPermissions() {
  const jar = await cookies();
  return parseGuestSession(jar.get(GUEST_SESSION_COOKIE)?.value);
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

export async function setGuestSessionCookie(payload: FestivalViewerPermissions) {
  const jar = await cookies();
  jar.set(GUEST_SESSION_COOKIE, signGuestSession(payload), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(GUEST_SESSION_COOKIE);
}
