export type StackGroup = {
  category: string;
  items: { name: string; note: string }[];
};

export const colophonStack: readonly StackGroup[] = [
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
      {
        name: "Typed content blocks",
        note: "Case studies and essays authored as TypeScript data, rendered by React components.",
      },
      { name: "Zod", note: "Schema validation for forms and API payloads." },
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
] as const;

export const colophonPrinciples: readonly string[] = [
  "One signal-cyan accent, reserved for active state and live telemetry — never decoration.",
  "Every animation gates on a unified reduced-motion + low-power signal.",
  "Nothing user-visible is invented: the hero, /about, and /work all trace to one resume-backed dataset.",
  "Graceful degradation everywhere — missing API keys downgrade features, they never break pages.",
] as const;
