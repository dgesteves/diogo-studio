export type InlineSpan =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string };

const INLINE_PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index;
    if (index > lastIndex) {
      spans.push({ type: "text", text: text.slice(lastIndex, index) });
    }
    const [full, strong, em, code, linkText, linkHref] = match;
    if (strong !== undefined) spans.push({ type: "strong", text: strong });
    else if (em !== undefined) spans.push({ type: "em", text: em });
    else if (code !== undefined) spans.push({ type: "code", text: code });
    else if (linkText !== undefined && linkHref !== undefined) {
      spans.push({ type: "link", text: linkText, href: linkHref });
    }
    lastIndex = index + full.length;
  }
  if (lastIndex < text.length) {
    spans.push({ type: "text", text: text.slice(lastIndex) });
  }
  return spans;
}

export function stripInlineMarkup(text: string): string {
  return parseInline(text)
    .map((span) => span.text)
    .join("");
}
