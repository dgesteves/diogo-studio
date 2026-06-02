"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useCommandMenu } from "./command-menu-context";

/**
 * Secondary hero CTA — opens the ⌘K command menu directly in Ask mode
 * (Phase 4). Plain ⌘K still lands in Navigate mode; this button is the
 * explicit "talk to the agent" entry point, matching its label.
 */
export function HeroAskCta() {
  const { openWithMode } = useCommandMenu();
  return (
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
  );
}
