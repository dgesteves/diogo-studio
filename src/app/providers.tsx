"use client";

import type { ReactElement } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

import { ReducedMotionProvider } from "@/reduced-motion";

/**
 * Everything the whole document is wrapped in. It lives in `app/` because composing the tree
 * is routing's job — the providers themselves belong to whoever owns the signal, which is
 * why reduced motion is a root leaf and the theme is next-themes.
 */
export function AppProviders({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <ReducedMotionProvider>{children}</ReducedMotionProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children, ...props }: ThemeProviderProps): ReactElement {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
