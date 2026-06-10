import type { ReactElement } from "react";
import { Callout } from "@/components/article/callout";
import { H3 } from "@/components/article/heading";

export function Recovery(): ReactElement {
  return (
    <>
      <H3>5. Recovery is a feature, not an error state</H3>
      <p>
        Demos elide failure. Production agentic surfaces have to elevate it. Every leg must be:
      </p>
      <ul>
        <li>
          <strong>Rewindable</strong>: if the proposal was wrong, the user can roll back to before
          it ran without losing other state.
        </li>
        <li>
          <strong>Rerunnable</strong>: with the same inputs (for debugging) or with new ones (for
          iteration).
        </li>
        <li>
          <strong>Diffable</strong>: if the user reran a leg, they should be able to see what
          changed and choose which version to keep.
        </li>
      </ul>
      <p>
        If failure recovery is “click the back button and try again,” you’ve built a search
        engine, not an agent.
      </p>
      <Callout tone="tip" title="The uncomfortable truth">
        Most agentic UX failures aren’t a bad model. They’re a UX that treats the model like a
        magic box instead of a flaky tool the user can supervise. The model is fine; the framing
        is wrong.
      </Callout>
    </>
  );
}
