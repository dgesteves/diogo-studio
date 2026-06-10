import type { ReactElement } from "react";
import { Decision, DecisionsLog } from "@/components/article/decisions-log";

export function FailureModes(): ReactElement {
  return (
    <>
      <DecisionsLog>
        <Decision
          index={1}
          title="They die at contribution"
          constraint="Product teams ship faster than the central DS team can keep up."
          options="(a) gatekeep harder; (b) ship faster from the center; (c) federate, with a real review model."
          choice="(c) — anything else builds a queue that ends in a re-org."
          outcome="Federated systems survive because contribution is shared work, not a request to a central team."
        />
        <Decision
          index={2}
          title="They die at framework drift"
          constraint="The org has two stacks; the DS is built for one."
          options="(a) ignore the other stack; (b) port; (c) ship a contract that compiles to both runtimes from one source."
          choice="(c) — tokens + behavior contract + two implementations."
          outcome="The systems that survive a Big Migration are the ones that already weren't pinned to one framework."
        />
        <Decision
          index={3}
          title="They die at adoption"
          constraint="Adoption is push, not pull. Teams resist; the central team escalates; everyone hates each other."
          options="(a) mandate adoption; (b) hope; (c) make 'pull' the obvious choice for every new screen."
          choice="(c) — adoption follows utility. If the system isn't the obvious tool, nothing organizational will save it."
          outcome="Pull adoption looks slow for the first six months. Then it's faster than push ever was."
        />
      </DecisionsLog>
      <p>
        If you can name a design system that died, I can almost certainly trace it back to one of
        these three.
      </p>
    </>
  );
}
