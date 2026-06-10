import type { ArticleBlock } from "@/content/schema/article-blocks";

export const decisions: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Decisions" },
  {
    kind: "decisions",
    items: [
      {
        index: 1,
        title: "Treat agents as streaming mutations, not chat turns",
        constraint: "Agents take seconds to minutes; the UI can't sit on a spinner.",
        options:
          "(a) chat-style turn buffer; (b) optimistic placeholders with reconciliation; (c) GraphQL subscription per agent leg streaming partial proposals.",
        choice:
          "(c) — one subscription per leg, partial-proposal updates, every proposal stamped with a leg ID + version.",
        outcome:
          "The map redrew progressively as the agent worked. When models or prompts changed, the schema stayed; the UI never knew.",
      },
      {
        index: 2,
        title: "The plan is a graph; the UI is a view of the graph",
        constraint:
          "Editing a site has to re-cost capacity, redraw links, and re-validate line-of-sight without an explicit recompute button.",
        options:
          "(a) imperative recompute on every edit; (b) Redux-style action log with side-effect middleware; (c) derived-from-plan model where every panel reads from a normalized plan store.",
        choice:
          "(c) — TanStack Query cache as the plan store, with selectors that compose. Edits are commits; agents are async resolvers.",
        outcome:
          "Adding new agent legs (capacity, then financial) was additive; no panel rewrites. The 'plan' became a portable artifact we could serialize, share, and replay.",
      },
      {
        index: 3,
        title: "Engineer-first review, no chatbot",
        constraint:
          "The audience is engineers who don't trust LLM output. They need provenance, not vibes.",
        options:
          "(a) chat panel as the primary surface; (b) inline annotations on the map; (c) a dedicated review log with rerun + diff.",
        choice:
          "(c) — every leg is a record with inputs, outputs, model + prompt version, and a one-click rerun. Chat is available, but the review log is the spine.",
        outcome:
          "Pilot engineers stopped asking 'can I trust this' inside the first session. They started asking 'can I share this with a customer.'",
      },
      {
        index: 4,
        title: "Codegen everywhere, hand-written nothing",
        constraint: "Schema churn during agent iteration would have melted the frontend.",
        options:
          "(a) hand-rolled types + fetch; (b) graphql-request with manual typings; (c) GraphQL Codegen + TanStack Query bindings, regenerated on every schema change.",
        choice:
          "(c) — typed hooks, typed fragments, typed cache writes. A schema diff would surface in TypeScript in seconds.",
        outcome:
          "We absorbed three major schema refactors during pilots with zero runtime regressions. The diff PRs were boring on purpose.",
      },
    ],
  },
  {
    kind: "tradeoff",
    title: "Streaming over polling",
    gained:
      "Map updates landed as the agent worked; engineers felt the system was alive, not stalled.",
    paid: "Resilience cost — we built backpressure, dedupe, and replay on top of subscriptions. Worth it; it would not have been on a smaller surface.",
  },
];
