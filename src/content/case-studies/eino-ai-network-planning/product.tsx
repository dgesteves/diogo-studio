import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";

export function Product(): ReactElement {
  return (
    <>
      <H2>The product, in one paragraph</H2>
      <p>
        Customers come in with a vague brief: <em>“connect these N rural clusters.”</em> The agent
        reads the brief, drafts candidate radio sites on a real-world map, runs line-of-sight
        against terrain, proposes backhaul links, fits the radios, and hands the engineer a
        high-level network design they can edit. Editing anywhere in that chain re-triggers the
        affected agents — the plan is a graph, not a wizard.
      </p>
      <p>
        What makes it agentic, not “AI-flavored,” is that every step is a discrete tool call the
        engineer can inspect, rerun, or override. The UI has to expose that without overwhelming
        the engineer with logs.
      </p>
    </>
  );
}
