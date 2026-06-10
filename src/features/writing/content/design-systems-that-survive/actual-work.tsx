import type { ReactElement } from "react";
import { H2, H3 } from "@/components/article/heading";

export function ActualWork(): ReactElement {
  return (
    <>
      <H2>The actual work, in order</H2>
      <H3>1. Tokens come first, and they are the product</H3>
      <p>
        Colors, type, spacing, motion, radius — declared once, in a runtime-agnostic format (JSON
        is fine; we don’t need a magic format). This is the <em>contract</em>. Components are one
        consumer of it; products that won’t adopt the component library can still consume the
        tokens and look like the rest of the suite.
      </p>
      <p>
        Tokens being the product means a design language can spread further than your library can.
        That’s a feature.
      </p>
      <H3>2. A contract is written before code</H3>
      <p>
        For every component, write a doc: props, slots, ARIA, focus behavior, motion, edge cases.
        Both the React and the Angular team (or Vue, or whatever) implement <em>that doc</em>. The
        doc, not either implementation, is the canonical artifact.
      </p>
      <p>
        Contract-first sounds slow. The first six weeks ship very few components. After that it’s
        faster than the alternative — and the divergence problem doesn’t exist.
      </p>
    </>
  );
}
