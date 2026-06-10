import type { ReactElement } from "react";
import { slugifyHeading } from "@/lib/content/slugify-heading";
import { cn } from "@/lib/utils/cn";

function HeadingAnchor({ id }: { id: string }): ReactElement {
  return (
    <a
      href={`#${id}`}
      aria-hidden="true"
      tabIndex={-1}
      className="text-subtle-foreground font-mono text-[0.75em] font-normal no-underline opacity-0 transition-opacity group-hover:opacity-100"
    >
      #
    </a>
  );
}

const baseClassName = "group text-foreground flex scroll-mt-28 items-baseline gap-2 font-medium";

export function H2({ children }: { children: string }): ReactElement {
  const id = slugifyHeading(children);
  return (
    <h2
      id={id}
      className={cn(baseClassName, "mt-8 text-2xl leading-tight tracking-tight first:mt-0")}
    >
      {children}
      <HeadingAnchor id={id} />
    </h2>
  );
}

export function H3({ children }: { children: string }): ReactElement {
  const id = slugifyHeading(children);
  return (
    <h3 id={id} className={cn(baseClassName, "mt-4 text-lg leading-snug")}>
      {children}
      <HeadingAnchor id={id} />
    </h3>
  );
}
