import type { ReactElement } from "react";
import { Architecture } from "./architecture";
import { Closing } from "./closing";
import { Decisions } from "./decisions";
import { Intro } from "./intro";
import { Product } from "./product";
import { DeliveryTimeline } from "./timeline";

export function EinoAiNetworkPlanningBody(): ReactElement {
  return (
    <>
      <Intro />
      <Product />
      <Architecture />
      <DeliveryTimeline />
      <Decisions />
      <Closing />
    </>
  );
}
