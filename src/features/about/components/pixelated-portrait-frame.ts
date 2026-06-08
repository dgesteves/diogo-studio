import type { Cell, Dims } from "./pixelated-portrait-sampler";
import {
  AMBIENT_AMPLITUDE,
  AMBIENT_SPEED,
  CELL_GAP,
  DAMPING,
  DISTURB_RADIUS_RATIO,
  REPEL_STRENGTH,
  SPRING_PULL,
  TINT,
  TINT_STRENGTH,
  type Pointer,
} from "./pixelated-portrait-engine-config";

type FrameParams = {
  cells: Cell[];
  dims: Dims;
  pointer: Pointer;
  interactive: boolean;
  time: number;
};

export function drawPortraitFrame(
  context: CanvasRenderingContext2D,
  { cells, dims, pointer, interactive, time }: FrameParams,
): boolean {
  context.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
  context.clearRect(0, 0, dims.width, dims.height);
  const radius = Math.min(dims.width, dims.height) * DISTURB_RADIUS_RATIO;
  const ambient = interactive ? AMBIENT_AMPLITUDE : 0;

  for (const cell of cells) {
    let { r, g, b } = cell;
    const targetX = ambient * Math.sin(time * AMBIENT_SPEED + cell.phase);
    const targetY = ambient * Math.cos(time * AMBIENT_SPEED * 0.9 + cell.phase);
    if (pointer.active) {
      const dx = cell.bx + dims.cellW / 2 - pointer.x;
      const dy = cell.by + dims.cellH / 2 - pointer.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        cell.vx += (dx / dist) * falloff * REPEL_STRENGTH;
        cell.vy += (dy / dist) * falloff * REPEL_STRENGTH;
        const t = falloff * TINT_STRENGTH;
        r = Math.round(r + (TINT.r - r) * t);
        g = Math.round(g + (TINT.g - g) * t);
        b = Math.round(b + (TINT.b - b) * t);
      }
    }
    cell.vx = (cell.vx + (targetX - cell.ox) * SPRING_PULL) * DAMPING;
    cell.vy = (cell.vy + (targetY - cell.oy) * SPRING_PULL) * DAMPING;
    cell.ox += cell.vx;
    cell.oy += cell.vy;
    context.globalAlpha = cell.a;
    context.fillStyle = `rgb(${r},${g},${b})`;
    context.fillRect(
      cell.bx + cell.ox,
      cell.by + cell.oy,
      dims.cellW - CELL_GAP,
      dims.cellH - CELL_GAP,
    );
  }
  context.globalAlpha = 1;
  return interactive || pointer.active;
}
