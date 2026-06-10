import type { ReactElement } from "react";
import { Architecture } from "./architecture";
import { Brief } from "./brief";
import { Closing } from "./closing";
import { Decisions } from "./decisions";
import { Intro } from "./intro";
import { Phases } from "./phases";

export function DiligentDesignSystemBody(): ReactElement {
  return (
    <>
      <Intro />
      <Brief />
      <Architecture />
      <Phases />
      <Decisions />
      <Closing />
    </>
  );
}
