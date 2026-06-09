"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactElement } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { useCommandMenu } from "@/features/command-menu";
import { MobileLink } from "./mobile-nav-link";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav(): ReactElement {
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
