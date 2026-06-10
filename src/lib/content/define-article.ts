import { routes } from "@/config/routes";
import type { ArticleInput, CaseStudyInput, EssayInput } from "@/content/schema/article";
import type { TocItem } from "@/content/schema/toc";
import { articleText } from "./article-text";
import { deriveToc } from "./derive-toc";
import { deriveReadingStats, type ReadingStats } from "./reading-stats";

type ArticleComputed = {
  permalink: string;
  draft: boolean;
  toc: TocItem[];
  metadata: ReadingStats;
};

export type CaseStudy = CaseStudyInput & ArticleComputed;
export type Essay = EssayInput & ArticleComputed;

function compute(input: ArticleInput, basePath: string): ArticleComputed {
  return {
    permalink: `${basePath}/${input.slug}`,
    draft: input.draft ?? false,
    toc: deriveToc(input.body),
    metadata: deriveReadingStats(articleText(input.body)),
  };
}

export function defineCaseStudy(input: CaseStudyInput): CaseStudy {
  return { ...input, ...compute(input, routes.work) };
}

export function defineEssay(input: EssayInput): Essay {
  return { ...input, ...compute(input, routes.writing) };
}
