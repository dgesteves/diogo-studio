export const CODE_TOKENS = {
  keyword: "#7dd3fc",
  fn: "#a5f3fc",
  string: "#fcd34d",
  comment: "rgba(232, 246, 252, 0.42)",
  punct: "rgba(232, 246, 252, 0.72)",
  type: "#86efac",
  text: "rgba(232, 246, 252, 0.92)",
} as const;

type TokenKind = keyof typeof CODE_TOKENS;
type Token = { k: TokenKind; t: string };
type CodeLine = Token[];

export const CODE_LINES: CodeLine[] = [
  [{ k: "comment", t: "// Inspectable agent runtime · streams steps" }],
  [
    { k: "keyword", t: "export" },
    { k: "text", t: " " },
    { k: "keyword", t: "async" },
    { k: "text", t: " " },
    { k: "keyword", t: "function" },
    { k: "text", t: " " },
    { k: "fn", t: "run" },
    { k: "punct", t: "(input: " },
    { k: "type", t: "AgentInput" },
    { k: "punct", t: ") {" },
  ],
  [
    { k: "text", t: "  " },
    { k: "keyword", t: "const" },
    { k: "text", t: " ctx = " },
    { k: "keyword", t: "await" },
    { k: "text", t: " " },
    { k: "fn", t: "buildContext" },
    { k: "punct", t: "(input);" },
  ],
  [
    { k: "text", t: "  " },
    { k: "keyword", t: "for await" },
    { k: "punct", t: " (const step of " },
    { k: "fn", t: "plan" },
    { k: "punct", t: "(ctx)) {" },
  ],
  [
    { k: "text", t: "    " },
    { k: "keyword", t: "if" },
    { k: "punct", t: " (step.kind === " },
    { k: "string", t: '"tool"' },
    { k: "punct", t: ") {" },
  ],
  [
    { k: "text", t: "      " },
    { k: "keyword", t: "await" },
    { k: "text", t: " " },
    { k: "fn", t: "execute" },
    { k: "punct", t: "(step);" },
  ],
  [
    { k: "text", t: "    } " },
    { k: "keyword", t: "else if" },
    { k: "punct", t: " (step.kind === " },
    { k: "string", t: '"answer"' },
    { k: "punct", t: ") {" },
  ],
  [
    { k: "text", t: "      " },
    { k: "keyword", t: "return" },
    { k: "text", t: " step.payload;" },
  ],
  [{ k: "text", t: "    }" }],
  [{ k: "text", t: "  }" }],
  [{ k: "text", t: "}" }],
];
