import { brandColors } from "@/config/brand";
import { MONO } from "@/features/studio/components/screens/canvas-texture";

import { divider, header, INK, paintBackground, section, SOFT } from "./screen-draw-kit";

const ACCENT = brandColors.accent;

type Role = { role: string; org: string; date: string };

const ROLES: Role[] = [
  { role: "LEAD ENGINEER", org: "Fueled · Web Applications", date: "2025 — NOW" },
  { role: "VP OF ENGINEERING", org: "Moment", date: "2025" },
  { role: "LEAD FRONTEND", org: "eino.ai", date: "2023 — 25" },
  { role: "SENIOR ENGINEER", org: "Sky · NBCUniversal", date: "2020 — 22" },
  { role: "LEAD FRONTEND", org: "BMW Group", date: "2018 — 19" },
];

export function drawResume(ctx: CanvasRenderingContext2D): void {
  const W = ctx.canvas.width;

  paintBackground(ctx, ACCENT);
  header(ctx, "DIOGO ESTEVES", "STAFF · PRINCIPAL ENGINEER", ACCENT);

  section(ctx, "● EXPERIENCE", 142, ACCENT);

  for (let i = 0; i < ROLES.length; i += 1) {
    const row = ROLES[i];
    if (!row) continue;
    const y = 184 + i * 82;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(36, y + 2, 4, 40);
    ctx.fillStyle = INK;
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillText(row.role, 54, y);
    ctx.fillStyle = SOFT;
    ctx.font = `15px ${MONO}`;
    ctx.fillText(row.org, 54, y + 28);
    ctx.fillStyle = brandColors.accentSoft;
    ctx.font = `14px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(row.date, W - 36, y + 4);
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
