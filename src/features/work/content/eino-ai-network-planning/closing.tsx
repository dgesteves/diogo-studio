import type { ReactElement } from "react";
import { Callout } from "@/components/article/callout";
import { H2 } from "@/components/article/heading";
import { Outcome } from "@/components/article/outcome";

export function Closing(): ReactElement {
  return (
    <>
      <H2>What this looked like to the engineer</H2>
      <p>
        The hero of the product is the map. The agents are the supporting cast. That distinction
        shaped every UI decision: the map was the surface that held attention; agent panels were
        edges of the workspace that lit up when something needed acceptance.
      </p>
      <Callout tone="tip" title="Agentic UX, the rule we settled on">
        Anything an agent does has to be inspectable, rerunnable, and attributable. The UI can be
        magical; the contract underneath cannot.
      </Callout>
      <H2>Outcomes</H2>
      <Outcome>
        Same-day workshops replaced multi-week consulting engagements for the customer profile the
        product was designed for.
      </Outcome>
      <Outcome tag="Operating outcome">
        The contract held across three LLM provider swaps. The frontend shipped through them
        without a single visible regression to pilot customers — what the agent-orchestration
        team needed me to do.
      </Outcome>
      <Outcome tag="Career outcome">
        This is the engagement I reference when people ask “have you actually shipped agentic UX,
        or just talked about it?”
      </Outcome>
    </>
  );
}
