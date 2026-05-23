import { Badge } from "@/components/ui/badge";

/**
 * `<StackList />` — compact tag-strip for tech stack / surfaces / scope.
 *
 * Used in case-study headers under the metrics block to declare the
 * surface area and the toolchain. Reads as console-grade metadata, not
 * a "skills bar" (explicit anti-pattern in §2.3).
 */
export function StackList({
  label,
  items,
  tone = "outline",
}: {
  label: string;
  items: readonly string[];
  tone?: "outline" | "default" | "accent";
}) {
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
