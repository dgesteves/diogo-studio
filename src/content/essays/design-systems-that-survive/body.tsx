import type { ReactElement } from "react";
import { ActualWork } from "./actual-work";
import { Contribution } from "./contribution";
import { FailureModes } from "./failure-modes";
import { Intro } from "./intro";
import { Metrics } from "./metrics";

export function DesignSystemsThatSurviveBody(): ReactElement {
  return (
    <>
      <Intro />
      <FailureModes />
      <ActualWork />
      <Contribution />
      <Metrics />
    </>
  );
}
