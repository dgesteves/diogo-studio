"use client";

import type { ReactElement } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/ui/button";
import { Kbd } from "@/ui/kbd";
import { StatusDot } from "@/ui/status-dot";
import { siteConfig } from "@/content/profile";
import { useCommandMenu } from "@/command-menu/store";

/**
 * The landing's two affordances that the authored record cannot express: the author is
 * open to work, and the agent will answer questions about all of it. Everything else on
 * `/` comes from `content/prose/home.ts` through `PageView`.
 *
 * The availability sentence is read from `content/profile.ts` rather than written here —
 * the hero this replaced carried its own shortened variant, which is exactly the second
 * copy Phase 2b removes.
 */
export function HomeCta(): ReactElement {
  const { openWithMode } = useCommandMenu();

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="border-border bg-surface/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
        <StatusDot tone="good" />
        <span>{siteConfig.availability}</span>
      </p>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => openWithMode("ask")}
        aria-label="Press ⌘K to ask the agent about Diogo's work"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        <span>Press</span>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <span>to ask</span>
      </Button>
    </div>
  );
}
