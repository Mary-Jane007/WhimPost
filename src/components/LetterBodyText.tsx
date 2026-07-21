"use client";

import type { ReactNode } from "react";
import { COLLECTIBLE_META } from "@/lib/villages";

/** Unique emoji → custom collectible image (skips shared glyphs like 🍄 / 🦋). */
const EMOJI_ICON_MAP: Record<string, string> = (() => {
  const counts = new Map<string, number>();
  const byEmoji = new Map<string, string>();
  for (const meta of Object.values(COLLECTIBLE_META)) {
    if (!meta.image) continue;
    counts.set(meta.emoji, (counts.get(meta.emoji) || 0) + 1);
    byEmoji.set(meta.emoji, meta.image);
  }
  const unique: Record<string, string> = {};
  for (const [emoji, src] of byEmoji) {
    if ((counts.get(emoji) || 0) === 1) unique[emoji] = src;
  }
  return unique;
})();

const ESCAPED_EMOJIS = Object.keys(EMOJI_ICON_MAP)
  .sort((a, b) => b.length - a.length)
  .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

function InlineIcon({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="letter-inline-icon"
      draggable={false}
    />
  );
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const emojiAlt = ESCAPED_EMOJIS.length
    ? `|(${ESCAPED_EMOJIS.join("|")})`
    : "";
  const re = new RegExp(
    `!\\[([^\\]]*)\\]\\(([^)]+)\\)|\\*\\*(.+?)\\*\\*|\\*(.+?)\\*${emojiAlt}`,
    "g"
  );
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      parts.push(
        <InlineIcon key={`img-${key++}`} src={match[2]} alt={match[1]} />
      );
    } else if (match[3] !== undefined) {
      parts.push(<strong key={`b-${key++}`}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      parts.push(<em key={`i-${key++}`}>{match[4]}</em>);
    } else if (match[5] !== undefined && EMOJI_ICON_MAP[match[5]]) {
      parts.push(
        <InlineIcon
          key={`e-${key++}`}
          src={EMOJI_ICON_MAP[match[5]]}
          alt=""
        />
      );
    } else {
      parts.push(match[0]);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

/** Renders letter body with light markdown: images, **bold**, *italic*, and * lists. */
export function LetterBodyText({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return (
    <div className="letter-body-display">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.length > 0);
        const listItems = lines.filter((l) => /^\s*[\*\-•]\s+/.test(l));
        const isList =
          listItems.length > 0 && listItems.length === lines.length;

        if (isList) {
          return (
            <ul key={i} className="letter-body-list">
              {lines.map((line, j) => (
                <li key={j}>
                  {renderInline(line.replace(/^\s*[\*\-•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="letter-body-para">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export { letterBodyPreview } from "@/lib/letterText";
