import type { StackGroup } from "@/content/stack";
import { MONO } from "@/world/screens/texture";

import { header, INK, paintBackground, section } from "./screen-draw-kit";

const ACCENT = "#7dd3fc";

const MARGIN = 36;
const CHIP_PAD = 28;
const CHIP_GAP = 12;

/** 800px of panel, minus the header, is six rows. */
const MAX_GROUPS = 6;

export function drawStack(ctx: CanvasRenderingContext2D, groups: readonly StackGroup[]): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "STACK", "TOOLS OF THE TRADE", ACCENT);
  section(ctx, "● TOOLKIT", 142, ACCENT);

  const rows = groups.slice(0, MAX_GROUPS);
  const top = 188;
  const gap = 96;
  const rightEdge = ctx.canvas.width - MARGIN;

  for (let i = 0; i < rows.length; i += 1) {
    const group = rows[i];
    if (!group) continue;
    const y = top + i * gap;
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 14px ${MONO}`;
    ctx.fillText(group.label.toUpperCase(), MARGIN, y);

    ctx.font = `16px ${MONO}`;
    let cx = MARGIN;
    const py = y + 26;
    for (const item of group.items) {
      const w = ctx.measureText(item).width + CHIP_PAD;
      // One row per group and no reflow: a chip that would cross the edge ends the row,
      // because a group is a sample of the stack and `/stack` carries the whole list.
      if (cx + w > rightEdge) break;
      ctx.fillStyle = "rgba(125,211,252,0.12)";
      ctx.beginPath();
      ctx.roundRect(cx, py, w, 34, 9);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(item, cx + 14, py + 9);
      cx += w + CHIP_GAP;
    }
  }
}
