"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { patterns as patternMeta, type PatternId } from "@/content/data/career-graph";

/**
 * Pattern filter strip for `/work` and `/writing`.
 *
 * Multi-select via `?p=ai-native&p=design-systems`. Renders as the same
 * pattern chips used in the article header — clicking toggles the
 * selection, "All" clears. Server reads `searchParams.p` and filters
 * the collection; this component just owns the URL.
 */
export function PatternFilter({
  available,
  selected,
}: {
  /** Patterns that are present in the current collection — others hide. */
  available: readonly PatternId[];
  /** Currently selected pattern IDs from the URL. */
  selected: readonly PatternId[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggle = useCallback(
    (id: PatternId) => {
      const next = new URLSearchParams(searchParams.toString());
      const current = next.getAll("p");
      next.delete("p");
      const wasSelected = current.includes(id);
      const after = wasSelected ? current.filter((p) => p !== id) : [...current, id];
      for (const p of after) next.append("p", p);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clear = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("p");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const allActive = selected.length === 0;

  return (
    <div role="group" aria-label="Filter by pattern" className="flex flex-wrap items-center gap-2">
      <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        Filter
      </span>
      <button
        type="button"
        onClick={clear}
        aria-pressed={allActive}
        className={
          allActive
            ? "border-accent/60 bg-accent-soft text-accent inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase transition-colors"
            : "border-border bg-surface text-muted-foreground hover:border-border-strong inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase transition-colors"
        }
      >
        All
      </button>
      {available.map((id) => {
        const p = patternMeta[id];
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            aria-pressed={isSelected}
            className="inline-flex"
          >
            <Badge
              tone="outline"
              style={
                isSelected
                  ? {
                      borderColor: `var(--${p.colorVar})`,
                      backgroundColor: `color-mix(in srgb, var(--${p.colorVar}) 12%, transparent)`,
                      color: `var(--${p.colorVar})`,
                    }
                  : {
                      borderColor: `color-mix(in srgb, var(--${p.colorVar}) 40%, transparent)`,
                    }
              }
            >
              <span
                aria-hidden="true"
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: `var(--${p.colorVar})` }}
              />
              {p.label}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
