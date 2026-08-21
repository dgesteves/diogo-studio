"use client";

import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type CanvasTexture } from "three";
import { siteConfig } from "@/content/profile";
import { worldColors } from "../materials";
import { divider, fillScreen, fit, MONO, scanlines, INK, SOFT } from "./kit";
import { useScreenTexture } from "./texture";

/**
 * The three screens on the desk: the editor on the left, the status terminal in the middle,
 * the frame-rate plot on the right. One file because `monitor-rig.tsx` mounts all three and
 * nothing else ever mounts one, and because they are the same construction three times —
 * static data, a pure draw taking a view, and a hook that decides how often to repaint.
 *
 * What differs is only that clock: the editor blinks a caret on a timer, the terminal ticks
 * once a second, the plot repaints on the frame loop. Keeping them adjacent is what makes
 * that comparison possible.
 *
 * No fact lives here. Anything a visitor could read as true about the author comes in as a
 * parameter from `content/`; the draw routines decide layout, color and truncation only.
 */

export const CODE_TOKENS = {
  keyword: "#7dd3fc",
  fn: "#a5f3fc",
  string: "#fcd34d",
  comment: "rgba(232, 246, 252, 0.42)",
  punct: "rgba(232, 246, 252, 0.72)",
  type: "#86efac",
  text: "rgba(232, 246, 252, 0.92)",
} as const;

type TokenKind = keyof typeof CODE_TOKENS;
type Token = { k: TokenKind; t: string };
type CodeLine = Token[];

const CODE_LINES: CodeLine[] = [
  [{ k: "comment", t: "// Inspectable agent runtime · streams steps" }],
  [
    { k: "keyword", t: "export" },
    { k: "text", t: " " },
    { k: "keyword", t: "async" },
    { k: "text", t: " " },
    { k: "keyword", t: "function" },
    { k: "text", t: " " },
    { k: "fn", t: "run" },
    { k: "punct", t: "(input: " },
    { k: "type", t: "AgentInput" },
    { k: "punct", t: ") {" },
  ],
  [
    { k: "text", t: "  " },
    { k: "keyword", t: "const" },
    { k: "text", t: " ctx = " },
    { k: "keyword", t: "await" },
    { k: "text", t: " " },
    { k: "fn", t: "buildContext" },
    { k: "punct", t: "(input);" },
  ],
  [
    { k: "text", t: "  " },
    { k: "keyword", t: "for await" },
    { k: "punct", t: " (const step of " },
    { k: "fn", t: "plan" },
    { k: "punct", t: "(ctx)) {" },
  ],
  [
    { k: "text", t: "    " },
    { k: "keyword", t: "if" },
    { k: "punct", t: " (step.kind === " },
    { k: "string", t: '"tool"' },
    { k: "punct", t: ") {" },
  ],
  [
    { k: "text", t: "      " },
    { k: "keyword", t: "await" },
    { k: "text", t: " " },
    { k: "fn", t: "execute" },
    { k: "punct", t: "(step);" },
  ],
  [
    { k: "text", t: "    } " },
    { k: "keyword", t: "else if" },
    { k: "punct", t: " (step.kind === " },
    { k: "string", t: '"answer"' },
    { k: "punct", t: ") {" },
  ],
  [
    { k: "text", t: "      " },
    { k: "keyword", t: "return" },
    { k: "text", t: " step.payload;" },
  ],
  [{ k: "text", t: "    }" }],
  [{ k: "text", t: "  }" }],
  [{ k: "text", t: "}" }],
];

/** The editor runs cooler than the rest of the room: blue phosphor rather than cyan. */
const EDITOR_SCANLINE = "rgba(125, 211, 252, 0.02)";
const EDITOR_LINE = "rgba(125, 211, 252, 0.18)";

export function drawCode(ctx: CanvasRenderingContext2D, caretOn: boolean): void {
  const W = ctx.canvas.width;

  fillScreen(ctx);
  scanlines(ctx, EDITOR_SCANLINE);

  ctx.textBaseline = "top";
  ctx.fillStyle = worldColors.accentSoft;
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("● src/lib/agents/runtime.ts", 30, 30);

  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.4)";
  ctx.fillText("ts", W - 60, 34);

  divider(ctx, 68, { margin: 30, color: EDITOR_LINE });

  const startY = 90;
  const gutterX = 30;
  const codeX = 80;
  const lineH = 26;
  ctx.font = `20px ${MONO}`;

  for (let i = 0; i < CODE_LINES.length; i += 1) {
    const line = CODE_LINES[i];
    if (!line) continue;
    const y = startY + i * lineH;

    ctx.fillStyle = "rgba(232,246,252,0.28)";
    ctx.font = `16px ${MONO}`;
    const numText = String(i + 12).padStart(2, " ");
    ctx.fillText(numText, gutterX, y + 3);

    ctx.font = `20px ${MONO}`;
    let x = codeX;
    for (const token of line) {
      ctx.fillStyle = CODE_TOKENS[token.k];
      ctx.fillText(token.t, x, y);
      x += ctx.measureText(token.t).width;
    }

    if (i === 5 && caretOn) {
      ctx.fillStyle = worldColors.accentSoft;
      ctx.fillRect(x + 2, y, 2, 22);
    }
  }
}

export function useLeftScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 400);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCaretOn((on) => !on), 600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    paint((ctx) => drawCode(ctx, caretOn));
  }, [paint, caretOn]);

  return texture;
}

export type StatusRow = { label: string; value: string };

export const STATUS_ROWS: readonly StatusRow[] = [
  { label: "status", value: siteConfig.availability.toLowerCase() },
  { label: "role", value: siteConfig.role.toLowerCase() },
  { label: "based", value: siteConfig.location.toLowerCase() },
];

export const FOCUS_POOL: readonly string[] = siteConfig.knowsAbout.map((item) =>
  item.toLowerCase(),
);

export type StatusView = {
  rows: readonly StatusRow[];
  time: string;
  date: string;
  uptime: string;
  focus: string;
};

export function drawTerminal(ctx: CanvasRenderingContext2D, view: StatusView): void {
  const W = ctx.canvas.width;

  fillScreen(ctx);
  scanlines(ctx);

  ctx.textBaseline = "top";
  ctx.fillStyle = worldColors.accent;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● STUDIO · LIVE", 30, 30);

  ctx.font = `bold 20px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.62)";
  const tw = ctx.measureText(view.time).width;
  ctx.fillText(view.time, W - 30 - tw, 32);

  divider(ctx, 70, { margin: 30 });

  const rows: StatusRow[] = [
    ...view.rows,
    { label: "focus", value: view.focus },
    { label: "local", value: `${view.time} · ${view.date}` },
    { label: "uptime", value: view.uptime },
  ];

  const startY = 96;
  const lineH = 38;
  const valueX = 168;
  const maxValueWidth = W - valueX - 30;
  ctx.font = `20px ${MONO}`;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const y = startY + i * lineH;
    ctx.fillStyle = "rgba(125, 232, 200, 0.85)";
    ctx.fillText(row.label, 30, y);
    ctx.fillStyle = "rgba(34, 211, 238, 0.5)";
    ctx.fillText("▸", valueX - 30, y);
    ctx.fillStyle = "rgba(232,246,252,0.72)";
    ctx.fillText(fit(ctx, row.value, maxValueWidth), valueX, y);
  }
}

const FOCUS_INTERVAL_MS = 3000;

const STUDIO_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const STUDIO_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  weekday: "short",
  day: "2-digit",
  month: "short",
});

function formatUptime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function useCenterScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 400);
  const bootAt = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    bootAt.current = Date.now();
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const focus = FOCUS_POOL[Math.floor(now / FOCUS_INTERVAL_MS) % FOCUS_POOL.length] ?? "";
    paint((ctx) =>
      drawTerminal(ctx, {
        rows: STATUS_ROWS,
        time: STUDIO_TIME.format(now),
        date: STUDIO_DATE.format(now),
        uptime: formatUptime(now - (bootAt.current ?? now)),
        focus,
      }),
    );
  }, [paint, now]);

  return texture;
}

export type MetricsView = {
  fps: number;
  frameMs: number;
  history: readonly number[];
  resolution: string;
  dpr: number;
};

const FPS_SCALE = 72;

function drawSparkline(ctx: CanvasRenderingContext2D, history: readonly number[]): void {
  const W = ctx.canvas.width;
  const sparkX = 250;
  const sparkY = 116;
  const sparkW = W - sparkX - 30;
  const sparkH = 64;
  ctx.strokeStyle = worldColors.accent;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < history.length; i += 1) {
    const value = Math.max(0, Math.min(1, (history[i] ?? 0) / FPS_SCALE));
    const x = sparkX + (i / Math.max(history.length - 1, 1)) * sparkW;
    const y = sparkY + (1 - value) * sparkH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function drawMetrics(ctx: CanvasRenderingContext2D, view: MetricsView): void {
  fillScreen(ctx);
  scanlines(ctx);

  ctx.textBaseline = "top";
  ctx.fillStyle = worldColors.accent;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● RENDER · LIVE", 30, 30);

  divider(ctx, 70, { margin: 30 });

  ctx.fillStyle = SOFT;
  ctx.font = `16px ${MONO}`;
  ctx.fillText("FRAMES / SEC", 30, 90);
  ctx.fillStyle = INK;
  ctx.font = `bold 64px ${MONO}`;
  ctx.fillText(String(Math.round(view.fps)), 30, 110);

  drawSparkline(ctx, view.history);

  const rows = [
    { label: "frame", value: `${view.frameMs.toFixed(1)} ms` },
    { label: "res", value: view.resolution },
    { label: "dpr", value: `${view.dpr.toFixed(2)}×` },
  ];
  ctx.font = `20px ${MONO}`;
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const y = 222 + r * 40;
    ctx.fillStyle = "rgba(125, 232, 200, 0.85)";
    ctx.fillText(row.label, 30, y);
    ctx.fillStyle = "rgba(232,246,252,0.72)";
    ctx.fillText(row.value, 150, y);
  }
}

const SPARK_LEN = 32;
const SAMPLE_SECONDS = 0.5;
const INITIAL_FPS = 60;

export function useRightScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 400);
  const frames = useRef(0);
  const elapsed = useRef(0);
  const history = useRef<number[]>(Array.from({ length: SPARK_LEN }, () => INITIAL_FPS));

  useFrame((state, delta) => {
    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < SAMPLE_SECONDS) return;

    const fps = frames.current / elapsed.current;
    frames.current = 0;
    elapsed.current = 0;
    history.current = [...history.current.slice(1), fps];

    const { domElement } = state.gl;
    paint((ctx) =>
      drawMetrics(ctx, {
        fps,
        frameMs: 1000 / fps,
        history: history.current,
        resolution: `${domElement.width}×${domElement.height}`,
        dpr: state.gl.getPixelRatio(),
      }),
    );
  });

  return texture;
}
