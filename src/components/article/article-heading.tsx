import type { ReactElement } from "react";
import { slugifyHeading } from "@/lib/content/slugify-heading";
import { cn } from "@/lib/utils/cn";

export function ArticleHeading({ level, text }: { level: 2 | 3; text: string }): ReactElement {
  const id = slugifyHeading(text);
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag
      id={id}
      className={cn(
        "group text-foreground flex scroll-mt-28 items-baseline gap-2 font-medium",
        level === 2
          ? "mt-8 text-2xl leading-tight tracking-tight first:mt-0"
          : "mt-4 text-lg leading-snug",
      )}
    >
      {text}
      <a
        href={`#${id}`}
        aria-hidden="true"
        tabIndex={-1}
        className="text-subtle-foreground font-mono text-[0.75em] font-normal no-underline opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        #
      </a>
    </Tag>
  );
}
