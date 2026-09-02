import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  ANNOTATION_INKS,
  createAnnotation,
  deleteAnnotation,
  listAnnotations,
  type AnnotationInk,
} from "@/lib/libraryReading";
import { canAccessVillageWorkshop } from "@/lib/villages";

export const runtime = "nodejs";

async function requireLibraryUser() {
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

/** List the signed-in villager's margin notes for a book. */
export async function GET(req: NextRequest) {
  const gate = await requireLibraryUser();
  if ("error" in gate) return gate.error;

  const bookId = String(req.nextUrl.searchParams.get("bookId") || "").trim();
  if (!bookId) return jsonError("bookId required");

  return NextResponse.json({
    annotations: listAnnotations(gate.user.id, bookId),
    inks: ANNOTATION_INKS,
  });
}

/** Leave a whimsical margin annotation at the current reading place. */
export async function POST(req: NextRequest) {
  const gate = await requireLibraryUser();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const bookId = String(body.bookId || "").trim();
  const note = String(body.body || "").trim();
  if (!bookId || !note) return jsonError("Book and note are required");

  const inkRaw = String(body.ink || "moss");
  const ink = (
    ANNOTATION_INKS.some((i) => i.id === inkRaw) ? inkRaw : "moss"
  ) as AnnotationInk;

  try {
    const annotation = createAnnotation({
      userId: gate.user.id,
      bookId,
      cfi: body.cfi ? String(body.cfi) : null,
      pageLabel: String(body.pageLabel || ""),
      percent: Number(body.percent) || 0,
      selectedText: String(body.selectedText || ""),
      body: note,
      ink,
    });
    return NextResponse.json({
      annotation,
      annotations: listAnnotations(gate.user.id, bookId),
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Could not save annotation",
      400
    );
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireLibraryUser();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "").trim();
  if (!id) return jsonError("Annotation id required");

  const ok = deleteAnnotation(gate.user.id, id);
  if (!ok) return jsonError("Annotation not found", 404);

  const bookId = String(body?.bookId || "").trim();
  return NextResponse.json({
    ok: true,
    annotations: bookId ? listAnnotations(gate.user.id, bookId) : [],
  });
}
