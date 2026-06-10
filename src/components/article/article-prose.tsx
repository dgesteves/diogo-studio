import type { ReactElement } from "react";
import { RichText } from "./rich-text";

export function ArticleParagraph({ text }: { text: string }): ReactElement {
  return (
    <p className="text-foreground text-base leading-7 text-pretty">
      <RichText text={text} />
    </p>
  );
}

export function ArticleList({ items }: { items: readonly string[] }): ReactElement {
  return (
    <ul className="marker:text-subtle-foreground flex list-disc flex-col gap-1.5 pl-5">
      {items.map((item) => (
        <li key={item} className="text-foreground text-base leading-7 text-pretty">
          <RichText text={item} />
        </li>
      ))}
    </ul>
  );
}

export function ArticleQuote({ text }: { text: string }): ReactElement {
  return (
    <blockquote className="border-accent text-muted-foreground border-l-2 pl-4 text-base leading-7">
      <RichText text={text} />
    </blockquote>
  );
}
