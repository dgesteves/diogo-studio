import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export function buildArticleMetadata({
  title,
  description,
  permalink,
  publishedAt,
  updatedAt,
}: {
  title: string;
  description: string;
  permalink: string;
  publishedAt: string;
  updatedAt?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: permalink },
    openGraph: {
      title,
      description,
      type: "article",
      url: permalink,
      authors: [siteConfig.name],
      publishedTime: publishedAt,
      modifiedTime: updatedAt ?? publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
