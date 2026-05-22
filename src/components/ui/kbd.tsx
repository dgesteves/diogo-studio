import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Keyboard-hint primitive. Mono, hairline border, subtle surface.
 * Used in the nav, command palette triggers, and inspector overlay.
 */
export const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "border-border bg-surface text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm border px-1 font-mono text-[10px] leading-none font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  },
);
Kbd.displayName = "Kbd";
