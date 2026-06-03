"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { CommandTrigger } from "./command-trigger";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

/**
 * Sticky site nav. Hairline border, subtle backdrop blur, console grammar.
 * Mono initials wordmark on the left, primary routes center, ⌘K + theme right.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/75 sticky top-0 z-40 w-full border-b backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          // WCAG 2.5.3 — accessible name must include the visible text. We
          // build a label that contains both the visible "DE" badge and the
          // wordmark text, so screen readers hear the same content sighted
          // users see.
          aria-label={`${siteConfig.initials} — ${siteConfig.name}, home`}
          className="group text-foreground inline-flex items-center gap-2 font-mono text-sm font-medium tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-[7px] border border-[#262b33] bg-[#0d0f12] bg-[radial-gradient(120%_120%_at_50%_0%,#181c22_0%,#0d0f12_62%)] text-[11px] font-semibold tracking-wider text-[#22d3ee] shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-200 group-hover:border-[#22d3ee]/50 group-hover:text-[#67e8f9] group-hover:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_14px_-2px_rgba(34,211,238,0.5)]"
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
