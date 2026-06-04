"use client";

import type { ReactElement } from "react";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useCommandMenu } from "@/features/command-menu";

export function CommandTrigger(): ReactElement {
  const { setOpen } = useCommandMenu();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command menu"
      className="group border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Search className="size-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Search or ask…</span>
      <span className="ml-1 hidden items-center gap-1 sm:inline-flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}
