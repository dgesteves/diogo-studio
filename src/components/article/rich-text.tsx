import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { parseInline, type InlineSpan } from "@/lib/content/parse-inline";

const linkClassName =
  "text-foreground underline decoration-accent/60 decoration-1 underline-offset-[3px] transition-colors hover:decoration-accent";

function renderSpan(span: InlineSpan, key: number): ReactNode {
  switch (span.type) {
    case "text":
      return span.text;
    case "strong":
      return (
        <strong key={key} className="text-foreground font-medium">
          {span.text}
        </strong>
      );
    case "em":
      return <em key={key}>{span.text}</em>;
    case "code":
      return (
        <code
          key={key}
          className="bg-code-bg text-code-foreground border-border rounded border px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {span.text}
        </code>
      );
    case "link":
      return span.href.startsWith("/") || span.href.startsWith("#") ? (
        <Link key={key} href={span.href} className={linkClassName}>
          {span.text}
        </Link>
      ) : (
        <a
          key={key}
          href={span.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {span.text}
        </a>
      );
  }
}

export function RichText({ text }: { text: string }): ReactElement {
  return <>{parseInline(text).map(renderSpan)}</>;
}
