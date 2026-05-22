import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Telemetry-dashboard case studies on AI-native platforms, design-system infrastructure, streaming-grade reliability, and agentic UX.",
};

export default function WorkPage() {
  return (
    <ComingSoon
      eyebrow="Phase 3 — case studies"
      title="Telemetry-dashboard case studies — not marketing pages."
      description="Each engagement (eino.ai, Peacock, Diligent, Moment, BMW Innovation) gets rendered like a postmortem: scale metrics, system diagrams, decisions log, tradeoffs, outcomes. Authored in MDX, indexed for the ⌘K agent."
      shipPhase="Phase 3"
      shipScope="velite + shiki + rehype-pretty-code + @xyflow/react diagrams + @tremor/react metric tiles. 5 case studies, 3 essays."
    />
  );
}
