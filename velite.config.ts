import { defineConfig, s } from "velite";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const PATTERNS = ["ai-native", "design-systems", "streaming", "agentic-ux", "enterprise"] as const;

const prettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark-dimmed",
  },
  keepBackground: false,
  defaultLang: { block: "tsx", inline: "tsx" },
};

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
          company: s.string(),
          role: s.string(),
          years: s.string(),
          patterns: s.array(s.enum(PATTERNS)).min(1),
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
          outcomes: s.array(s.string()).min(1),
          links: s
            .array(
              s.object({
                label: s.string(),
                href: s.string().url().or(s.string().startsWith("/")),
              }),
            )
            .optional(),
          order: s.number().default(0),
          body: s.mdx(),
          excerpt: s.excerpt({ length: 240 }),
          toc: s.toc({ maxDepth: 3 }),
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
