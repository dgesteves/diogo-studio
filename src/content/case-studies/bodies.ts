import type { ComponentType } from "react";
import { DiligentDesignSystemBody } from "./diligent-design-system/body";
import { EinoAiNetworkPlanningBody } from "./eino-ai-network-planning/body";
import { PeacockStreamingBody } from "./peacock-streaming/body";

export const caseStudyBodies: Readonly<Record<string, ComponentType>> = {
  "eino-ai-network-planning": EinoAiNetworkPlanningBody,
  "peacock-streaming": PeacockStreamingBody,
  "diligent-design-system": DiligentDesignSystemBody,
};
