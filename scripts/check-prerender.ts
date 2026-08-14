import { readFileSync } from "node:fs";
import { routes } from "../src/content/pages";

const MANIFEST = ".next/prerender-manifest.json";

// Routes that must be statically prerendered. Static rendering is this site's main
// performance asset, and `cacheComponents` makes it easy to lose silently: any
// uncached dynamic API (`new Date()`, an env read, `headers()`) drops a route to
// on-demand rendering with no error and no warning. This turns that into a build
// failure instead.
const MUST_BE_STATIC = [...Object.values(routes), "/sitemap.xml", "/robots.txt"];

type PrerenderManifest = { routes?: Record<string, unknown> };

function main(): void {
  let manifest: PrerenderManifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as PrerenderManifest;
  } catch {
    console.error(`[prerender:check] cannot read ${MANIFEST} — run \`next build\` first.`);
    process.exit(1);
  }

  const prerendered = new Set(Object.keys(manifest.routes ?? {}));
  const missing = MUST_BE_STATIC.filter((route) => !prerendered.has(route));

  if (missing.length > 0) {
    console.error(
      `[prerender:check] ${missing.length} route(s) are no longer statically prerendered:\n` +
        missing.map((route) => `  ✗ ${route}`).join("\n") +
        `\n\nEither restore static rendering (wrap the dynamic work in \`use cache\`), or — if\n` +
        `the route is deliberately dynamic now — remove it from MUST_BE_STATIC in\n` +
        `scripts/check-prerender.ts and record why in docs/decisions.md.`,
    );
    process.exit(1);
  }

  console.log(`[prerender:check] ${MUST_BE_STATIC.length} routes statically prerendered.`);
}

main();
