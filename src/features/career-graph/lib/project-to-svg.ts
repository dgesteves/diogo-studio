export type SvgPadding = { x: number; top: number; bottom: number };

const Z_PERSPECTIVE_NUDGE = 0.04;

export function projectToSvg(
  position: readonly [number, number, number],
  viewport: { width: number; height: number; padding: SvgPadding },
): { x: number; y: number } {
  const [px, py, pz] = position;
  const xN = (px + 1) / 2;
  const yPerspective = pz * Z_PERSPECTIVE_NUDGE;
  const yN = 1 - (py + 1 + yPerspective) / 2;
  const x = viewport.padding.x + xN * (viewport.width - viewport.padding.x * 2);
  const y =
    viewport.padding.top + yN * (viewport.height - viewport.padding.top - viewport.padding.bottom);
  return { x, y };
}
