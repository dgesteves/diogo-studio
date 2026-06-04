import type { ReactElement } from "react";
import { Toaster } from "sonner";
import { CommandMenuProvider } from "./command-menu-context";
import { InspectorOverlayProvider } from "./inspector-overlay-context";
import { LenisProvider } from "./lenis-provider";
import { MotionProvider } from "./motion-provider";
import { ReducedMotionProvider } from "./reduced-motion-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Single composition root for client-side providers.
 *
 * Order matters:
 * - ReducedMotion must wrap Motion (Motion reads from it).
 * - Lenis mounts inside ReducedMotion (it disables itself on reduce).
 * - CommandMenuProvider owns the ⌘K state, shared by the nav trigger and the
 *   palette overlay (mounted app-level in the root layout, within `children`).
 * - InspectorOverlayProvider owns the S4 receipts HUD (Ctrl+`); the overlay
 *   (also mounted app-level) reads the perf store + web-vitals only while open,
 *   so it's free by default.
 *
 * The Toaster is rendered at the bottom so toasts always overlay the app.
 */
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
