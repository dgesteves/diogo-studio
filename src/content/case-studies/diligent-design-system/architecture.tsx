import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { SystemDiagram } from "@/components/article/system-diagram";

export function Architecture(): ReactElement {
  return (
    <>
      <H2>Architecture</H2>
      <SystemDiagram
        title="Diligent design system contract"
        description="Tokens compile to two runtimes; React + Angular libraries expose the same contract; product apps consume them; contributions flow through a single review path."
        caption="The token + contract layer is the spine; runtimes are interchangeable; contributions are governed, not gated."
        data={{
          nodes: [
            { id: "tokens", label: "Tokens", kind: "data", detail: "JSON · single source", x: 50, y: 10 },
            { id: "sd", label: "Style Dictionary", kind: "service", detail: "Build pipeline", x: 50, y: 38 },
            { id: "react", label: "React lib", kind: "client", detail: "Versioned package", x: 18, y: 68 },
            { id: "ng", label: "Angular lib", kind: "client", detail: "Versioned package", x: 82, y: 68 },
            { id: "products", label: "Product apps", kind: "external", detail: "Pull adoption", x: 50, y: 92 },
            { id: "rfc", label: "Contribution flow", kind: "agent", detail: "RFC + design + review", x: 18, y: 18 },
          ],
          edges: [
            { id: "e1", from: "tokens", to: "sd", label: "compile" },
            { id: "e2", from: "sd", to: "react", label: "build" },
            { id: "e3", from: "sd", to: "ng", label: "build" },
            { id: "e4", from: "react", to: "products", label: "consume" },
            { id: "e5", from: "ng", to: "products", label: "consume" },
            { id: "e6", from: "rfc", to: "tokens", variant: "dashed", label: "propose" },
            { id: "e7", from: "rfc", to: "react", variant: "dashed" },
            { id: "e8", from: "rfc", to: "ng", variant: "dashed" },
          ],
        }}
      />
    </>
  );
}
