import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";

export function Brief(): ReactElement {
  return (
    <>
      <H2>The brief, in one paragraph</H2>
      <p>
        Diligent had bought and built product lines across years; the suite spoke with several
        mildly different voices. The new design system was asked to do three things at once: unify
        the voice without a rewrite, let two framework communities consume it without forking, and
        create a path for product teams to <em>contribute</em> components without breaking the
        center.
      </p>
      <p>
        That third one is the hard one. Most enterprise design systems die not from missing
        components but from a contribution model that can’t keep up with product teams’ velocity.
      </p>
    </>
  );
}
