import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = {
  title: "Colophon",
  description: "How this site is built — stack, conventions, and the inspector overlay.",
};

export default function ColophonPage() {
  return (
    <ComingSoon
      eyebrow="Phase 5 — colophon"
      title="How this site is built — receipts included."
      description="A live writeup of the studio's own stack, design tokens, providers, and motion budget. The inspector overlay (toggleable web-vitals + r3f-perf + bundle-size readout) will be reachable from here so visitors can verify the perf claims on the surface itself."
      shipPhase="Phase 5"
      shipScope="MDX writeup + live inspector overlay backed by web-vitals + r3f-perf. Links back into Phase 1 design-system docs."
    />
  );
}
