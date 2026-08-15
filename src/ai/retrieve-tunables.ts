/**
 * Raised from 6 when the chunker went per-block: the median chunk fell from roughly a
 * whole page to 166 characters, so six of them is a fraction of the context six used to
 * be. Ten keeps the prompt about as full as it was while retrieval stays precise.
 */
export const TOP_K = 10;

export const MIN_COSINE_SCORE = 0.25;
export const MIN_KEYWORD_SCORE = 1.5;

export const BM25_K1 = 1.5;
export const BM25_B = 0.75;
