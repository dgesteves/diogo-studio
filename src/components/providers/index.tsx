import { Toaster } from "sonner";
import { CommandMenu } from "@/components/site/command-menu";
import { CommandMenuProvider } from "@/components/site/command-menu-context";
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
 *
 * The Toaster is rendered at the bottom so toasts always overlay the app.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ReducedMotionProvider>
        <MotionProvider>
          <LenisProvider />
          <CommandMenuProvider>
            {children}
            <CommandMenu />
          </CommandMenuProvider>
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
