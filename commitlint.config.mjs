/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // `config-conventional` hard-wraps body and footer lines at 100 chars.
    // That's hostile to paste-in context (URLs, stack traces, AI summaries,
    // long bullet rationale). Disable both line-length caps; the
    // 100-char *header* limit stays in place so commit titles remain tidy.
    "body-max-line-length": [0, "always", Infinity],
    "footer-max-line-length": [0, "always", Infinity],
  },
};

export default config;
