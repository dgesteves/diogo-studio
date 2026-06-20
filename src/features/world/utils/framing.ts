const REFERENCE_ASPECT = 16 / 9;
const MAX_PULLBACK = 3.5;

// A perspective camera fixes the vertical field of view, so narrower viewports
// lose horizontal coverage and the world looks cropped. Pulling the camera back
// by reference/aspect restores that coverage; wider-than-reference screens keep
// the authored framing (pullback of 1).
export function framingPullback(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return 1;
  const pullback = REFERENCE_ASPECT / Math.min(aspect, REFERENCE_ASPECT);
  return Math.min(pullback, MAX_PULLBACK);
}
