import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { ArticleMetrics } from "@/components/article/article-metrics";
import { ArticleHeader } from "@/components/common/article-header";
import { ArticleBody } from "@/components/common/article-body";
import { ArticleOutcomes } from "@/components/common/article-outcomes";
import { NextArticleLink } from "@/components/common/next-article-link";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import { caseStudyBodies } from "@/content/case-studies/bodies";
import { caseStudies } from "@/lib/content/case-studies";
import { nextPublished } from "@/lib/content/next-published";
import { sortPublished } from "@/lib/content/sort-published";
import { buildArticleMetadata } from "@/lib/seo/article-metadata";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) return {};
  return buildArticleMetadata({
    title: study.title,
    description: study.description,
    permalink: study.permalink,
    publishedAt: study.publishedAt,
    updatedAt: study.updatedAt,
  });
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}): Promise<ReactElement> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  const Body = caseStudyBodies[slug];
  if (!study || study.draft || !Body) notFound();

  const next = nextPublished(sortPublished(caseStudies), study.slug);

  return (
    <article
      itemScope
      itemType="https://schema.org/Article"
      className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <ArticleJsonLd
        title={study.title}
        description={study.description}
        permalink={study.permalink}
        publishedAt={study.publishedAt}
        updatedAt={study.updatedAt}
        section="Case study"
        crumbName="Work"
        crumbPath={routes.work}
      />

      <ArticleHeader
        eyebrow={`Case study · ${study.company}`}
        title={study.title}
        dek={study.description}
        description={study.description}
        facts={[
          { label: "Role", value: study.role },
          { label: "Years", value: study.years },
          { label: "Reading time", value: `${study.metadata.readingTime} min` },
          { label: "Last updated", value: (study.updatedAt ?? study.publishedAt).slice(0, 10) },
        ]}
        patterns={study.patterns}
        links={study.links}
        backHref={routes.work}
        backLabel="All case studies"
      />

      <section aria-label="Headline metrics">
        <ArticleMetrics items={study.metrics} />
      </section>

      <ArticleBody>
        <Body />
      </ArticleBody>

      <ArticleOutcomes outcomes={study.outcomes} />

      {next ? (
        <NextArticleLink
          href={next.permalink}
          eyebrow="Next case study"
          title={next.title}
          subtitle={`${next.company} · ${next.years}`}
        />
      ) : null}
    </article>
  );
}
