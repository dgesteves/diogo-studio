"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type DeckButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
};

export const DeckButton = forwardRef<HTMLButtonElement, DeckButtonProps>(
  ({ className, active = false, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-surface-muted focus-visible:ring-ring grid size-9 place-items-center rounded-lg border border-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-4",
        active && "text-accent border-accent/40 bg-accent-soft/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

DeckButton.displayName = "DeckButton";
