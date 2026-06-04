import type { ReactElement } from "react";
import { Toaster } from "sonner";
import { CommandMenuProvider } from "./command-menu-context";
import { InspectorOverlayProvider } from "./inspector-overlay-context";
import { LenisProvider } from "./lenis-provider";
import { MotionProvider } from "./motion-provider";
import { ReducedMotionProvider } from "./reduced-motion-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <ReducedMotionProvider>
        <MotionProvider>
          <LenisProvider />
          <InspectorOverlayProvider>
            <CommandMenuProvider>{children}</CommandMenuProvider>
          </InspectorOverlayProvider>
          <Toaster
            position="bottom-right"
            theme="system"
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </MotionProvider>
      </ReducedMotionProvider>
    </ThemeProvider>
  );
}
