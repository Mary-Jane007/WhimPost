import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyLibraryAction,
  getLibraryProgress,
  type LibraryAction,
} from "@/lib/library";
import { chronicleAfterActivity } from "@/lib/chronicle";
import type { ChronicleActivityKey } from "@/lib/chronicleContent";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import { canAccessVillageWorkshop } from "@/lib/villages";

async function requireLibraryUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (!canAccessVillageWorkshop(user, "mosshollow")) {
    return {
      error: jsonError(
        "The Grand Library is only for Mosshollow villagers — visitors cannot participate",
        403
      ),
    };
  }
  return { user };
}

const LIBRARY_KEYS: Partial<
  Record<LibraryAction["type"], ChronicleActivityKey>
> = {
  finishBook: "library.finishBook",
  solveMystery: "library.solveMystery",
  claimSecret: "library.claimSecret",
  journalEntry: "library.journalEntry",
};

function parseLibraryAction(
  fields: Record<string, string>
): LibraryAction | null {
  const type = fields.type;
  if (!type) return null;

  if (type === "wishlist") {
    const bookId = String(fields.bookId || "").trim();
    if (!bookId) return null;
    const onRaw = String(fields.on || "1").toLowerCase();
    const on = !(onRaw === "0" || onRaw === "false" || onRaw === "off");
    return { type: "wishlist", bookId, on };
  }

  if (type === "readingStatus") {
    const bookId = String(fields.bookId || "").trim();
    const status = String(fields.status || "") as
      | "none"
      | "reading"
      | "finished";
    if (!bookId || !["none", "reading", "finished"].includes(status)) {
      return null;
    }
    return { type: "readingStatus", bookId, status };
  }

  if (type === "finishBook") {
    const bookId = String(fields.bookId || "").trim();
    if (!bookId) return null;
    return {
      type: "finishBook",
      bookId,
      reflection: fields.reflection,
      quote: fields.quote,
    };
  }

  if (type === "bookProgress") {
    const bookId = String(fields.bookId || "").trim();
    const percent = Number(fields.percent);
    if (!bookId || !Number.isFinite(percent)) return null;
    return { type: "bookProgress", bookId, percent };
  }

  return null;
}

export async function GET() {
  const gate = await requireLibraryUser();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ progress: getLibraryProgress(gate.user.id) });
}

export async function POST(req: NextRequest) {
  const gate = await requireLibraryUser();
  if ("error" in gate) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return gate.error;
  }

  const contentType = req.headers.get("content-type") || "";
  let action: LibraryAction | null = null;
  let nextPath = "/library";

  if (contentType.includes("application/json")) {
    action = (await req.json().catch(() => null)) as LibraryAction | null;
  } else {
    const fields = await readRequestFields(req);
    action = parseLibraryAction(fields);
    const nextRaw = fields.next || "/library";
    nextPath =
      nextRaw.startsWith("/") && !nextRaw.startsWith("//")
        ? nextRaw
        : "/library";
  }

  if (!action || !action.type) {
    return jsonError("Expected a library action");
  }

  const { progress, grantedCollectibles } = applyLibraryAction(
    gate.user.id,
    action
  );
  const key = LIBRARY_KEYS[action.type];
  const chronicleUnlock = key
    ? chronicleAfterActivity(gate.user.id, gate.user.villageId, key)
    : null;

  if (wantsHtmlRedirect(req)) {
    return redirectSameHost(req, nextPath);
  }
  return NextResponse.json({ progress, grantedCollectibles, chronicleUnlock });
}
