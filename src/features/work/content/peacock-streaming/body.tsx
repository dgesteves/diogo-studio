import type { ReactElement } from "react";
import { Architecture } from "./architecture";
import { Closing } from "./closing";
import { Decisions } from "./decisions";
import { Habits } from "./habits";
import { Intro } from "./intro";
import { Surface } from "./surface";

export function PeacockStreamingBody(): ReactElement {
  return (
    <>
      <Intro />
      <Surface />
      <Architecture />
      <Habits />
      <Decisions />
      <Closing />
    </>
  );
}
