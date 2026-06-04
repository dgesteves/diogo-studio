"use client";

import type { ReactElement } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * Thin wrapper around next-themes so the rest of the app can import a single,
 * project-aware provider. Default behavior:
 *
 * - Uses the `class` strategy (toggles `class="dark"` on `<html>`).
 * - Respects the system preference until the user explicitly chooses.
 * - Disables built-in transition flashes when the theme flips.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps): ReactElement {
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
