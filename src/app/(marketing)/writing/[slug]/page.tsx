import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { ArticleHeader } from "@/components/common/article-header";
import { ArticleBody } from "@/components/common/article-body";
import { NextArticleLink } from "@/components/common/next-article-link";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import { essays } from "@/lib/content/essays";
import { nextPublished } from "@/lib/content/next-published";
import { sortPublished } from "@/lib/content/sort-published";
import { buildArticleMetadata } from "@/lib/seo/article-metadata";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return essays.map((essay) => ({ slug: essay.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const essay = essays.find((e) => e.slug === slug);
  if (!essay) return {};
  return buildArticleMetadata({
    title: essay.title,
    description: essay.description,
    permalink: essay.permalink,
    publishedAt: essay.publishedAt,
    updatedAt: essay.updatedAt,
  });
}

export default async function EssayPage({
  params,
}: {
  params: Promise<Params>;
}): Promise<ReactElement> {
  const { slug } = await params;
  const essay = essays.find((e) => e.slug === slug);
  if (!essay || essay.draft) notFound();

  const next = nextPublished(sortPublished(essays), essay.slug);

  return (
    <article
      itemScope
      itemType="https://schema.org/Article"
      className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <ArticleJsonLd
        title={essay.title}
        description={essay.description}
        permalink={essay.permalink}
        publishedAt={essay.publishedAt}
        updatedAt={essay.updatedAt}
        section="Essay"
        crumbName="Writing"
        crumbPath={routes.writing}
      />

      <ArticleHeader
        eyebrow="Essay"
        title={essay.title}
        dek={essay.dek}
        description={essay.description}
        facts={[
          { label: "Reading time", value: `${essay.metadata.readingTime} min` },
          { label: "Word count", value: `${essay.metadata.wordCount}` },
          { label: "Published", value: essay.publishedAt.slice(0, 10) },
          { label: "Last updated", value: (essay.updatedAt ?? essay.publishedAt).slice(0, 10) },
        ]}
        patterns={essay.patterns}
        backHref={routes.writing}
        backLabel="All essays"
      />

      <ArticleBody blocks={essay.body} toc={essay.toc} />

      {next ? (
        <NextArticleLink
          href={next.permalink}
          eyebrow="Next essay"
          title={next.title}
          subtitle={`${next.metadata.readingTime} min read`}
        />
      ) : null}
    </article>
  );
}
