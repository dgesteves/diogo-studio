import Link from "next/link";
import type { ReactNode } from "react";
import { asInternalHref } from "@/content/pages";

export function renderFormatting(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      out.push(text.slice(lastIndex, m.index));
    }
    if (m[1] !== undefined) {
      out.push(
        <strong key={`${keyPrefix}-b${idx++}`} className="text-foreground font-semibold">
          {m[1]}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      out.push(
        <code
          key={`${keyPrefix}-c${idx++}`}
          className="bg-surface-inset text-foreground rounded px-1 py-0.5 font-mono text-[0.85em]"
        >
          {m[2]}
        </code>,
      );
    } else if (m[3] !== undefined && m[4] !== undefined) {
      const label = m[3];
      const key = `${keyPrefix}-l${idx++}`;
      const safeHref = sanitizeHref(m[4]);
      const internalHref = safeHref ? asInternalHref(safeHref) : null;
      if (!safeHref) {
        out.push(label);
      } else if (internalHref) {
        out.push(
          <Link key={key} href={internalHref} className="text-accent hover:underline">
            {label}
          </Link>,
        );
      } else if (safeHref.startsWith("#")) {
        out.push(
          <a key={key} href={safeHref} className="text-accent hover:underline">
            {label}
          </a>,
        );
      } else if (safeHref.startsWith("/")) {
        out.push(label);
      } else {
        out.push(
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {label}
          </a>,
        );
      }
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex));
  }
  return out;
}

function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const { protocol } = new URL(trimmed);
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") return trimmed;
  } catch {
    return null;
  }
  return null;
}
