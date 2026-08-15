import { brandColors } from "@/config/brand";
import type { Engagement } from "@/content/career";
import { siteConfig } from "@/content/profile";
import { MONO } from "@/world/screens/texture";

import { divider, header, INK, paintBackground, section, SOFT } from "./screen-draw-kit";

const ACCENT = brandColors.accent;

/** The panel is 600×800 and the FOCUS section starts at 612, so five rows is what fits. */
const MAX_ROLES = 5;

export function drawResume(
  ctx: CanvasRenderingContext2D,
  engagements: readonly Engagement[],
): void {
  const W = ctx.canvas.width;

  paintBackground(ctx, ACCENT);
  header(ctx, siteConfig.name.toUpperCase(), siteConfig.role.toUpperCase(), ACCENT);

  section(ctx, "● EXPERIENCE", 142, ACCENT);

  const rows = engagements.slice(0, MAX_ROLES);
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const y = 184 + i * 82;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(36, y + 2, 4, 40);
    ctx.fillStyle = INK;
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillText(row.role.toUpperCase(), 54, y);
    ctx.fillStyle = SOFT;
    ctx.font = `15px ${MONO}`;
    ctx.fillText(row.company, 54, y + 28);
    ctx.fillStyle = brandColors.accentSoft;
    ctx.font = `14px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(row.years, W - 36, y + 4);
    ctx.textAlign = "left";
  }

  divider(ctx, 612);
  section(ctx, "● FOCUS", 634, ACCENT);
  ctx.fillStyle = SOFT;
  ctx.font = `15px ${MONO}`;
  ctx.fillText("Frontend Platform · AI-Native UX", 36, 668);
  ctx.fillText("Design Systems · Performance", 36, 692);

  divider(ctx, 732);
  ctx.fillStyle = ACCENT;
  ctx.font = `bold 17px ${MONO}`;
  ctx.fillText("↧  DOWNLOAD RÉSUMÉ", 36, 752);
}
