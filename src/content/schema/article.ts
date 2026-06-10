import type { PatternId } from "@/content/data/patterns";
import type { ArticleBlock, MetricItem } from "./article-blocks";

export type ArticleLink = {
  label: string;
  href: string;
};

export type ArticleInput = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  draft?: boolean;
  patterns: readonly PatternId[];
  order: number;
  body: readonly ArticleBlock[];
};

export type CaseStudyInput = ArticleInput & {
  company: string;
  role: string;
  years: string;
  metrics: readonly MetricItem[];
  outcomes: readonly string[];
  links?: readonly ArticleLink[];
};

export type EssayInput = ArticleInput & {
  dek?: string;
};
