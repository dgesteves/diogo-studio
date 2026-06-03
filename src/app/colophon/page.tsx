import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { InspectorTrigger } from "@/components/site/inspector-trigger";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Colophon",
  description: "How this site is built — stack, conventions, and the inspector overlay.",
  alternates: { canonical: "/colophon" },
};

type StackGroup = {
  category: string;
  items: { name: string; note: string }[];
};

const stack: StackGroup[] = [
  {
    category: "Framework & language",
    items: [
      {
        name: "Next.js (App Router)",
        note: "RSC, streaming, Turbopack, route-level metadata + OG.",
      },
      {
        name: "React 19",
        note: "Server Components by default; client islands where they earn it.",
      },
      {
        name: "TypeScript (strict)",
        note: "End-to-end typed contracts; t3-env for validated env vars.",
      },
    ],
  },
  {
    category: "Content & data",
    items: [
      { name: "Velite", note: "MDX → typed collections for case studies and essays." },
      { name: "Zod", note: "Schema validation for content frontmatter, forms, and API payloads." },
      { name: "Career graph", note: "One hand-tuned dataset drives the hero, /about, and /work." },
    ],
  },
  {
    category: "Design & styling",
    items: [
      {
        name: "Tailwind CSS v4",
        note: "CSS-first @theme; utilities generated from design tokens.",
      },
      { name: "OKLCH tokens", note: "Perceptually-even color; AA-checked in light and dark." },
      { name: "Geist Sans + Mono", note: "Mono carries the telemetry numerals and labels." },
      { name: "Radix + cva", note: "Accessible primitives, variant-driven component API." },
    ],
  },
  {
    category: "3D & motion",
    items: [
      {
        name: "React Three Fiber + drei",
        note: "The hero atmosphere: heatmap, radar sweep, particles.",
      },
      { name: "postprocessing", note: "Bloom, chromatic aberration, film grain, vignette." },
      { name: "Motion + Lenis", note: "Declarative animation and smooth scroll." },
      { name: "Reduced-motion store", note: "OS pref + Save-Data + override fold into one gate." },
    ],
  },
  {
    category: "Interaction & AI",
    items: [
      { name: "cmdk (⌘K)", note: "Command palette with Navigate + agentic Ask modes." },
      {
        name: "OpenAI + RAG",
        note: "Grounded answers from an embedded content index, Edge-served.",
      },
      {
        name: "react-hook-form",
        note: "The contact form — validated client + server by one schema.",
      },
      { name: "Resend + react-email", note: "Branded, rate-limited contact intake." },
    ],
  },
  {
    category: "Quality & delivery",
    items: [
      { name: "Playwright", note: "End-to-end + accessibility (axe) coverage across breakpoints." },
      { name: "Vitest", note: "Unit tests for projection math and content invariants." },
      { name: "size-limit + knip", note: "Bundle budget and dead-code guards in CI." },
      {
        name: "ESLint · Prettier · Husky",
        note: "Conventional commits, release-please automation.",
      },
    ],
  },
  {
    category: "Observability & hosting",
    items: [
      { name: "Sentry", note: "Client + server error tracing with sampled performance." },
      { name: "Vercel Analytics + Speed Insights", note: "Field web-vitals on Vercel deploys." },
      { name: "Vercel", note: "Edge network, ISR, preview deployments per PR." },
    ],
  },
];

const principles = [
  "One signal-cyan accent, reserved for active state and live telemetry — never decoration.",
  "Every animation gates on a unified reduced-motion + low-power signal.",
  "Nothing user-visible is invented: the hero, /about, and /work all trace to one resume-backed dataset.",
  "Graceful degradation everywhere — missing API keys downgrade features, they never break pages.",
];

export default function ColophonPage() {
  return (
    <section role="region" aria-labelledby="colophon-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-12 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="text-muted-foreground border-border bg-surface inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
            <StatusDot tone="good" />
            <span>Colophon</span>
          </div>

          <h1
            id="colophon-heading"
            className="text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight text-balance"
          >
            How this site is built — receipts included.
          </h1>

          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            This studio is itself a case study. The CV claims streaming-grade performance and
            AI-native interfaces; the surface you&rsquo;re reading proves it. Open the Inspector to
            watch web-vitals, 3D frame budget, and transferred JS in real time.
          </p>
        </div>

        {/* Verify it yourself */}
        <div className="border-accent/30 bg-accent-soft/40 flex flex-col gap-4 rounded-lg border p-6">
          <h2 className="text-foreground text-base font-medium tracking-tight">
            Verify the claims, live
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The Inspector overlay reads Core Web Vitals, samples{" "}
            <code className="bg-code-bg text-code-foreground rounded px-1 py-0.5 font-mono text-xs">
              WebGLRenderer.info
            </code>{" "}
            from the hero scene, and measures the JavaScript this route actually transferred — then
            lets you flip reduced-motion on the spot.
          </p>
          <InspectorTrigger />
        </div>

        {/* Stack */}
        <div className="flex flex-col gap-8">
          {stack.map((group) => (
            <div key={group.category} className="flex flex-col gap-4">
              <h2 className="text-subtle-foreground border-border border-b pb-3 font-mono text-[11px] font-medium tracking-wider uppercase">
                {group.category}
              </h2>
              <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.name} className="bg-surface flex flex-col gap-1.5 p-4">
                    <dt className="text-foreground text-sm font-medium tracking-tight">
                      {item.name}
                    </dt>
                    <dd className="text-muted-foreground text-sm leading-relaxed">{item.note}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Principles */}
        <div className="flex flex-col gap-4">
          <h2 className="text-subtle-foreground border-border border-b pb-3 font-mono text-[11px] font-medium tracking-wider uppercase">
            Operating principles
          </h2>
          <ul className="flex flex-col gap-3">
            {principles.map((p) => (
              <li key={p} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden="true"
                  className="bg-accent mt-1.5 inline-block size-1.5 shrink-0 rounded-full"
                />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Source */}
        <a
          href={`${siteConfig.links.github}/diogo-studio`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors"
        >
          Read the source on GitHub
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
