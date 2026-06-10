import type { ComponentType } from "react";
import { AgenticUxWithoutTheDemoTaxBody } from "./agentic-ux-without-the-demo-tax/body";
import { DesignSystemsThatSurviveBody } from "./design-systems-that-survive/body";

export const essayBodies: Readonly<Record<string, ComponentType>> = {
  "agentic-ux-without-the-demo-tax": AgenticUxWithoutTheDemoTaxBody,
  "design-systems-that-survive": DesignSystemsThatSurviveBody,
};
