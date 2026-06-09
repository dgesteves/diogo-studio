"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactElement } from "react";
import { PatternBadge } from "@/components/common/pattern-badge";
import { type PatternId } from "@/content/data/patterns";
import { cn } from "@/lib/utils/cn";

export function PatternFilter({
  available,
  selected,
}: {
  available: readonly PatternId[];
  selected: readonly PatternId[];
}): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(id: PatternId): void {
    const next = new URLSearchParams(searchParams.toString());
    const current = next.getAll("p");
    next.delete("p");
    const wasSelected = current.includes(id);
    const after = wasSelected ? current.filter((p) => p !== id) : [...current, id];
    for (const p of after) next.append("p", p);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clear(): void {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("p");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

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
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase transition-colors",
          allActive
            ? "border-accent/60 bg-accent-soft text-accent"
            : "border-border bg-surface text-muted-foreground hover:border-border-strong",
        )}
      >
        All
      </button>
      {available.map((id) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            aria-pressed={isSelected}
            className="inline-flex"
          >
            <PatternBadge id={id} selected={isSelected} />
          </button>
        );
      })}
    </div>
  );
}
