const WORDS_PER_MINUTE = 200;

export type ReadingStats = {
  wordCount: number;
  readingTime: number;
};

export function deriveReadingStats(text: string): ReadingStats {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  return { wordCount, readingTime };
}
