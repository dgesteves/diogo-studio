import { describe, expect, it } from "vitest";
import {
  createFrameBudget,
  FRAME_BROKEN_MS,
  FRAME_GRACE_COUNT,
  FRAME_STRAINED_MS,
  FRAME_STRAINED_STREAK,
  nextQuality,
  observeFrame,
  type FrameBudget,
  type FrameVerdict,
  type WorldQuality,
} from "./frame-budget";

function run(frames: readonly number[]): { verdicts: FrameVerdict[]; budget: FrameBudget } {
  let budget = createFrameBudget();
  const verdicts: FrameVerdict[] = [];

  for (const frameMs of frames) {
    const result = observeFrame(budget, frameMs);
    budget = result.budget;
    if (result.verdict !== "keep") verdicts.push(result.verdict);
  }

  return { verdicts, budget };
}

const SMOOTH = 16;
const GRACE = Array.from({ length: FRAME_GRACE_COUNT }, () => SMOOTH);

describe("frame budget", () => {
  it("leaves a healthy renderer alone", () => {
    expect(run(Array.from({ length: 200 }, () => SMOOTH)).verdicts).toEqual([]);
  });

  it("ignores the construction spike before the grace period is over", () => {
    expect(run(Array.from({ length: FRAME_GRACE_COUNT }, () => FRAME_BROKEN_MS)).verdicts).toEqual(
      [],
    );
  });

  it("freezes on a single broken frame instead of spending another one to confirm", () => {
    expect(run([...GRACE, FRAME_BROKEN_MS]).verdicts).toEqual(["freeze"]);
  });

  it("tolerates isolated slow frames", () => {
    const stutter = [...GRACE];
    for (let i = 0; i < 20; i += 1) stutter.push(FRAME_STRAINED_MS + 1, SMOOTH);

    expect(run(stutter).verdicts).toEqual([]);
  });

  it("steps down a tier once a strained streak proves the slowness is sustained", () => {
    const strained = Array.from({ length: FRAME_STRAINED_STREAK }, () => FRAME_STRAINED_MS + 1);

    expect(run([...GRACE, ...strained.slice(0, -1)]).verdicts).toEqual([]);
    expect(run([...GRACE, ...strained]).verdicts).toEqual(["step"]);
  });

  it("re-arms after stepping so the next tier needs its own evidence", () => {
    const strained = Array.from({ length: FRAME_STRAINED_STREAK }, () => FRAME_STRAINED_MS + 1);

    expect(run([...GRACE, ...strained, ...strained]).verdicts).toEqual(["step", "step"]);
    expect(run([...GRACE, ...strained, ...strained.slice(0, -1)]).verdicts).toEqual(["step"]);
  });

  it("walks the tiers in order and stops at frozen", () => {
    const walk: WorldQuality[] = ["full"];
    for (let i = 0; i < 4; i += 1) walk.push(nextQuality(walk[walk.length - 1] as WorldQuality));

    expect(walk).toEqual(["full", "reduced", "frozen", "frozen", "frozen"]);
  });
});
