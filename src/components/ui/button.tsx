"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    // Base — console primitive: precise, telemetry-flavored
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "tracking-tight transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-surface-muted active:bg-surface-inset",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted active:bg-surface-inset",
        link: "bg-transparent text-foreground underline-offset-4 hover:underline",
        subtle:
          "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
