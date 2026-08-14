import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import { NextResponse } from "next/server";

/** Shared owner gate for admin routes/pages. */
export async function requireOwnerUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: jsonError("Sign in required", 401) };
  }
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return { error: jsonError("Owner access only", 403) };
  }
  return { user };
}

export function newId(prefix = "evt") {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
