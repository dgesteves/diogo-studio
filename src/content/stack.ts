/**
 * The technical stack. Client-safe — `/stack` renders these groups as lists and the
 * world's wall paints them as chips; see `content/career.ts` for why that requires one
 * module outside `prose/`.
 *
 * Everything named here has shipped for real users. The wall panel used to carry its own
 * copy and drifted into advertising GSAP and shadcn/ui, neither of which this project has
 * ever depended on — which is the whole reason the list lives in one place now.
 */
export type StackGroup = {
  id: string;
  label: string;
  items: readonly string[];
};

export const stackGroups: readonly StackGroup[] = [
  {
    id: "core",
    label: "Core",
    items: ["TypeScript", "React", "Next.js", "Node.js", "Nest.js"],
  },
  {
    id: "data-and-apis",
    label: "Data & APIs",
    items: ["GraphQL", "REST / BFF", "Typed contracts end-to-end"],
  },
  {
    id: "ai-native",
    label: "AI-native",
    items: ["OpenAI APIs", "RAG pipelines & vector search", "Agentic workflow UX", "Eval tooling"],
  },
  {
    id: "platform",
    label: "Platform & systems",
    items: ["Design-system platforms", "Monorepos & micro frontends", "TailwindCSS", "R3F / WebGL"],
  },
  {
    id: "cloud-and-quality",
    label: "Cloud & quality",
    items: ["AWS · Vercel · GCP", "CI/CD & trunk-based delivery", "Playwright", "Observability"],
  },
  {
    id: "earlier",
    label: "Earlier lives",
    items: ["Angular", "Redux / RxJS", ".NET Core"],
  },
];
