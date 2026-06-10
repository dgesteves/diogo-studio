export type UseItem = {
  name: string;
  note: string;
  pending?: boolean;
};

export type UseGroup = {
  category: string;
  items: UseItem[];
};

export const usesGroups: readonly UseGroup[] = [
  {
    category: "Hardware",
    items: [
      { name: "Laptop", note: "Apple Silicon MacBook Pro — exact model pending.", pending: true },
      { name: "Display", note: "External monitor + stand.", pending: true },
      { name: "Keyboard & mouse", note: "Daily-driver input gear.", pending: true },
      { name: "Audio", note: "Headphones for deep work and calls.", pending: true },
    ],
  },
  {
    category: "Editor & terminal",
    items: [
      { name: "VS Code", note: "Primary editor — workspace ships pinned extensions + settings." },
      { name: "zsh", note: "Shell of choice for everyday work." },
      { name: "Terminal app", note: "Preferred terminal emulator.", pending: true },
      { name: "Theme & font", note: "Editor color theme and coding font.", pending: true },
    ],
  },
  {
    category: "Stack I reach for",
    items: [
      { name: "TypeScript", note: "Strict mode, end-to-end typed contracts." },
      { name: "React + Next.js", note: "App Router, Server Components, streaming." },
      { name: "Tailwind CSS", note: "Token-driven styling; CSS-first config." },
      { name: "pnpm + Node (via nvm)", note: "Fast, content-addressable installs; pinned Node." },
    ],
  },
  {
    category: "Services & ops",
    items: [
      { name: "Vercel", note: "Hosting, preview deploys, edge network." },
      { name: "GitHub Actions", note: "CI: lint, typecheck, test, size budgets." },
      { name: "Sentry", note: "Error tracing across client and server." },
      {
        name: "OpenAI · Resend · Upstash",
        note: "RAG answers, transactional email, rate limiting.",
      },
    ],
  },
  {
    category: "Design & everyday",
    items: [
      { name: "Figma", note: "Design exploration and hand-off.", pending: true },
      { name: "Browser", note: "Primary browser + dev tooling.", pending: true },
      { name: "Notes & tasks", note: "Where the thinking and planning live.", pending: true },
      { name: "Music", note: "Focus soundtrack.", pending: true },
    ],
  },
] as const;
