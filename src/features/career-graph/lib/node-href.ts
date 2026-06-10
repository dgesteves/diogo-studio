import { caseStudyPath, routes } from "@/constants/routes";
import type { CareerNode } from "@/content/data/career-graph-nodes";

export const PUBLISHED_CASE_STUDY_SLUGS = new Set<string>([
  "eino-ai-network-planning",
  "peacock-streaming",
  "diligent-design-system",
]);

export function nodeHref(node: CareerNode): string {
  if (node.slug && PUBLISHED_CASE_STUDY_SLUGS.has(node.slug)) {
    return caseStudyPath(node.slug);
  }
  return routes.work;
}
