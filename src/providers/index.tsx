import type { ReactElement } from "react";
import { ReducedMotionProvider } from "./reduced-motion-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <ReducedMotionProvider>{children}</ReducedMotionProvider>
    </ThemeProvider>
  );
}
