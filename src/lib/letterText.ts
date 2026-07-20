/** Plain-text preview helper — turns image markdown into alt text. */
export function letterBodyPreview(body: string, max = 110): string {
  const plain = body
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}
