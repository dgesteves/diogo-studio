/**
 * How the work gets built. Client-safe — `/principles` renders these and the world's wall
 * paints them, and a fact may live in only one of those places. See `content/career.ts`
 * for why this sits beside `prose/` rather than inside it.
 */
export type Principle = {
  id: string;
  title: string;
  meta: string;
  body: string;
};

/** The stances, with the reasoning. `/principles` renders them as cards. */
export const principles: readonly Principle[] = [
  {
    id: "frontend-is-the-product",
    title: "The frontend is the product",
    meta: "Strategy",
    body: "Treat the surface users touch as the business — never a thin layer over an API.",
  },
  {
    id: "systems-over-heroics",
    title: "Systems over heroics",
    meta: "Architecture",
    body: "Turn ambiguity into composable, evolvable architectures that survive multiple product lines and team changes.",
  },
  {
    id: "ai-that-ships",
    title: "AI that ships",
    meta: "AI-native",
    body: "Agentic UX, RAG-backed flows, and human-in-the-loop review that hold up in production, not just in demos.",
  },
  {
    id: "accessibility-is-a-gate",
    title: "Accessibility is a gate",
    meta: "WCAG",
    body: "Semantic HTML, keyboard support, visible focus — a requirement inherited from boardroom and broadcast-grade software.",
  },
  {
    id: "performance-is-a-feature",
    title: "Performance is a feature",
    meta: "Core Web Vitals",
    body: "Bundle budgets, runtime optimization, and release safety — measured, not assumed. Learned at streaming scale.",
  },
  {
    id: "decide-in-the-open",
    title: "Decide in the open",
    meta: "Leadership",
    body: "RFCs, leveling rubrics, and roadmaps the whole team can reason about. High trust, async, shipping-oriented.",
  },
];

/**
 * The same operating system as one line each. The wall panel paints these, numbered,
 * because 600×800 has room for a statement and not for its reasoning — and `/principles`
 * lists them, so nothing is claimed on a canvas that a crawler cannot read.
 */
export const practices: readonly string[] = [
  "Ship small, ship often",
  "Accessibility is non-negotiable",
  "Performance is a feature",
  "Type-safe at every boundary",
  "Design systems scale teams",
  "Automate the boring parts",
  "Clarity over cleverness",
];
