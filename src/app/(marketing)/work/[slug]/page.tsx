import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies } from "#content";
import { ArticleHeader } from "@/components/common/article-header";
import { MetricGrid, MetricTile } from "@/components/mdx/metric-tile";
import { MDXContent } from "@/components/mdx/mdx-content";
import { TableOfContents } from "@/components/mdx/toc";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) return {};
  return {
    title: study.title,
    description: study.description,
    alternates: { canonical: study.permalink },
    openGraph: {
      title: study.title,
      description: study.description,
      type: "article",
      url: study.permalink,
      authors: [siteConfig.name],
      publishedTime: study.publishedAt,
      modifiedTime: study.updatedAt ?? study.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: study.title,
      description: study.description,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}): Promise<ReactElement> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study || study.draft) notFound();

  const ordered = [...caseStudies]
    .filter((s) => !s.draft)
    .sort((a, b) => a.order - b.order || b.publishedAt.localeCompare(a.publishedAt));
  const idx = ordered.findIndex((s) => s.slug === study.slug);
  const next = ordered[(idx + 1) % ordered.length];

  return (
    <article
      itemScope
      itemType="https://schema.org/Article"
      className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <JsonLd
        data={articleJsonLd({
          title: study.title,
          description: study.description,
          path: study.permalink,
          datePublished: study.publishedAt,
          dateModified: study.updatedAt ?? study.publishedAt,
          section: "Case study",
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Work", path: "/work" },
          { name: study.title, path: study.permalink },
        ])}
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
        backHref="/work"
        backLabel="All case studies"
      />

      <section aria-label="Headline metrics">
        <MetricGrid>
          {study.metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              hint={metric.hint}
              tone="default"
            />
          ))}
        </MetricGrid>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="mdx-prose max-w-none lg:max-w-[68ch]">
          <MDXContent code={study.body} />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents items={study.toc} />
          </div>
        </aside>
      </div>

      {study.outcomes.length > 0 ? (
        <section
          aria-label="Outcomes"
          className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-6"
        >
          <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            Outcomes
          </p>
          <ul className="flex flex-col gap-2.5">
            {study.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="text-foreground/90 border-signal-good/40 bg-signal-good/5 rounded-md border-l-2 px-4 py-3 text-sm leading-relaxed"
              >
                {outcome}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {next && next.slug !== study.slug ? (
        <Link
          href={next.permalink}
          className="border-border bg-surface hover:border-accent/40 hover:bg-surface-muted/60 group flex items-center justify-between gap-4 rounded-lg border p-5 transition-all"
        >
          <div className="flex flex-col gap-1">
            <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
              Next case study
            </span>
            <span className="text-foreground text-base font-medium tracking-tight">
              {next.title}
            </span>
            <span className="text-muted-foreground text-xs">
              {next.company} · {next.years}
            </span>
          </div>
          <ArrowRight
            className="text-subtle-foreground group-hover:text-accent size-5 shrink-0 transition-all group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </article>
  );
}
