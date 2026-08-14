import "server-only";

import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const stack: Destination = {
  ...getStationEntry("stack"),
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
      items: ["AWS · Vercel · GCP", "CI/CD & trunk-based delivery", "Playwright", "Observability"],
    },
    {
      kind: "list",
      title: "Earlier lives",
      items: ["Angular", "Redux / RxJS", ".NET Core"],
    },
  ],
};
