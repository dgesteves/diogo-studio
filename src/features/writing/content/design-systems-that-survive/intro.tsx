import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";

export function Intro(): ReactElement {
  return (
    <>
      <p>
        I have been the lead frontend engineer on design systems at three companies. The first one
        outlived me. The second one is the one I think about most when I write this. The third one
        is still in flight.
      </p>
      <p>
        Here’s what I’ve learned about the systems that <em>survive</em> — not the ones that
        launch with a fancy Storybook, but the ones that are still used three product cycles later
        — by separating the wheat from the chaff.
      </p>
      <H2>The failure mode is never components</H2>
      <p>
        If you go on the internet looking for advice about enterprise design systems, almost all
        of it is about <em>components</em>: what variants the Button has, whether the Modal traps
        focus, whether the Tabs use <code>role=&quot;tablist&quot;</code>. This is fine, but it
        isn’t the work. Every enterprise DS I’ve seen ships those.
      </p>
      <p>
        The systems that <strong>die</strong> die at one of three places:
      </p>
    </>
  );
}
