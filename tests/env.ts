import type { env as appEnv } from "@/env";

export type TestEnv = { -readonly [K in keyof typeof appEnv]: (typeof appEnv)[K] };

// Only the vars with a schema default are required here, so adding a new required var
// to `@/env` fails typecheck until this baseline accounts for it.
const DEFAULTS: TestEnv = {
  NODE_ENV: "test",
  OPENAI_CHAT_MODEL: "gpt-4o-mini",
  OPENAI_EMBED_MODEL: "text-embedding-3-small",
};

export const testEnv: TestEnv = { ...DEFAULTS };

// `@/env` validates at import, so a spec cannot re-read `process.env` per case.
// Mock the module against this object instead — identity is stable, so mutations are
// visible to code that already imported it:
//   vi.mock("@/env", async () => ({ env: (await import("@tests/env")).testEnv }));
export function resetTestEnv(): void {
  const bag = testEnv as Record<string, unknown>;
  for (const key of Object.keys(bag)) bag[key] = undefined;
  Object.assign(bag, DEFAULTS);
}

export function setTestEnv(overrides: Partial<TestEnv> = {}): void {
  resetTestEnv();
  Object.assign(testEnv, overrides);
}
