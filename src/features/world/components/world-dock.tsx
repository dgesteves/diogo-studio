"use client";

import { type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { setHoveredStation } from "@/stores/world-store";
import { worldDestinations } from "../content/destinations";
import { resolveStation } from "../hooks/use-active-station";
import { useHoveredStation } from "../hooks/use-hovered-station";

export function WorldDock(): ReactElement {
  const pathname = usePathname();
  const active = resolveStation(pathname);
  const hovered = useHoveredStation();

  return (
    <nav
      aria-label="Studio destinations"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3"
    >
      <ul className="border-border/70 bg-background/80 pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full border p-1.5 backdrop-blur-xl">
        {worldDestinations.map((destination) => {
          const isActive = destination.slug === active;
          const isHovered = destination.slug === hovered;
          return (
            <li key={destination.slug}>
              <Link
                href={destination.href}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={() => setHoveredStation(destination.slug)}
                onMouseLeave={() => setHoveredStation(null)}
                className={cn(
                  "block rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  isHovered && !isActive && "text-foreground",
                )}
              >
                {destination.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
