"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/cn";
import { CommandTrigger } from "./command-trigger";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteNav(): ReactElement {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/75 sticky top-0 z-40 w-full border-b backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${siteConfig.initials} — ${siteConfig.name}, home`}
          className="group text-foreground inline-flex items-center gap-2 font-mono text-sm font-medium tracking-tight"
        >
          <span
            aria-hidden="true"
            className="border-brand-edge bg-brand-ink text-brand-cyan group-hover:border-brand-cyan/50 group-hover:text-brand-cyan-bright grid size-7 place-items-center rounded-[7px] border bg-[radial-gradient(120%_120%_at_50%_0%,var(--brand-ink-raised)_0%,var(--brand-ink)_62%)] text-[11px] font-semibold tracking-wider shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 group-hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--brand-cyan)_20%,transparent),0_0_14px_-2px_color-mix(in_srgb,var(--brand-cyan)_50%,transparent)]"
          >
            {siteConfig.initials}
          </span>
          <span aria-hidden="true" className="text-foreground hidden sm:inline">
            {siteConfig.name}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
        >
          {primaryNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CommandTrigger />
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
