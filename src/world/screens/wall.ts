import { worldColors } from "../materials";
import { type Engagement } from "@/content/career";
import { siteConfig } from "@/content/profile";
import { MONO, divider, header, INK, paintBackground, section, SOFT } from "./kit";
import { type StackGroup } from "@/content/stack";
import { type Experiment } from "@/content/playground";

/**
 * The five panels on the right wall. Every routine takes its data as a parameter and holds no
 * fact of its own: what it owns is layout, type, color and what to drop when the panel cannot
 * fit the list. Each panel namespaces its accent, because all five called it `ACCENT` when
 * they were five files.
 */

const RESUME_ACCENT = worldColors.accent;

/** The panel is 600×800 and the FOCUS section starts at 612, so five rows is what fits. */
const MAX_ROLES = 5;

export function drawResume(
  ctx: CanvasRenderingContext2D,
  engagements: readonly Engagement[],
): void {
  const W = ctx.canvas.width;

  paintBackground(ctx, RESUME_ACCENT);
  header(ctx, siteConfig.name.toUpperCase(), siteConfig.role.toUpperCase(), RESUME_ACCENT);

  section(ctx, "● EXPERIENCE", 142, RESUME_ACCENT);

  const rows = engagements.slice(0, MAX_ROLES);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const y = 184 + i * 82;
    ctx.fillStyle = RESUME_ACCENT;
    ctx.fillRect(36, y + 2, 4, 40);
    ctx.fillStyle = INK;
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillText(row.role.toUpperCase(), 54, y);
    ctx.fillStyle = SOFT;
    ctx.font = `15px ${MONO}`;
    ctx.fillText(row.company, 54, y + 28);
    ctx.fillStyle = worldColors.accentSoft;
    ctx.font = `14px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(row.years, W - 36, y + 4);
    ctx.textAlign = "left";
  }

  divider(ctx, 612);
  section(ctx, "● FOCUS", 634, RESUME_ACCENT);
  ctx.fillStyle = SOFT;
  ctx.font = `15px ${MONO}`;
  ctx.fillText("Frontend Platform · AI-Native UX", 36, 668);
  ctx.fillText("Design Systems · Performance", 36, 692);

  divider(ctx, 732);
  ctx.fillStyle = RESUME_ACCENT;
  ctx.font = `bold 17px ${MONO}`;
  ctx.fillText("↧  DOWNLOAD RÉSUMÉ", 36, 752);
}

const TIMELINE_ACCENT = "#a78bfa";

/** The panel is 600×800 and every stop needs 90px, so it shows the most recent six. */
const MAX_STOPS = 6;

export function drawTimeline(
  ctx: CanvasRenderingContext2D,
  engagements: readonly Engagement[],
): void {
  const STOPS = engagements.slice(0, MAX_STOPS);
  const earliest = STOPS.at(-1)?.start.slice(0, 4) ?? "";

  paintBackground(ctx, TIMELINE_ACCENT);
  header(ctx, "TIMELINE", `${earliest} → NOW`, TIMELINE_ACCENT);
  section(ctx, "● CAREER", 142, TIMELINE_ACCENT);

  const x = 56;
  const top = 200;
  const gap = 90;
  const bottom = top + (STOPS.length - 1) * gap;

  ctx.strokeStyle = "rgba(167,139,250,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, bottom);
  ctx.stroke();

  for (let i = 0; i < STOPS.length; i += 1) {
    const stop = STOPS[i];
    if (!stop) continue;
    const y = top + i * gap;
    ctx.fillStyle = TIMELINE_ACCENT;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SOFT;
    ctx.font = `13px ${MONO}`;
    ctx.fillText(stop.start.slice(0, 4), x + 26, y - 24);
    ctx.fillStyle = INK;
    ctx.font = `bold 19px ${MONO}`;
    ctx.fillText(stop.role, x + 26, y - 6);
    ctx.fillStyle = SOFT;
    ctx.font = `14px ${MONO}`;
    ctx.fillText(stop.company, x + 26, y + 20);
  }
}

const PRINCIPLES_ACCENT = "#c084fc";

/** 800px of panel, at 78px a line, is seven. */
const MAX_PRACTICES = 7;

export function drawPrinciples(ctx: CanvasRenderingContext2D, practices: readonly string[]): void {
  paintBackground(ctx, PRINCIPLES_ACCENT);
  header(ctx, "PRINCIPLES", "HOW I BUILD", PRINCIPLES_ACCENT);
  section(ctx, "● OPERATING SYSTEM", 142, PRINCIPLES_ACCENT);

  const lines = practices.slice(0, MAX_PRACTICES);
  const top = 196;
  const gap = 78;
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i];
    if (!text) continue;
    const y = top + i * gap;
    ctx.fillStyle = PRINCIPLES_ACCENT;
    ctx.font = `bold 22px ${MONO}`;
    ctx.fillText(String(i + 1).padStart(2, "0"), 36, y);
    ctx.fillStyle = INK;
    ctx.font = `18px ${MONO}`;
    ctx.fillText(text, 88, y + 2);
  }
}

const STACK_ACCENT = "#7dd3fc";

const MARGIN = 36;
const CHIP_PAD = 28;
const CHIP_GAP = 12;

/** 800px of panel, minus the header, is six rows. */
const MAX_GROUPS = 6;

export function drawStack(ctx: CanvasRenderingContext2D, groups: readonly StackGroup[]): void {
  paintBackground(ctx, STACK_ACCENT);
  header(ctx, "STACK", "TOOLS OF THE TRADE", STACK_ACCENT);
  section(ctx, "● TOOLKIT", 142, STACK_ACCENT);

  const rows = groups.slice(0, MAX_GROUPS);
  const top = 188;
  const gap = 96;
  const rightEdge = ctx.canvas.width - MARGIN;

  for (let i = 0; i < rows.length; i += 1) {
    const group = rows[i];
    if (!group) continue;
    const y = top + i * gap;
    ctx.fillStyle = STACK_ACCENT;
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

const PLAYGROUND_ACCENT = "#facc15";

/** 800px of panel, at 86px a row and leaving space for the footer, is five. */
const MAX_EXPERIMENTS = 5;

export function drawPlayground(
  ctx: CanvasRenderingContext2D,
  experiments: readonly Experiment[],
): void {
  paintBackground(ctx, PLAYGROUND_ACCENT);
  header(ctx, "PLAYGROUND", "EXPERIMENTS · DEMOS", PLAYGROUND_ACCENT);
  section(ctx, "● HIGH SCORES", 142, PLAYGROUND_ACCENT);

  const rows = experiments.slice(0, MAX_EXPERIMENTS);
  const top = 200;
  const gap = 86;
  for (let i = 0; i < rows.length; i += 1) {
    const experiment = rows[i];
    if (!experiment) continue;
    const y = top + i * gap;
    ctx.fillStyle = PLAYGROUND_ACCENT;
    ctx.font = `bold 18px ${MONO}`;
    ctx.fillText(`P${i + 1}`, 36, y);
    ctx.fillStyle = INK;
    ctx.font = `19px ${MONO}`;
    ctx.fillText(experiment.title, 92, y);
    ctx.fillStyle = SOFT;
    ctx.font = `14px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(experiment.meta, ctx.canvas.width - 36, y + 2);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = PLAYGROUND_ACCENT;
  ctx.font = `bold 16px ${MONO}`;
  ctx.fillText("▶ PRESS START", 36, 700);
}
