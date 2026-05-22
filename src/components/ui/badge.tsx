import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
  {
    variants: {
      tone: {
        default: "border-border bg-surface text-muted-foreground",
        accent: "border-accent/40 bg-accent-soft text-accent",
        good: "border-signal-good/40 bg-signal-good/10 text-signal-good",
        warn: "border-signal-warn/40 bg-signal-warn/10 text-signal-warn",
        hot: "border-signal-hot/40 bg-signal-hot/10 text-signal-hot",
        outline: "border-border-strong bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
