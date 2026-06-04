"use client";

import type { ReactElement } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useCommandMenu } from "@/components/providers/command-menu-context";

export function HeroAskCta(): ReactElement {
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
