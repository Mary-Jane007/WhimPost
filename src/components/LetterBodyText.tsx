"use client";

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={`b-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={`i-${key++}`}>{match[2]}</em>);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

/** Renders letter body with light markdown: **bold**, *italic*, and * lists. */
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
