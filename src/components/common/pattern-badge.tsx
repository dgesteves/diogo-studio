import type { CSSProperties, ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { patterns as patternMeta, type PatternId } from "@/data/patterns";

export function PatternBadge({
  id,
  selected = false,
}: {
  id: PatternId;
  selected?: boolean;
}): ReactElement {
  const p = patternMeta[id];
  const style: CSSProperties = selected
    ? {
        borderColor: `var(--${p.colorVar})`,
        backgroundColor: `color-mix(in srgb, var(--${p.colorVar}) 12%, transparent)`,
        color: `var(--${p.colorVar})`,
      }
    : {
        borderColor: `color-mix(in srgb, var(--${p.colorVar}) 40%, transparent)`,
      };

  return (
    <Badge tone="outline" style={style}>
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: `var(--${p.colorVar})` }}
      />
      {p.label}
    </Badge>
  );
}
