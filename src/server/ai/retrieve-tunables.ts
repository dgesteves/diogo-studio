// 6 chunks keeps prompt size honest for the cheap model while still yielding
// 1-2 citations per answer.
export const TOP_K = 6;

// Relevance floors: below these the route refuses cleanly rather than answer
// from a tangential match. Cosine is calibrated against this corpus (unrelated
// queries land ~0.1-0.2, on-topic 0.4+); BM25 scores are unbounded so the
// keyword floor is empirical and deliberately conservative.
export const MIN_COSINE_SCORE = 0.25;
export const MIN_KEYWORD_SCORE = 1.5;

export const BM25_K1 = 1.5;
export const BM25_B = 0.75;
