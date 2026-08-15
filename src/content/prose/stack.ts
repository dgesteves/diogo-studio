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
      id: "toolkit",
      kind: "lede",
      text: "The daily toolkit — fluent, in production, at scale. Not a logo wall: everything here has shipped for real users.",
    },
    {
      id: "core",
      kind: "list",
      title: "Core",
      items: ["TypeScript", "React", "Next.js", "Node.js", "Nest.js"],
    },
    {
      id: "data-and-apis",
      kind: "list",
      title: "Data & APIs",
      items: ["GraphQL", "REST / BFF", "Typed contracts end-to-end"],
    },
    {
      id: "ai-native",
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
      id: "platform",
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
      id: "cloud-and-quality",
      kind: "list",
      title: "Cloud & quality",
      items: ["AWS · Vercel · GCP", "CI/CD & trunk-based delivery", "Playwright", "Observability"],
    },
    {
      id: "earlier",
      kind: "list",
      title: "Earlier lives",
      items: ["Angular", "Redux / RxJS", ".NET Core"],
    },
  ],
};
