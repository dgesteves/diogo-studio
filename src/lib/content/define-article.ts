import { routes } from "@/config/routes";
import type { ArticleMeta, CaseStudyMeta, EssayMeta } from "@/content/schema/article";

type ArticleComputed = {
  permalink: string;
  draft: boolean;
};

export type CaseStudy = CaseStudyMeta & ArticleComputed;
export type Essay = EssayMeta & ArticleComputed;

function compute(meta: ArticleMeta, basePath: string): ArticleComputed {
  return {
    permalink: `${basePath}/${meta.slug}`,
    draft: meta.draft ?? false,
  };
}

export function defineCaseStudy(meta: CaseStudyMeta): CaseStudy {
  return { ...meta, ...compute(meta, routes.work) };
}

export function defineEssay(meta: EssayMeta): Essay {
  return { ...meta, ...compute(meta, routes.writing) };
}
