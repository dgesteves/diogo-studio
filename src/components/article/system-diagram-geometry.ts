export const VIEW_W = 800;
export const VIEW_H = 360;
export const PAD_X = 32;
export const PAD_Y = 36;
export const NODE_W = 156;
export const NODE_H = 72;

type Point = { cx: number; cy: number };
type XY = { x: number; y: number };

export function project(x: number, y: number): Point {
  const u = x / 100;
  const v = y / 100;
  return {
    cx: PAD_X + u * (VIEW_W - PAD_X * 2),
    cy: PAD_Y + v * (VIEW_H - PAD_Y * 2),
  };
}

export function nodeTopLeft(x: number, y: number): { left: number; top: number } {
  const { cx, cy } = project(x, y);
  return { left: cx - NODE_W / 2, top: cy - NODE_H / 2 };
}

export function edgeAnchor(from: Point, to: Point): { start: XY; end: XY } {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const start = horizontal
    ? { x: from.cx + Math.sign(dx) * (NODE_W / 2), y: from.cy }
    : { x: from.cx, y: from.cy + Math.sign(dy) * (NODE_H / 2) };
  const end = horizontal
    ? { x: to.cx - Math.sign(dx) * (NODE_W / 2), y: to.cy }
    : { x: to.cx, y: to.cy - Math.sign(dy) * (NODE_H / 2) };
  return { start, end };
}
