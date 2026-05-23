import { defineConfig, s } from "velite";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

/**
 * Velite — Phase 3 content layer.
 *
 * Authored MDX in `src/content/{case-studies,essays}` is compiled at build
 * time into `.velite/`, exposing typed collections we import as plain
 * JS/JSON in Server Components.
 *
 * Why velite (over contentlayer / mdx-bundler / next-mdx-remote):
 * - Type-safe via zod schemas (same primitives we use everywhere).
 * - Pure build-time — zero MDX runtime, zero client JS for prose.
 * - Plays nicely with Turbopack (runs as a `prebuild` step, see package.json).
 * - Honors our shiki / rehype-pretty-code highlight stack directly.
 *
 * Decisions worth knowing:
 * - Patterns are typed as a literal union mirroring `src/content/career-graph.ts`
 *   so `/work` pattern filters and the career-graph stay in lockstep.
 * - All case studies must declare at least one outcome — the "show, don't
 *   claim" rule from the blueprint (§10) is enforced by schema, not vibes.
 * - Code blocks compile to highlighted HTML at build time; the `<Code />`
 *   MDX component is just a styling shell.
 */

const PATTERNS = ["ai-native", "design-systems", "streaming", "agentic-ux", "enterprise"] as const;

/* ---------------------------------------------------------------------------
 * rehype-pretty-code config — VS Code grammar, light + dark themes that
 * match the site's surface tokens (`oklch` ink-on-paper / deep-space).
 * ------------------------------------------------------------------------- */

const prettyCodeOptions = {
  // `github-light` + `github-dark-dimmed` mirror the tones our token system
  // already uses (low-saturation grays, restrained accents). Two themes ship
  // so `prefers-color-scheme` flips highlighting without a JS hop.
  theme: {
    light: "github-light",
    dark: "github-dark-dimmed",
  },
  keepBackground: false,
  defaultLang: { block: "tsx", inline: "tsx" },
};

/* ---------------------------------------------------------------------------
 * Shared metadata fields used by both case studies and essays.
 * ------------------------------------------------------------------------- */

const baseMeta = {
  title: s.string().max(140),
  description: s.string().max(280),
  publishedAt: s.isodate(),
  updatedAt: s.isodate().optional(),
  draft: s.boolean().default(false),
};

export default defineConfig({
  root: "src/content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    caseStudies: {
      name: "CaseStudy",
      pattern: "case-studies/**/*.mdx",
      schema: s
        .object({
          ...baseMeta,
          slug: s.slug("case-study"),
          // Engagement metadata — surfaced in the header and in /work filters.
          company: s.string(),
          role: s.string(),
          years: s.string(),
          patterns: s.array(s.enum(PATTERNS)).min(1),
          // Headline metrics — rendered as MetricTiles above the fold.
          // 2-4 keeps the dashboard readable; schema enforces it.
          metrics: s
            .array(
              s.object({
                label: s.string(),
                value: s.string(),
                unit: s.string().optional(),
                hint: s.string().optional(),
              }),
            )
            .min(2)
            .max(4),
          // Outcomes — at least one is mandatory. Show, don't claim.
          outcomes: s.array(s.string()).min(1),
          // Optional companion deep-links surfaced in the header strip.
          links: s
            .array(
              s.object({
                label: s.string(),
                href: s.string().url().or(s.string().startsWith("/")),
              }),
            )
            .optional(),
          // Order index — lets us hand-order /work without depending on dates.
          order: s.number().default(0),
          // Compiled MDX + plain-text excerpt for previews + OG.
          body: s.mdx(),
          excerpt: s.excerpt({ length: 240 }),
          // Auto-derived: a flat heading list for the TOC.
          toc: s.toc({ maxDepth: 3 }),
          // Reading-time + word count derived from raw markdown (not the
          // compiled MDX bundle), so figures match what a human would read.
          metadata: s.metadata(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/work/${data.slug}`,
        })),
    },
    essays: {
      name: "Essay",
      pattern: "essays/**/*.mdx",
      schema: s
        .object({
          ...baseMeta,
          slug: s.slug("essay"),
          patterns: s.array(s.enum(PATTERNS)).min(1),
          // Optional 1-line dek under the title; falls back to `description`.
          dek: s.string().max(280).optional(),
          order: s.number().default(0),
          body: s.mdx(),
          excerpt: s.excerpt({ length: 240 }),
          toc: s.toc({ maxDepth: 3 }),
          metadata: s.metadata(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/writing/${data.slug}`,
        })),
    },
  },
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, prettyCodeOptions],
      // Auto-link headings — anchor is a real `<a>` so it works without JS.
      // Visual styling is in `mdx.css`.
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["mdx-anchor"],
            "aria-hidden": "true",
            tabIndex: -1,
          },
          content: { type: "text", value: "#" },
        },
      ],
    ],
  },
});
