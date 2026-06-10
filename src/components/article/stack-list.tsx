import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";

export function StackList({
  label,
  items,
  tone = "outline",
}: {
  label: string;
  items: readonly string[];
  tone?: "outline" | "default" | "accent";
}): ReactElement {
  return (
    <div className="not-prose flex flex-wrap items-center gap-x-4 gap-y-2" data-mdx-block="stack">
      <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        {label}
      </span>
      <ul className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <li key={item}>
            <Badge tone={tone}>{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
