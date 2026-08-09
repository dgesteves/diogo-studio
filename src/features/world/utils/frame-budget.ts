export type WorldQuality = "full" | "reduced" | "frozen";

const TIERS: readonly WorldQuality[] = ["full", "reduced", "frozen"];

/**
 * The first frames of a session include scene construction and the first draw after
 * shader linking, which spike on any device. Judging those would degrade machines that
 * cope fine a second later.
 */
export const FRAME_GRACE_COUNT = 2;

/** ~4fps. Sustained, this is a page a visitor cannot scroll or click. */
export const FRAME_STRAINED_MS = 250;

export const FRAME_STRAINED_STREAK = 3;

/**
 * No functioning renderer produces a two-second frame. One is enough evidence on its own:
 * it means the main thread is blocked long enough that a click may never land.
 *
 * Such a frame skips straight to `frozen` rather than stepping down a tier. Waiting for
 * more evidence costs *another* frame of the same length — measured at ~5s each on CI's
 * software rasterizer, so a three-frame rule spent 15s of a 30s budget proving what the
 * first frame already showed — and no reduction in pixels or passes turns a five-second
 * frame into a usable one.
 */
export const FRAME_BROKEN_MS = 2_000;

export type FrameBudget = { observed: number; streak: number };

export function createFrameBudget(): FrameBudget {
  return { observed: 0, streak: 0 };
}

export function nextQuality(quality: WorldQuality): WorldQuality {
  return TIERS[TIERS.indexOf(quality) + 1] ?? quality;
}

export type FrameVerdict = "keep" | "step" | "freeze";

export function observeFrame(
  budget: FrameBudget,
  frameMs: number,
): { budget: FrameBudget; verdict: FrameVerdict } {
  const observed = budget.observed + 1;
  if (observed <= FRAME_GRACE_COUNT) return { budget: { observed, streak: 0 }, verdict: "keep" };

  if (frameMs >= FRAME_BROKEN_MS) return { budget: { observed, streak: 0 }, verdict: "freeze" };

  if (frameMs <= FRAME_STRAINED_MS) return { budget: { observed, streak: 0 }, verdict: "keep" };

  const streak = budget.streak + 1;
  if (streak < FRAME_STRAINED_STREAK) return { budget: { observed, streak }, verdict: "keep" };

  return { budget: { observed, streak: 0 }, verdict: "step" };
}
