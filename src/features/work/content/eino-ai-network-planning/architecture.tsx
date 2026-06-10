import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { SystemDiagram } from "@/components/article/system-diagram";

export function Architecture(): ReactElement {
  return (
    <>
      <H2>Architecture</H2>
      <SystemDiagram
        title="eino.ai agentic planning surface"
        description="React + GraphQL frontend orchestrates agent calls. Map + planning UI hold local state; agents stream proposals back; engineer accepts, edits, or reruns any leg."
        caption="Engineer drives the map; agents draft sites + links + capacity; every leg is auditable."
        data={{
          nodes: [
            { id: "brief", label: "Brief intake", kind: "client", detail: "Prompt + uploads", x: 10, y: 18 },
            { id: "map", label: "Digital twin", kind: "client", detail: "MapLibre + terrain", x: 10, y: 72 },
            { id: "orch", label: "Plan orchestrator", kind: "service", detail: "GraphQL gateway", x: 50, y: 45 },
            { id: "siting", label: "Siting agent", kind: "agent", detail: "Candidate radio sites", x: 88, y: 12 },
            { id: "links", label: "Link agent", kind: "agent", detail: "PtP backhaul", x: 88, y: 45 },
            { id: "capacity", label: "Capacity agent", kind: "agent", detail: "Subscribers / Mbps", x: 88, y: 78 },
            { id: "tiles", label: "Geospatial store", kind: "data", detail: "Tiles + DEM", x: 50, y: 90 },
          ],
          edges: [
            { id: "e1", from: "brief", to: "orch", label: "intake" },
            { id: "e2", from: "map", to: "orch", label: "edits", variant: "dashed" },
            { id: "e3", from: "orch", to: "siting", label: "run" },
            { id: "e4", from: "orch", to: "links", label: "run" },
            { id: "e5", from: "orch", to: "capacity", label: "run" },
            { id: "e6", from: "siting", to: "map", label: "stream", variant: "dashed" },
            { id: "e7", from: "links", to: "map", label: "stream", variant: "dashed" },
            { id: "e8", from: "capacity", to: "map", label: "stream", variant: "dashed" },
            { id: "e9", from: "orch", to: "tiles", variant: "dotted" },
          ],
        }}
      />
      <p>
        The orchestrator is a thin GraphQL gateway in front of the agents. The frontend treats
        every leg as a streamed mutation: the engineer triggers a leg, the leg streams partial
        proposals, and the map renders them as they arrive. The agents themselves are out of scope
        for this writeup — I owned the surface and the contract.
      </p>
    </>
  );
}
