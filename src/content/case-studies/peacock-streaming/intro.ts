import type { ArticleBlock } from "@/content/schema/article-blocks";

export const intro: readonly ArticleBlock[] = [
  {
    kind: "paragraph",
    text: 'The honest framing of this one: I was not a system architect at Peacock. I was a senior engineer on web surfaces during a period when "don\'t be the reason it broke" mattered more than "ship the clever idea." The case study is about the working habits that produced quietly reliable code at that scale.',
  },
  {
    kind: "paragraph",
    text: "If you're hiring me for streaming-grade work, this is the engagement where I learned what the words *streaming-grade* actually mean.",
  },
  {
    kind: "metrics",
    items: [
      {
        label: "Concurrent sessions",
        value: "Peak",
        unit: "live events",
        tone: "hot",
        hint: "NFL Sunday + marquee Olympic moments stress every surface, not just the player.",
        sparkline: {
          values: [20, 22, 26, 35, 60, 95, 88, 70, 52, 38, 28, 22],
          tone: "hot",
          ariaLabel: "Concurrent session spikes",
        },
      },
      {
        label: "Web TTI",
        value: "< 3s",
        unit: "median",
        tone: "good",
        hint: "Performance budgets on the auth, landing, and account surfaces — measured continuously.",
        sparkline: {
          values: [44, 42, 39, 38, 36, 34, 32, 31, 30, 29, 28, 28],
          tone: "good",
          ariaLabel: "TTI trend over time",
        },
      },
      {
        label: "Rollback distance",
        value: "Single",
        unit: "commit",
        tone: "accent",
        hint: "Every change had to be revertable without redeploying upstream services.",
      },
      {
        label: "On-call posture",
        value: "Rehearsed",
        unit: "for events",
        tone: "warn",
        hint: "Pre-event runbooks; during-event eyes-on; post-event retros.",
      },
    ],
  },
  {
    kind: "stack",
    label: "Stack",
    items: [
      "React",
      "TypeScript",
      "Redux",
      "RxJS",
      "Node BFFs",
      "Splunk",
      "Datadog",
      "Feature flags + canary",
    ],
  },
];
