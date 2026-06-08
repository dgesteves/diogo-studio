import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function NextArticleLink({
  href,
  eyebrow,
  title,
  subtitle,
}: {
  href: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}): ReactElement {
  return (
    <Link
      href={href}
      className="border-border bg-surface hover:border-accent/40 hover:bg-surface-muted/60 group flex items-center justify-between gap-4 rounded-lg border p-5 transition-all"
    >
      <div className="flex flex-col gap-1">
        <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
          {eyebrow}
        </span>
        <span className="text-foreground text-base font-medium tracking-tight">{title}</span>
        <span className="text-muted-foreground text-xs">{subtitle}</span>
      </div>
      <ArrowRight
        className="text-subtle-foreground group-hover:text-accent size-5 shrink-0 transition-all group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
