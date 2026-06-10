import type { CaseStudyInput } from "@/content/schema/article";
import { diligentDesignSystem } from "./diligent-design-system";
import { einoAiNetworkPlanning } from "./eino-ai-network-planning";
import { peacockStreaming } from "./peacock-streaming";

export const caseStudyInputs: readonly CaseStudyInput[] = [
  einoAiNetworkPlanning,
  peacockStreaming,
  diligentDesignSystem,
];
