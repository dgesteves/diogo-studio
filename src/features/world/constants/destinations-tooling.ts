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
        kind: "list",
        title: "Languages & core web",
        items: ["TypeScript", "JavaScript (ES2015+)", "HTML5 / CSS3", "Web Components"],
      },
      {
        kind: "list",
        title: "Frontend",
        items: ["React", "Next.js", "Angular", "RxJS", "Zustand / Redux", "Server Components"],
      },
      {
        kind: "list",
        title: "Styling & UI",
        items: ["TailwindCSS", "Radix", "Design tokens", "CSS-in-JS"],
      },
      {
        kind: "list",
        title: "Backend & platform",
        items: ["Node.js", "Nest.js", "GraphQL", "REST / BFF", ".NET Core (legacy)"],
      },
      {
        kind: "list",
        title: "AI & tooling",
        items: [
          "OpenAI APIs",
          "RAG pipelines",
          "Vector search",
          "Agentic workflow UX",
          "Eval tooling",
        ],
      },
      {
        kind: "list",
        title: "DevOps & quality",
        items: ["AWS / Vercel / GCP", "Docker", "GitHub Actions", "Playwright", "Observability"],
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
          "Three-monitor desk setup tuned for flow.",
          "VS Code + terminal-first workflow.",
          "Figma for design-system collaboration.",
          "Local-first, typed, test-driven development.",
        ],
      },
    ],
  },
] as const;
