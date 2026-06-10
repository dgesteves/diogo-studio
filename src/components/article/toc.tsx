"use client";

import { useEffect, useState, type ReactElement } from "react";
import type { TocEntry } from "./extract-toc";

export function ArticleToc({ entries }: { entries: readonly TocEntry[] }): ReactElement | null {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (entries.length === 0 || typeof IntersectionObserver === "undefined") return;
    const elements = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-3">
      <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        On this page
      </p>
      <ol className="flex flex-col gap-1.5">
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <li
              key={entry.id}
              style={{ paddingLeft: `${entry.depth * 0.75}rem` }}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className={
                  isActive
                    ? "bg-accent inline-block h-px w-3 transition-all"
                    : "bg-border-strong inline-block h-px w-1.5 transition-all"
                }
              />
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? "true" : undefined}
                className={
                  isActive
                    ? "text-foreground text-xs leading-tight transition-colors"
                    : "text-muted-foreground hover:text-foreground text-xs leading-tight transition-colors"
                }
              >
                {entry.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
