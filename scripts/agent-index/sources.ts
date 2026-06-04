import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { buildMdxChunks } from "./chunker";
import { parseFrontmatter } from "./frontmatter";
import { CONTENT_ROOT } from "./paths";
import type { IndexEntry, SourceKind } from "./types";

export async function readMdxCollection(
  subdir: "case-studies" | "essays",
  kind: SourceKind,
  permalinkPrefix: "/work" | "/writing",
): Promise<IndexEntry[]> {
  const dir = join(CONTENT_ROOT, subdir);
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith(".mdx")).sort();
  const out: IndexEntry[] = [];
  for (const file of files) {
    const filePath = join(dir, file);
    const raw = readFileSync(filePath, "utf8");
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug ?? file.replace(/\.mdx$/, "");
    const sourceTitle = data.title ?? slug;
    const permalink = `${permalinkPrefix}/${slug}`;
    out.push(
      ...buildMdxChunks({
        kind,
        slug,
        permalink,
        sourceTitle,
        description: data.description,
        tags: data.patterns,
        body,
      }),
    );
  }
  return out;
}
