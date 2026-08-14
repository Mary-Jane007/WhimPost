import path from "path";

/** Shared upload directory — leaf path constant (no app imports). */
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
