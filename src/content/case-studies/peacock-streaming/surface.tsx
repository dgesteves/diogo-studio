import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";

export function Surface(): ReactElement {
  return (
    <>
      <H2>What the surface actually was</H2>
      <p>
        Peacock’s web property is the non-player half of the streaming experience: auth, sign-up,
        billing, account, content browse, error recovery, deep-linking from native apps. None of
        it is glamorous in isolation; in aggregate it’s the surface that decides whether a viewer
        ever reaches the player on Sunday afternoon.
      </p>
      <p>
        The work was less “design a system” and more “operate a system that already exists at
        scale, without making it worse.” This was where I internalized that for senior engineers
        in operating-scale companies, the unsexy parts — release safety, observability, runbooks —{" "}
        <em>are</em> the craft.
      </p>
    </>
  );
}
