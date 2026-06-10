import type { CaseStudyMeta } from "@/types/article";
import { diligentDesignSystemMeta } from "./diligent-design-system/meta";
import { einoAiNetworkPlanningMeta } from "./eino-ai-network-planning/meta";
import { peacockStreamingMeta } from "./peacock-streaming/meta";

export const caseStudyMetas: readonly CaseStudyMeta[] = [
  einoAiNetworkPlanningMeta,
  peacockStreamingMeta,
  diligentDesignSystemMeta,
];
