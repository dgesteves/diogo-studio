import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { Phase, Timeline } from "@/components/article/timeline";

export function DeliveryTimeline(): ReactElement {
  return (
    <>
      <H2>Timeline</H2>
      <Timeline>
        <Phase tag="Phase 01" title="The contract" dates="Q3 2023">
          Before any agent shipped, I drafted the GraphQL schema as if the agents already worked.
          That meant agreeing on the shape of a <em>site</em>, a <em>link</em>, and a{" "}
          <em>capacity estimate</em> with the RF lead, and making sure each one had an ID stable
          enough to survive multiple proposals. The UI became the forcing function for the
          backend.
        </Phase>
        <Phase tag="Phase 02" title="Map as state" dates="Q4 2023">
          Built the digital-twin map: tiles, terrain, line-of-sight, coverage polygons. The agents
          proposed shapes; the engineer promoted them; everything else was derived. Map state
          became the source of truth, agents were rendered as suggestions.
        </Phase>
        <Phase tag="Phase 03" title="The review loop" dates="Q1 2024">
          Shipped the inspect/redo loop: every agent leg became a record on the plan with inputs,
          outputs, and a button to rerun. This is where agentic UX actually started to feel
          different from “chat with documents.”
        </Phase>
        <Phase tag="Phase 04" title="Onboarding compression" dates="2024–2025">
          Tightened the brief intake so a sales call could turn into a workable plan inside a
          same-day workshop. The onboarding flow became the proof of the product, not a tutorial.
        </Phase>
      </Timeline>
    </>
  );
}
