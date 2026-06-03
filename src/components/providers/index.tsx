import { Toaster } from "sonner";
import { CommandMenu } from "@/components/site/command-menu";
import { CommandMenuProvider } from "@/components/site/command-menu-context";
import { EasterEgg } from "@/components/site/easter-egg";
import { InspectorOverlay } from "@/components/site/inspector-overlay";
import { InspectorOverlayProvider } from "@/components/site/inspector-overlay-context";
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
 * - CommandMenuProvider owns the ⌘K state and is shared by the nav and the
 *   palette overlay; both are rendered inside it.
 * - InspectorOverlayProvider owns the S4 receipts HUD (Ctrl+`); the overlay
 *   reads the perf store + web-vitals only while open, so it's free by default.
 *
 * The Toaster is rendered at the bottom so toasts always overlay the app.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ReducedMotionProvider>
        <MotionProvider>
          <LenisProvider />
          <InspectorOverlayProvider>
            <CommandMenuProvider>
              {children}
              <CommandMenu />
            </CommandMenuProvider>
            <InspectorOverlay />
          </InspectorOverlayProvider>
          <EasterEgg />
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
