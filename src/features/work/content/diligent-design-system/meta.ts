import type { CaseStudyMeta } from "@/types/article";

export const diligentDesignSystemMeta: CaseStudyMeta = {
  title: "An enterprise design system that survived two frameworks",
  description:
    "Lead frontend engineer on Diligent's company-wide enterprise design system — multi-framework, governed, contributed-to by product teams, used across the company's governance suite serving Fortune-1000 customers.",
  slug: "diligent-design-system",
  publishedAt: "2025-05-22",
  company: "Diligent",
  role: "Lead Frontend Engineer · Design System",
  years: "2019–2020",
  patterns: ["design-systems", "enterprise"],
  order: 30,
  metadata: { readingTime: 5, wordCount: 1016 },
  metrics: [
    {
      label: "Frameworks",
      value: "2",
      unit: "React + Angular",
      hint: "One token + behavior contract, two rendering targets.",
    },
    {
      label: "Customers",
      value: "Fortune-1000",
      unit: "governance",
      hint: "Boards, executives, audit committees. Regulated, conservative, careful.",
    },
    {
      label: "Surface",
      value: "Suite-wide",
      unit: "product lines",
      hint: "Adopted across the company's governance product portfolio.",
    },
    {
      label: "Contribution",
      value: "Federated",
      unit: "+ governed",
      hint: "Product teams contributed components under a review model — not a gatekeeper team writing everything.",
    },
  ],
  outcomes: [
    "A token + component contract that two stacks (React and Angular) could honor without diverging — one design language for products on different runtimes.",
    "Shifted the conversation from 'when will you build component X' to 'when will product team Y contribute X back' — federation with a real review model.",
    "Set the floor for the design-system thinking I bring to every engagement after this one.",
  ],
};
