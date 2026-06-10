import type { ArticleBlock } from "@/content/schema/article-blocks";

export const intro: readonly ArticleBlock[] = [
  {
    kind: "paragraph",
    text: "Diligent ships governance software to Fortune-1000-class boards, executives, and audit committees. The product surface is conservative, regulated, and serious — exactly the constituency that benefits from a design system, and exactly the constituency that punishes a bad one.",
  },
  {
    kind: "paragraph",
    text: 'I led the frontend side of Diligent\'s company-wide design system in 2019–2020. The interesting parts of this case study are not "we shipped Buttons and Modals." Every enterprise DS does. The interesting parts are how the system survived running on two frameworks, and how contribution got federated without losing coherence.',
  },
  {
    kind: "metrics",
    items: [
      {
        label: "Tokens",
        value: "Single",
        unit: "source",
        tone: "accent",
        hint: "Colors, type, spacing, motion — declared once, consumed everywhere.",
      },
      {
        label: "Component coverage",
        value: "Foundational",
        unit: "primitives",
        tone: "good",
        hint: "Layout, form, feedback, navigation — the spine of every product.",
      },
      {
        label: "Adoption",
        value: "Pull",
        unit: "model",
        tone: "default",
        hint: "Product teams adopted at their own pace; nothing was forced from the center.",
      },
      {
        label: "A11y",
        value: "WCAG AA",
        unit: "baseline",
        tone: "warn",
        hint: "Governance products carry a higher bar; a11y was non-negotiable, not a stretch goal.",
      },
    ],
  },
  {
    kind: "stack",
    label: "Surface area",
    items: [
      "Design tokens (JSON)",
      "React + TypeScript",
      "Angular + TypeScript",
      "Storybook",
      "Style Dictionary",
      "Versioned packages",
      "RFC + contribution model",
      "WCAG AA tooling",
    ],
  },
  { kind: "heading", level: 2, text: "The brief, in one paragraph" },
  {
    kind: "paragraph",
    text: "Diligent had bought and built product lines across years; the suite spoke with several mildly different voices. The new design system was asked to do three things at once: unify the voice without a rewrite, let two framework communities consume it without forking, and create a path for product teams to *contribute* components without breaking the center.",
  },
  {
    kind: "paragraph",
    text: "That third one is the hard one. Most enterprise design systems die not from missing components but from a contribution model that can't keep up with product teams' velocity.",
  },
];
