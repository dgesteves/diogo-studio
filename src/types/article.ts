import type { PatternId } from "@/data/patterns";

export type ArticleLink = {
  label: string;
  href: string;
};

export type HeadlineMetric = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
};

export type ReadingStats = {
  readingTime: number;
  wordCount: number;
};

export type ArticleMeta = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  draft?: boolean;
  patterns: readonly PatternId[];
  order: number;
  metadata: ReadingStats;
};

export type CaseStudyMeta = ArticleMeta & {
  company: string;
  role: string;
  years: string;
  metrics: readonly HeadlineMetric[];
  outcomes: readonly string[];
  links?: readonly ArticleLink[];
};

export type EssayMeta = ArticleMeta & {
  dek?: string;
};
