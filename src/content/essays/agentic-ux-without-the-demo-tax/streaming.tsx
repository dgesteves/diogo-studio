import type { ReactElement } from "react";
import { H2, H3 } from "@/components/article/heading";

export function Streaming(): ReactElement {
  return (
    <>
      <H2>What production agentic UX actually requires</H2>
      <p>
        I’ve shipped one production agentic system at this point — eino.ai — and the lessons
        cluster into a small number of obvious-in-hindsight rules that almost no demo I’ve seen
        follows.
      </p>
      <H3>1. Agents are streaming mutations, not chat turns</H3>
      <p>
        If you treat an agent run as a chat turn, the user sits on a spinner for 30 seconds and
        then gets a wall of output. That’s the demo pattern. It’s the same pattern as a slow API
        call with a personality.
      </p>
      <p>
        The production pattern is to stream <em>partial proposals</em> back. The user sees the
        agent working — site by site, link by link, line by line — and the surface updates in
        place. By the time the agent finishes, the user has been <em>with it</em> for the run, not
        waiting for it.
      </p>
      <p>
        This isn’t a UI flourish. It’s a contract decision: every agent leg becomes a streamed
        mutation with a stable ID and a sequence number, and the UI is built to reconcile
        partials. Doing this later, after the demo ships, is a rewrite. Doing it first is a week.
      </p>
      <H3>2. Every agent leg has to be inspectable</H3>
      <p>
        The product engineer’s first question, when they sit down with an agent, is{" "}
        <em>what did it do and why</em>. If the answer is “I’ll trust it,” you’ve shipped a
        chatbot. If the answer is “click into the leg, see the inputs, see the outputs, see the
        model + prompt version, rerun with different inputs,” you’ve shipped an agent.
      </p>
      <p>
        The cost of building this is real and unavoidable. The cost of <em>not</em> building it is
        that engineers stop using the product after their second false-positive.
      </p>
    </>
  );
}
