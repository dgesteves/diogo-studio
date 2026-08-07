import { ROOM } from "@/constants/room";

const REFERENCE_ASPECT = 16 / 9;
const MAX_PULLBACK = 3.5;
const SIDE_WALL_CLEARANCE = 0.35;

// A perspective camera fixes the vertical field of view, so narrower viewports
// lose horizontal coverage and the world looks cropped. Pulling the camera back
// by reference/aspect restores that coverage; wider-than-reference screens keep
// the authored framing (pullback of 1).
export function framingPullback(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return 1;
  const pullback = REFERENCE_ASPECT / Math.min(aspect, REFERENCE_ASPECT);
  return Math.min(pullback, MAX_PULLBACK);
}

// Both side walls carry content — the wall screens hang on the right one and the
// city window is cut into the left one — so a pulled-back camera has to stay
// between them, or it looks at that content from behind.
export function clampCameraX(x: number): number {
  const min = ROOM.minX + SIDE_WALL_CLEARANCE;
  const max = ROOM.maxX - SIDE_WALL_CLEARANCE;
  return Math.min(Math.max(x, min), max);
}
