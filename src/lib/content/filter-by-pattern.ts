import type { PatternId } from "@/content/data/career-graph";

type PatternedItem = {
  patterns: readonly PatternId[];
};

export function filterByPattern<T extends PatternedItem>(
  items: readonly T[],
  selected: readonly PatternId[],
): T[] {
  if (selected.length === 0) return [...items];
  return items.filter((item) => selected.some((pattern) => item.patterns.includes(pattern)));
}

export function collectPatterns<T extends PatternedItem>(items: readonly T[]): PatternId[] {
  return Array.from(new Set(items.flatMap((item) => item.patterns)));
}
