import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "./db";
import type { UserPublic } from "./types";

const COOKIE_NAME = "whimpost_session";
const secret = new TextEncoder().encode(
  process.env.WHIMPOST_SECRET || "whimpost-dev-secret-change-me-in-prod"
);

export interface SessionPayload {
  userId: string;
  username: string;
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { userId: payload.userId, username: payload.username } as SessionPayload;
  } catch {
    return null;
  }
}

/** True when the request reached us over HTTPS (direct or via preview proxy). */
async function requestIsHttps() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.VERCEL === "1") return true;
  if (process.env.WHIMPOST_HTTPS === "1" || process.env.WHIMPOST_HTTPS === "true") {
    return true;
  }
  try {
    const hdrs = await headers();
    const proto = (
      hdrs.get("x-forwarded-proto") ||
      hdrs.get("x-forwarded-protocol") ||
      ""
    )
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    if (proto === "https") return true;
    const host = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "").toLowerCase();
    // Cloud agent preview hosts are always HTTPS in the browser.
    if (host.includes(".agent.cvm.dev") || host.includes(".cursor.sh")) return true;
  } catch {
    // headers() unavailable outside a request — fall through
  }
  return false;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  // HTTP localhost must stay non-Secure + Lax or the browser drops the cookie.
  // HTTPS (including Cursor preview iframes) needs Secure + SameSite=None so the
  // session survives after login and the redirect to /village actually sticks.
  const secure = await requestIsHttps();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    ...(secure ? { partitioned: true } : {}),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function mapUser(row: {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  forest_name: string;
  created_at: string;
  is_owner?: number | boolean | null;
  village_id?: string | null;
  reputation?: number | null;
}): UserPublic {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio || "",
    forestName: row.forest_name || "",
    createdAt: row.created_at,
    isOwner: Boolean(row.is_owner),
    villageId: row.village_id || null,
    reputation: Number(row.reputation) || 0,
  };
}

export async function getCurrentUser(): Promise<UserPublic | null> {
  const session = await getSession();
  if (!session) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, reputation
       FROM users WHERE id = ?`
    )
    .get(session.userId) as
    | {
        id: string;
        username: string;
        display_name: string;
        bio: string;
        forest_name: string;
        created_at: string;
        is_owner: number;
        village_id: string | null;
        reputation: number;
      }
    | undefined;
  if (!row) return null;
  return mapUser(row);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
