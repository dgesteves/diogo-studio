import type { Frontmatter } from "./types";

// Bespoke regex parser: we only need a handful of scalar fields here, so we
// avoid dragging a YAML library into the build (the full YAML lives in velite).
export function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const yaml = match[1] ?? "";
  const body = match[2] ?? "";
  const data: Frontmatter = {};
  const lines = yaml.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const inlineArr = line.match(/^(\w+):\s*\[(.*)\]\s*$/);
    if (inlineArr) {
      const key = inlineArr[1] ?? "";
      const contents = inlineArr[2] ?? "";
      const values = contents
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      if (key === "patterns") data.patterns = values;
      continue;
    }
    const kv = line.match(/^(\w+):\s*(.+?)\s*$/);
    if (!kv) continue;
    const key = kv[1] ?? "";
    const value = (kv[2] ?? "").replace(/^["']|["']$/g, "");
    if (key === "title") data.title = value;
    else if (key === "description") data.description = value;
    else if (key === "slug") data.slug = value;
    else if (key === "company") data.company = value;
    else if (key === "role") data.role = value;
    else if (key === "years") data.years = value;
  }
  return { data, body };
}
