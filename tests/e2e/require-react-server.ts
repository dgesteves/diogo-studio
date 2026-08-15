import { createRequire } from "node:module";

/**
 * The runner has to start under `--conditions=react-server` or `content-in-dom.spec.ts`
 * throws on `server-only` before a single test runs — the failure this guard exists to
 * name. The `e2e*` scripts in `package.json` carry the flag; invoking `playwright` bare
 * does not, and CI did exactly that for a day.
 *
 * Resolved rather than sniffed: `NODE_OPTIONS` flags do not appear in `process.execArgv`,
 * so the only honest test is what the condition actually changes — `server-only` exports
 * `empty.js` under `react-server` and the module that throws otherwise.
 */
export default function requireReactServer(): void {
  const resolved = createRequire(import.meta.url).resolve("server-only");
  if (!resolved.endsWith("index.js")) return;

  throw new Error(
    "Playwright is running without --conditions=react-server, so the specs that read the " +
      "server-only prose will fail on import. Run `pnpm e2e` (or `pnpm e2e:ci`), never " +
      "`playwright` directly.",
  );
}
