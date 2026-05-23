"use client";

import { useEffect, useState } from "react";

/**
 * Table of contents — sticky companion column on `/work/[slug]` and
 * `/writing/[slug]`. Driven by the velite-generated `toc` array on each
 * document, scrollspied with `IntersectionObserver`.
 *
 * Client component because it tracks the active heading. The list
 * itself is server-renderable too — we ship both: the SSR version lays
 * the prose out, the client one upgrades the active state.
 */

export type TocItem = {
  title: string;
  url: string;
  /** Optional nested items. Velite emits this as a tree when `original` is on. */
  items?: TocItem[];
};

type FlatItem = { id: string; title: string; depth: number };

function flatten(items: TocItem[], depth = 0, acc: FlatItem[] = []): FlatItem[] {
  for (const item of items) {
    const id = item.url.startsWith("#") ? item.url.slice(1) : item.url;
    acc.push({ id, title: item.title, depth });
    if (item.items?.length) {
      flatten(item.items, depth + 1, acc);
    }
  }
  return acc;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const flat = flatten(items);
  const [activeId, setActiveId] = useState<string | null>(flat[0]?.id ?? null);

  useEffect(() => {
    if (flat.length === 0 || typeof IntersectionObserver === "undefined") return;
    const elements = flat
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that's still
        // visible — keeps the active marker stable while scrolling.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [flat]);

  if (flat.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="mdx-toc flex flex-col gap-3">
      <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        On this page
      </p>
      <ol className="flex flex-col gap-1.5">
        {flat.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${item.depth * 0.75}rem` }}
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
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={
                  isActive
                    ? "text-foreground text-xs leading-tight transition-colors"
                    : "text-muted-foreground hover:text-foreground text-xs leading-tight transition-colors"
                }
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
