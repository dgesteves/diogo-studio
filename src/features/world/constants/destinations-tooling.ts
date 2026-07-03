import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const toolingDestinations: readonly Destination[] = [
  {
    slug: "stack",
    href: routes.stack,
    label: "Stack",
    eyebrow: "The toolkit",
    title: "The technical stack behind the work.",
    summary: "Languages, frameworks, and platforms Diogo Esteves builds with.",
    blocks: [
      {
        kind: "lede",
        text: "The daily toolkit — fluent, in production, at scale. Not a logo wall: everything here has shipped for real users.",
      },
      {
        kind: "list",
        title: "Core",
        items: ["TypeScript", "React", "Next.js", "Node.js", "Nest.js"],
      },
      {
        kind: "list",
        title: "Data & APIs",
        items: ["GraphQL", "REST / BFF", "Typed contracts end-to-end"],
      },
      {
        kind: "list",
        title: "AI-native",
        items: [
          "OpenAI APIs",
          "RAG pipelines & vector search",
          "Agentic workflow UX",
          "Eval tooling",
        ],
      },
      {
        kind: "list",
        title: "Platform & systems",
        items: [
          "Design-system platforms",
          "Monorepos & micro frontends",
          "TailwindCSS",
          "R3F / WebGL",
        ],
      },
      {
        kind: "list",
        title: "Cloud & quality",
        items: [
          "AWS · Vercel · GCP",
          "CI/CD & trunk-based delivery",
          "Playwright",
          "Observability",
        ],
      },
      {
        kind: "list",
        title: "Earlier lives",
        items: ["Angular", "Redux / RxJS", ".NET Core"],
      },
    ],
  },
  {
    slug: "uses",
    href: routes.uses,
    label: "Uses",
    eyebrow: "The rig",
    title: "Three monitors, one focus.",
    summary: "The hardware, software, and rig Diogo Esteves ships the work from.",
    blocks: [
      {
        kind: "lede",
        text: "Live signals from the rig the work ships from — runtime on the left, ops telemetry in the center, perf and latency on the right.",
      },
      {
        kind: "list",
        title: "Daily drivers",
        items: [
          "Three-monitor desk setup tuned for flow — the one modeled in this world.",
          "VS Code with an AI pair, plus a terminal-first workflow.",
          "Figma for design-system collaboration with design leadership.",
          "Local-first, typed, test-driven development.",
        ],
      },
      {
        kind: "list",
        title: "Operating rhythm",
        items: [
          "Async by default — Lisbon base, US-aligned hours.",
          "Deep-work mornings, review and pairing afternoons.",
        ],
      },
    ],
  },
] as const;
