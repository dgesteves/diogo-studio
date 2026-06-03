"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { primaryNav, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { useCommandMenu } from "./command-menu-context";
import { ThemeToggle } from "./theme-toggle";

/**
 * Mobile-only navigation drawer. Hidden ≥ md.
 *
 * - Bottom-sheet via `vaul` — feels native on touch and avoids fighting the
 *   on-screen keyboard if we add search later.
 * - Closes immediately on link click (more responsive than waiting for the
 *   route transition, and keeps state updates on the user-event boundary).
 * - Re-uses the same nav model as desktop so the two stay in sync.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { setOpen: setCommandOpen } = useCommandMenu();
  const close = () => setOpen(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <Drawer.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="bg-background/70 fixed inset-0 z-50 backdrop-blur-sm" />
        <Drawer.Content
          aria-describedby={undefined}
          className="border-border-strong bg-surface fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[88vh] flex-col rounded-t-2xl border focus:outline-none"
        >
          <Drawer.Title className="sr-only">{siteConfig.name} — navigation</Drawer.Title>
          {/* Drag handle */}
          <div
            aria-hidden="true"
            className="bg-border-strong mx-auto mt-2 mb-4 h-1.5 w-12 rounded-full"
          />

          <nav aria-label="Primary (mobile)" className="flex flex-col px-3 pb-2">
            <ul className="flex flex-col gap-1">
              <li>
                <MobileLink href="/" pathname={pathname} onNavigate={close}>
                  Home
                </MobileLink>
              </li>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <MobileLink href={item.href} pathname={pathname} onNavigate={close}>
                    {item.label}
                  </MobileLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-border mt-2 flex items-center justify-between gap-2 border-t px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                // Defer so the drawer closes before the dialog opens.
                requestAnimationFrame(() => setCommandOpen(true));
              }}
              className="border-border bg-surface-inset text-muted-foreground hover:border-border-strong hover:text-foreground inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
            >
              <span>Search or ask</span>
              <span className="ml-auto inline-flex items-center gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            <ThemeToggle />
          </div>

          <div className="border-border text-subtle-foreground border-t px-4 py-3 font-mono text-[10px] tracking-wider uppercase">
            <a
              href={`mailto:${siteConfig.email}`}
              className="hover:text-foreground transition-colors"
            >
              {siteConfig.email}
            </a>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function MobileLink({
  href,
  pathname,
  onNavigate,
  children,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-3 text-base transition-colors",
        isActive
          ? "bg-surface-muted text-foreground"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <span>{children}</span>
      {isActive ? (
        <span
          aria-hidden="true"
          className="text-accent font-mono text-[10px] tracking-wider uppercase"
        >
          Current
        </span>
      ) : null}
    </Link>
  );
}
