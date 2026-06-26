"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/config/navigation";
import { routes } from "@/constants/routes";
import { setHoveredStation } from "@/stores/world-store";
import { cn } from "@/utils/cn";
import { resolveStation } from "../../hooks/use-active-station";

const WAYPOINTS = [{ label: "Studio", href: routes.home }, ...primaryNav] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === routes.home) return pathname === routes.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DeckWaypoints(): ReactElement {
  const pathname = usePathname();

  return (
    <nav aria-label="Studio destinations" className="hidden md:block">
      <ul className="flex items-center gap-0.5">
        {WAYPOINTS.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const slug = resolveStation(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={() => setHoveredStation(slug)}
                onMouseLeave={() => setHoveredStation(null)}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 font-mono text-[11px] tracking-wide whitespace-nowrap transition-colors",
                  isActive
                    ? "text-accent bg-accent-soft/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
