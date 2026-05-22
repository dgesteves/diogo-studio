import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays on platform engineering, AI-native UX, and design-system infrastructure.",
};

export default function WritingPage() {
  return (
    <ComingSoon
      eyebrow="Phase 3 — writing"
      title="Essays on platform, AI-native UX, and design systems."
      description="Opinionated takes on the patterns this site embodies: how design systems survive multiple product lines, what agentic UX needs to be production-ready, what 'streaming-grade reliability' actually means at tens of millions of viewers."
      shipPhase="Phase 3"
      shipScope="MDX via velite. Three essays at launch: design-systems thesis, agentic UX without the demo-tax, streaming-grade reliability."
    />
  );
}
