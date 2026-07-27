import { NextRequest, NextResponse } from "next/server";

/** Read JSON or HTML form bodies so buttons work without client JS. */
export async function readRequestFields(
  req: NextRequest
): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (value == null) continue;
      out[key] = String(value);
    }
    return out;
  }
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData().catch(() => null);
    if (!form) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  }
  // Some browsers omit content-type on tiny POSTs — try form, then JSON.
  const form = await req
    .clone()
    .formData()
    .catch(() => null);
  if (form) {
    const out: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") out[key] = value;
    }
    if (Object.keys(out).length) return out;
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value == null) continue;
    out[key] = String(value);
  }
  return out;
}

export function wantsHtmlRedirect(req: NextRequest): boolean {
  const mode = req.headers.get("sec-fetch-mode") || "";
  // fetch()/XHR — keep JSON responses even for multipart uploads.
  if (mode === "cors" || mode === "same-origin" || mode === "no-cors") {
    return false;
  }
  if (mode === "navigate" || mode === "nested-navigate") return true;

  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return false;
  }
  const contentType = req.headers.get("content-type") || "";
  if (
    (contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")) &&
    accept.includes("text/html")
  ) {
    return true;
  }
  return accept.includes("text/html") && !accept.includes("application/json");
}

/**
 * Prefer a relative Location so the browser stays on the host it already
 * used (127.0.0.1 vs localhost). Absolute redirects from nextUrl can flip
 * hosts and drop the session cookie.
 */
export function redirectSameHost(_req: NextRequest, path: string) {
  const safe =
    path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return new NextResponse(null, {
    status: 303,
    headers: { Location: safe },
  });
}
