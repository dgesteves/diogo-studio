"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useCommandMenu } from "./command-menu-context";

/**
 * Secondary hero CTA — opens the ⌘K command menu so visitors can either
 * navigate or (Phase 4) ask the agent grounded on Diogo's resume + cases.
 */
export function HeroAskCta() {
  const { setOpen } = useCommandMenu();
  return (
    <Button type="button" variant="outline" size="lg" onClick={() => setOpen(true)}>
      <Sparkles className="size-4" aria-hidden="true" />
      <span>Press</span>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
      <span>to ask</span>
    </Button>
  );
}
