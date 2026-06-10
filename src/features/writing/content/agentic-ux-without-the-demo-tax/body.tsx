import type { ReactElement } from "react";
import { Editor } from "./editor";
import { Intro } from "./intro";
import { Practice } from "./practice";
import { Recovery } from "./recovery";
import { Streaming } from "./streaming";

export function AgenticUxWithoutTheDemoTaxBody(): ReactElement {
  return (
    <>
      <Intro />
      <Streaming />
      <Editor />
      <Recovery />
      <Practice />
    </>
  );
}
