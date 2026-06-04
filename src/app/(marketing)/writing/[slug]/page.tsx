import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { essays } from "#content";
import { ArticleHeader } from "@/components/common/article-header";
import { MDXContent } from "@/components/mdx/mdx-content";
import { TableOfContents } from "@/components/mdx/toc";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return essays.map((essay) => ({ slug: essay.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const essay = essays.find((e) => e.slug === slug);
  if (!essay) return {};
  return {
    title: essay.title,
    description: essay.description,
    alternates: { canonical: essay.permalink },
    openGraph: {
      title: essay.title,
      description: essay.description,
      type: "article",
      url: essay.permalink,
      authors: [siteConfig.name],
      publishedTime: essay.publishedAt,
      modifiedTime: essay.updatedAt ?? essay.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: essay.title,
      description: essay.description,
    },
  };
}

export default async function EssayPage({
  params,
}: {
  params: Promise<Params>;
}): Promise<ReactElement> {
  const { slug } = await params;
  const essay = essays.find((e) => e.slug === slug);
  if (!essay || essay.draft) notFound();

  const ordered = [...essays]
    .filter((e) => !e.draft)
    .sort((a, b) => a.order - b.order || b.publishedAt.localeCompare(a.publishedAt));
  const idx = ordered.findIndex((e) => e.slug === essay.slug);
  const next = ordered[(idx + 1) % ordered.length];

  return (
    <article
      itemScope
      itemType="https://schema.org/Article"
      className="relative mx-auto flex max-w-5xl flex-col gap-12 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <JsonLd
        data={articleJsonLd({
          title: essay.title,
          description: essay.description,
          path: essay.permalink,
          datePublished: essay.publishedAt,
          dateModified: essay.updatedAt ?? essay.publishedAt,
          section: "Essay",
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Writing", path: "/writing" },
          { name: essay.title, path: essay.permalink },
        ])}
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
        backHref="/writing"
        backLabel="All essays"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="mdx-prose max-w-none lg:max-w-[68ch]">
          <MDXContent code={essay.body} />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents items={essay.toc} />
          </div>
        </aside>
      </div>

      {next && next.slug !== essay.slug ? (
        <Link
          href={next.permalink}
          className="border-border bg-surface hover:border-accent/40 hover:bg-surface-muted/60 group flex items-center justify-between gap-4 rounded-lg border p-5 transition-all"
        >
          <div className="flex flex-col gap-1">
            <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
              Next essay
            </span>
            <span className="text-foreground text-base font-medium tracking-tight">
              {next.title}
            </span>
            <span className="text-muted-foreground text-xs">
              {next.metadata.readingTime} min read
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
