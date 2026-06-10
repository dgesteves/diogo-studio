import type { ArticleBlock } from "@/content/schema/article-blocks";

export const habits: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Operating habits, in order of impact" },
  {
    kind: "timeline",
    phases: [
      {
        tag: "Habit 01",
        title: "Flags before features",
        dates: "every PR",
        body: "Every user-visible change shipped behind a flag, even small ones. The cost was 10 minutes of plumbing; the upside was that turning a misbehaving change off didn't require a redeploy. Once the team internalized this, the velocity tradeoff disappeared.",
      },
      {
        tag: "Habit 02",
        title: "Canary, then 1%, then 10%",
        dates: "every release",
        body: "No release went straight to 100%. Canary in CI environment, then 1% production traffic, then 10%, then full. Bad changes failed visibly in the small-percentage window and got rolled back before they were anyone's evening problem.",
      },
      {
        tag: "Habit 03",
        title: "Pre-event hardening",
        dates: "Sundays, Olympics",
        body: "Before known traffic events, we froze the surface. Code freeze, config freeze, runbook drill. The discipline wasn't sexy — it was the difference between an event being a routine Tuesday and being a Monday-morning incident review.",
      },
      {
        tag: "Habit 04",
        title: "Telemetry that explains, not just measures",
        dates: "ongoing",
        body: "We instrumented user flows, not just endpoints. A blank checkout screen at 02:13 in Detroit was a metric; debugging which version of which BFF served a stale entitlement token was the kind of question we built dashboards to answer.",
      },
    ],
  },
];
