import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/**
 * The dependency rules of `docs/architecture.md` §4, asserted against the real
 * `eslint.config.ts` rather than against a copy of its intent.
 *
 * This exists because the rule was published wrong. `docs/refactor.md` §4.4 carried the
 * glob `["@/world/*", "@/world/**", "!@/world/store", "!@/world/perf"]` through three
 * phases, and it does not do what it reads as: `no-restricted-imports` matches `group`
 * with gitignore semantics, which refuse to re-include a path under an excluded parent, so
 * the bare `@/world` voids both carve-outs and the group denies the store it exists to
 * permit. A boundary rule that is never proven to fail permits everything and says nothing.
 *
 * So both directions are asserted. The DENIED rows fail if a carve-out is too wide; the
 * ALLOWED rows fail if one is voided. Keep them in step whenever `ACCESS` changes.
 */

// One instance: ESLint caches the resolved config, and each lintText call is otherwise a
// fresh load of eslint.config.ts through jiti.
const eslint = new ESLint();

async function restrictions(filePath: string, specifier: string): Promise<string[]> {
  const [result] = await eslint.lintText(`import x from "${specifier}";\nexport default x;\n`, {
    filePath,
    warnIgnored: false,
  });

  return (result?.messages ?? [])
    .filter((message) => message.ruleId === "no-restricted-imports")
    .map((message) => message.message);
}

// Every importer is a real file, so the config resolves exactly as it does under `pnpm lint`.
const ALLOWED: [importer: string, specifier: string, why: string][] = [
  ["src/world/canvas.tsx", "@/command-menu/store", "world/ reaches ⌘K through its store"],
  ["src/world/boot.tsx", "@/telemetry/store", "world/ reaches telemetry through its store"],
  ["src/site/home-cta.tsx", "@/command-menu/store", "site/ reaches ⌘K through its store"],
  ["src/telemetry/panels.tsx", "@/world/perf", "telemetry/ is granted world/perf"],
  ["src/world/canvas.tsx", "@/content/pages", "content/ is the root of the graph"],
  ["src/world/canvas.tsx", "@/ui/button", "ui/ is open to everyone"],
  ["src/world/canvas.tsx", "@/use-is-client", "root leaves are open to everyone"],
  ["src/app/(world)/layout.tsx", "@/world/hud/deck", "app/ composes a domain, not its store"],
  ["src/app/api/chat/route.ts", "@/agent/retrieval", "the API half owns agent/"],
];

const DENIED: [importer: string, specifier: string, why: string][] = [
  ["src/world/canvas.tsx", "@/command-menu/menu", "a sibling's private file"],
  ["src/world/canvas.tsx", "@/command-menu", "a barrel, even one that does not exist yet"],
  ["src/world/canvas.tsx", "@/site/page-view", "world/ never sees site/ — §4.3 rule 5"],
  ["src/site/home-cta.tsx", "@/world/store", "site/ never sees world/, not even a store"],
  ["src/telemetry/panels.tsx", "@/world/store", "telemetry/ is granted perf and only perf"],
  ["src/command-menu/ask.tsx", "@/telemetry/store", "⌘K is granted no sibling at all"],
  ["src/command-menu/ask.tsx", "@/agent/retrieval", "no client module sees agent/ — §4.3 rule 4"],
  ["src/app/layout.tsx", "@/agent/corpus", "app/ outside api/ sees agent/ no more than a client"],
  ["src/app/api/chat/route.ts", "@/site/metadata", "the API half sees no client domain"],
  ["src/ui/button.tsx", "@/content/pages", "a primitive that knows what a Page is is not one"],
  ["src/ui/button.tsx", "@/ui/cn", "ui/ imports relatively within itself"],
  ["src/content/pages.ts", "@/ui/cn", "content/ imports nothing"],
  ["src/site/metadata.ts", "@/app/sitemap", "nothing imports from app/ — §4.3 rule 1"],
  ["src/world/canvas.tsx", "@/world/store", "a domain never aliases itself"],
];

describe("the dependency rules are a check", () => {
  it.each(ALLOWED)("%s may import %s — %s", async (importer, specifier) => {
    expect(await restrictions(importer, specifier)).toEqual([]);
  });

  it.each(DENIED)("%s may not import %s — %s", async (importer, specifier) => {
    expect(await restrictions(importer, specifier)).not.toEqual([]);
  });
});
