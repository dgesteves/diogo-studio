import { caseStudyMetas } from "@/features/work/content";
import { defineCaseStudy } from "@/lib/content/define-article";

export type { CaseStudy } from "@/lib/content/define-article";

export const caseStudies = caseStudyMetas.map(defineCaseStudy);
