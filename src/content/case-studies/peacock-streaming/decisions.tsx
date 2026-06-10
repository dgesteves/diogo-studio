import type { ReactElement } from "react";
import { Callout } from "@/components/article/callout";
import { Decision, DecisionsLog } from "@/components/article/decisions-log";
import { H2 } from "@/components/article/heading";
import { Tradeoff } from "@/components/article/tradeoff";

export function Decisions(): ReactElement {
  return (
    <>
      <H2>Decisions</H2>
      <DecisionsLog>
        <Decision
          index={1}
          title="BFFs per surface, not one mega-API"
          constraint="The web surface couldn't be coupled to the player's iteration cadence, and vice versa."
          options="(a) one shared API contract; (b) per-surface BFFs; (c) GraphQL gateway."
          choice="(b) — per-surface BFFs owned by the surface team. GraphQL was a candidate but the org wasn't ready to absorb it for a streaming property at that scale."
          outcome="Web teams could iterate on contract changes without coordinating with native or player teams. Coupling moved out of the API layer and into a thinner shared model."
        />
        <Decision
          index={2}
          title="Treat release safety as a product, not a checklist"
          constraint="Engineers regularly skipped pre-release steps under deadline pressure."
          options="(a) more documentation; (b) gating in CI; (c) make the safe path the default path."
          choice="(c) — flags scaffolded by codegen, canary baked into the deploy pipeline, dashboards linked from the PR template."
          outcome="The team stopped framing release safety as overhead. It became one of the things engineers complimented each other about in retros."
        />
        <Decision
          index={3}
          title="RUM-first performance budgets"
          constraint="Synthetic Lighthouse numbers diverged from real-user experience under live event load."
          options="(a) Lighthouse CI; (b) real-user monitoring with budgets; (c) both."
          choice="(c) — but RUM was the budget that mattered. Lighthouse stayed for regression detection on PRs; RUM stayed for the conversation with leadership."
          outcome="When the surface got slower, we knew it before the support inbox did. When we made it faster, we could prove it to people who weren't engineers."
        />
      </DecisionsLog>
      <Tradeoff
        title="Flags everywhere"
        gained="Calm releases. Bad changes turned off in minutes. The team slept on event nights."
        paid="Code-level complexity — old flag branches accumulate. We paid this back with quarterly flag-cleanup tickets that became a normal part of the rhythm."
      />
      <Callout tone="info" title="The senior lesson">
        At Peacock scale, the boring habits are the senior work. A staff engineer who can ship a
        feature is common; one who can ship through a launch week without making the surface
        noticeably worse is rare.
      </Callout>
    </>
  );
}
