import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "..", "..");
export const CONTENT_ROOT = join(ROOT, "src", "content");
export const INDEX_PATH = join(CONTENT_ROOT, "agent-index.json");

export function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const file = join(ROOT, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const key = match[1]!;
      if (process.env[key] !== undefined) continue;
      let value = (match[2] ?? "").trim();
      const quoted = value.match(/^(['"])([\s\S]*)\1$/);
      if (quoted) value = quoted[2]!;
      else value = value.replace(/\s+#.*$/, "").trim();
      process.env[key] = value;
    }
  }
}
