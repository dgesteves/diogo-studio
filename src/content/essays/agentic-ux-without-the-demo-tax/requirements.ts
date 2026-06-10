import type { ArticleBlock } from "@/content/schema/article-blocks";

export const requirements: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "What production agentic UX actually requires" },
  {
    kind: "paragraph",
    text: "I've shipped one production agentic system at this point — eino.ai — and the lessons cluster into a small number of obvious-in-hindsight rules that almost no demo I've seen follows.",
  },
  { kind: "heading", level: 3, text: "1. Agents are streaming mutations, not chat turns" },
  {
    kind: "paragraph",
    text: "If you treat an agent run as a chat turn, the user sits on a spinner for 30 seconds and then gets a wall of output. That's the demo pattern. It's the same pattern as a slow API call with a personality.",
  },
  {
    kind: "paragraph",
    text: "The production pattern is to stream *partial proposals* back. The user sees the agent working — site by site, link by link, line by line — and the surface updates in place. By the time the agent finishes, the user has been *with it* for the run, not waiting for it.",
  },
  {
    kind: "paragraph",
    text: "This isn't a UI flourish. It's a contract decision: every agent leg becomes a streamed mutation with a stable ID and a sequence number, and the UI is built to reconcile partials. Doing this later, after the demo ships, is a rewrite. Doing it first is a week.",
  },
  { kind: "heading", level: 3, text: "2. Every agent leg has to be inspectable" },
  {
    kind: "paragraph",
    text: 'The product engineer\'s first question, when they sit down with an agent, is *what did it do and why*. If the answer is "I\'ll trust it," you\'ve shipped a chatbot. If the answer is "click into the leg, see the inputs, see the outputs, see the model + prompt version, rerun with different inputs," you\'ve shipped an agent.',
  },
  {
    kind: "paragraph",
    text: "The cost of building this is real and unavoidable. The cost of *not* building it is that engineers stop using the product after their second false-positive.",
  },
  { kind: "heading", level: 3, text: "3. The user isn't the prompt; the user is the editor" },
  {
    kind: "paragraph",
    text: 'A persistent failure mode I see is treating the human as a prompt input. They type something, the agent runs, output appears, repeat. This is the chat metaphor. It scales to "ask a vague question, get a vague answer."',
  },
  {
    kind: "paragraph",
    text: "Production agentic UX flips this. The human is the *editor* of the plan. The agent is one of several proposers. The plan is the durable artifact — not a transcript, not a chat history. The user edits the plan; the agent reproposes around the edits. The chat, if it exists at all, is a side channel.",
  },
  {
    kind: "paragraph",
    text: "This shift — from chat to editor — is the single biggest UX delta between the demos and the production systems I trust.",
  },
  { kind: "heading", level: 3, text: "4. The contract has to outlive the model" },
  {
    kind: "paragraph",
    text: "LLMs change. Prompts change. Pipelines get rewritten. If your UI knows what model is running, what version of what prompt is firing, or how the agent steps are composed, your UI is a brittle dependency of the agent team.",
  },
  {
    kind: "paragraph",
    text: "The contract that should be visible to the UI is *what the agent returns* (a typed proposal, a typed diff, a typed cost estimate) — not *how it computed it*. We swapped LLM providers three times at eino.ai; the UI shipped through every swap without a single visible regression to pilot customers. The contract was the spine; the model was an implementation detail.",
  },
  { kind: "heading", level: 3, text: "5. Recovery is a feature, not an error state" },
  {
    kind: "paragraph",
    text: "Demos elide failure. Production agentic surfaces have to elevate it. Every leg must be:",
  },
  {
    kind: "list",
    items: [
      "**Rewindable**: if the proposal was wrong, the user can roll back to before it ran without losing other state.",
      "**Rerunnable**: with the same inputs (for debugging) or with new ones (for iteration).",
      "**Diffable**: if the user reran a leg, they should be able to see what changed and choose which version to keep.",
    ],
  },
  {
    kind: "paragraph",
    text: 'If failure recovery is "click the back button and try again," you\'ve built a search engine, not an agent.',
  },
  {
    kind: "callout",
    tone: "tip",
    title: "The uncomfortable truth",
    body: "Most agentic UX failures aren't a bad model. They're a UX that treats the model like a magic box instead of a flaky tool the user can supervise. The model is fine; the framing is wrong.",
  },
];
