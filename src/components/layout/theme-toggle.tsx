"use client";

import type { ReactElement } from "react";
import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/lib/hooks/use-is-client";

/**
 * Compact theme toggle. Cycles light → dark (system is reachable via ⌘K).
 *
 * We render an inert placeholder until hydration is done — `next-themes`
 * resolves the active theme from its inline `<head>` script before React
 * hydrates, so reading `resolvedTheme` synchronously during SSR vs. the
 * first client render disagrees and produces a hydration mismatch.
 * `useIsClient` (built on `useSyncExternalStore`) defers the icon branch
 * to the post-hydration render with no lint trip-wires.
 */
export function ThemeToggle(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const isDark = isClient && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
    >
      {isClient ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <MoonStar className="size-4" />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
