import type { ReactElement } from "react";
import { H3 } from "@/components/article/heading";

export function Editor(): ReactElement {
  return (
    <>
      <H3>3. The user isn’t the prompt; the user is the editor</H3>
      <p>
        A persistent failure mode I see is treating the human as a prompt input. They type
        something, the agent runs, output appears, repeat. This is the chat metaphor. It scales to
        “ask a vague question, get a vague answer.”
      </p>
      <p>
        Production agentic UX flips this. The human is the <em>editor</em> of the plan. The agent
        is one of several proposers. The plan is the durable artifact — not a transcript, not a
        chat history. The user edits the plan; the agent reproposes around the edits. The chat, if
        it exists at all, is a side channel.
      </p>
      <p>
        This shift — from chat to editor — is the single biggest UX delta between the demos and
        the production systems I trust.
      </p>
      <H3>4. The contract has to outlive the model</H3>
      <p>
        LLMs change. Prompts change. Pipelines get rewritten. If your UI knows what model is
        running, what version of what prompt is firing, or how the agent steps are composed, your
        UI is a brittle dependency of the agent team.
      </p>
      <p>
        The contract that should be visible to the UI is <em>what the agent returns</em> (a typed
        proposal, a typed diff, a typed cost estimate) — not <em>how it computed it</em>. We
        swapped LLM providers three times at eino.ai; the UI shipped through every swap without a
        single visible regression to pilot customers. The contract was the spine; the model was an
        implementation detail.
      </p>
    </>
  );
}
