import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { SystemDiagram } from "@/components/article/system-diagram";

export function Architecture(): ReactElement {
  return (
    <>
      <H2>Architecture (the relevant slice)</H2>
      <SystemDiagram
        title="Peacock web surface slice"
        description="React clients call internal BFFs which talk to identity, billing, and catalog services. Telemetry flows to Splunk + Datadog; feature flags + canary gating decouple deploys from releases."
        caption="The web surface is one client of many. Reliability discipline starts at the edge."
        data={{
          nodes: [
            { id: "web", label: "Web client", kind: "client", detail: "React + Redux", x: 10, y: 50 },
            { id: "bff", label: "Node BFFs", kind: "service", detail: "Per-surface", x: 40, y: 50 },
            { id: "id", label: "Identity", kind: "service", detail: "Auth + entitlement", x: 80, y: 18 },
            { id: "bill", label: "Billing", kind: "service", detail: "Subscriptions", x: 80, y: 50 },
            { id: "cat", label: "Catalog", kind: "service", detail: "Content + browse", x: 80, y: 82 },
            { id: "obs", label: "Observability", kind: "data", detail: "Splunk + Datadog", x: 40, y: 92 },
            { id: "flags", label: "Flags + canary", kind: "external", detail: "Release gating", x: 10, y: 92 },
          ],
          edges: [
            { id: "e1", from: "web", to: "bff", label: "REST + GraphQL" },
            { id: "e2", from: "bff", to: "id" },
            { id: "e3", from: "bff", to: "bill" },
            { id: "e4", from: "bff", to: "cat" },
            { id: "e5", from: "web", to: "obs", variant: "dotted", label: "RUM" },
            { id: "e6", from: "bff", to: "obs", variant: "dotted", label: "logs" },
            { id: "e7", from: "flags", to: "web", variant: "dashed", label: "config" },
          ],
        }}
      />
    </>
  );
}
