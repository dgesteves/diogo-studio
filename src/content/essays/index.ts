import type { EssayMeta } from "@/content/schema/article";
import { agenticUxWithoutTheDemoTaxMeta } from "./agentic-ux-without-the-demo-tax/meta";
import { designSystemsThatSurviveMeta } from "./design-systems-that-survive/meta";

export const essayMetas: readonly EssayMeta[] = [
  designSystemsThatSurviveMeta,
  agenticUxWithoutTheDemoTaxMeta,
];
