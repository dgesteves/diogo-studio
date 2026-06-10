import { caseStudyInputs } from "@/content/case-studies";
import { defineCaseStudy } from "./define-article";

export type { CaseStudy } from "./define-article";

export const caseStudies = caseStudyInputs.map(defineCaseStudy);
