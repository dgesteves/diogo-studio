"use client";

/* eslint-disable react-hooks/immutability --
 * THREE.CanvasTexture's `needsUpdate = true` is the documented pattern for
 * marking the underlying canvas pixels dirty so three.js re-uploads them
 * to the GPU. The texture object is intentionally mutated each frame the
 * canvas content changes; we own that mutation here.
 */

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

/**
 * Monitor screen textures for the Studio scene.
 *
 * We do NOT use drei's `<Html transform>` here — that approach proved
 * unreliable behind the bloom postprocess and across browsers (CSS3D
 * layer ordering, subpixel rendering, font fallbacks). Instead each
 * screen renders into an offscreen `<canvas>`, the canvas is wrapped in
 * a `THREE.CanvasTexture`, and the texture is applied as the screen
 * mesh's `map` + `emissiveMap`. The bright cyan text picks up the bloom
 * pass naturally, exactly like a real monitor would.
 *
 * Each `useXScreenTexture` hook is self-contained: it owns its own
 * timer, state, and draw cadence. The hook returns the THREE.Texture
 * directly so the studio canvas can pass it straight into a material.
 */

const MONO = `"Geist Mono", ui-monospace, Menlo, Consolas, monospace`;

/** Create a one-time canvas + CanvasTexture pair. */
function createCanvasTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, texture };
}

/* ===========================================================================
 * CENTER — production telemetry log
 * ========================================================================= */

type LogTone = "ok" | "info" | "warn";
interface LogLine {
  tone: LogTone;
  text: string;
}

const LOG_POOL: LogLine[] = [
  { tone: "ok", text: "✓ deploy  origin/main → live  2.4s" },
  { tone: "info", text: "▸ build  pnpm test  18/18  ok" },
  { tone: "ok", text: "✓ axe-core  0 violations · 12 routes" },
  { tone: "info", text: "▸ web-vitals  LCP 0.9s  INP 124ms" },
  { tone: "ok", text: "✓ size-limit  93kb < 110kb  ok" },
  { tone: "info", text: "▸ /work prefetch  hot path warmed" },
  { tone: "ok", text: "✓ shader compile  3 frags  ok" },
  { tone: "warn", text: "⚠ flaky retry  → passed (1/3)" },
  { tone: "ok", text: "✓ ts-strict  0 errors · 218 modules" },
  { tone: "info", text: "▸ image pipeline  AVIF · WebP · 2x" },
  { tone: "ok", text: "✓ a11y axe  contrast AA  patterns" },
  { tone: "info", text: "▸ rsc cache  hit/miss  21 / 4" },
];

function toneRGBA(tone: LogTone, opacity: number) {
  if (tone === "ok") return `rgba(125, 232, 200, ${opacity})`;
  if (tone === "warn") return `rgba(248, 198, 110, ${opacity})`;
  return `rgba(232, 246, 252, ${opacity * 0.88})`;
}

function drawTerminal(ctx: CanvasRenderingContext2D, lines: LogLine[]) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Background.
  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  // Subtle scanlines — sells the "monitor surface" look without overdoing it.
  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // Header: live tag + clock.
  ctx.textBaseline = "top";
  ctx.fillStyle = "#22d3ee";
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● OPS.LIVE · PRODUCTION", 30, 30);

  const time = new Date().toISOString().slice(11, 19);
  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.45)";
  const tw = ctx.measureText(time).width;
  ctx.fillText(time, W - 30 - tw, 34);

  // Divider line.
  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  // Log lines.
  ctx.font = `22px ${MONO}`;
  const startY = 94;
  const lineH = 32;
  const visible = lines.slice(-8);
  for (let i = 0; i < visible.length; i += 1) {
    const line = visible[i];
    if (!line) continue;
    const opacity = 0.4 + (i / Math.max(visible.length - 1, 1)) * 0.6;
    ctx.fillStyle = toneRGBA(line.tone, opacity);
    ctx.fillText(line.text, 30, startY + i * lineH);
  }
}

export function useCenterScreenTexture(): THREE.CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const [lines, setLines] = useState<LogLine[]>(() => LOG_POOL.slice(0, 8));

  useEffect(() => {
    let i = 8;
    const id = window.setInterval(() => {
      setLines((prev) => {
        const next = prev.slice(1);
        const line = LOG_POOL[i % LOG_POOL.length];
        if (line) next.push(line);
        i += 1;
        return next;
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTerminal(ctx, lines);
    texture.needsUpdate = true;
  }, [canvas, lines, texture]);

  return texture;
}

/* ===========================================================================
 * LEFT — code editor
 * ========================================================================= */

const CODE_TOKENS = {
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

function drawCode(ctx: CanvasRenderingContext2D, caretOn: boolean) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  // Scanlines.
  ctx.fillStyle = "rgba(125, 211, 252, 0.02)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // Header: filename.
  ctx.textBaseline = "top";
  ctx.fillStyle = "#7dd3fc";
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("● src/lib/agents/runtime.ts", 30, 30);

  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.4)";
  ctx.fillText("ts", W - 60, 34);

  ctx.strokeStyle = "rgba(125, 211, 252, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 68);
  ctx.lineTo(W - 30, 68);
  ctx.stroke();

  // Code body.
  const startY = 90;
  const gutterX = 30;
  const codeX = 80;
  const lineH = 26;
  ctx.font = `20px ${MONO}`;

  for (let i = 0; i < CODE_LINES.length; i += 1) {
    const line = CODE_LINES[i];
    if (!line) continue;
    const y = startY + i * lineH;

    // Gutter line number.
    ctx.fillStyle = "rgba(232,246,252,0.28)";
    ctx.font = `16px ${MONO}`;
    const numText = String(i + 12).padStart(2, " ");
    ctx.fillText(numText, gutterX, y + 3);

    // Tokens.
    ctx.font = `20px ${MONO}`;
    let x = codeX;
    for (const token of line) {
      ctx.fillStyle = CODE_TOKENS[token.k];
      ctx.fillText(token.t, x, y);
      x += ctx.measureText(token.t).width;
    }

    // Blinking caret on line 6 (the await line) to suggest "actively editing".
    if (i === 5 && caretOn) {
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(x + 2, y, 2, 22);
    }
  }
}

export function useLeftScreenTexture(): THREE.CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCaretOn((on) => !on), 600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCode(ctx, caretOn);
    texture.needsUpdate = true;
  }, [canvas, caretOn, texture]);

  return texture;
}

/* ===========================================================================
 * RIGHT — signals dashboard
 * ========================================================================= */

const SPARK_LEN = 22;

function drawMetrics(
  ctx: CanvasRenderingContext2D,
  series: { req: number[]; lat: number[]; err: number[] },
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  // Scanlines.
  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // Header.
  ctx.textBaseline = "top";
  ctx.fillStyle = "#22d3ee";
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● SIGNALS · LAST 30M", 30, 30);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  // Three metric rows.
  const latest = (s: number[]) => s[s.length - 1] ?? 0.5;
  const rows = [
    {
      label: "REQ/MIN",
      value: String(Math.round(620 + latest(series.req) * 280)),
      color: "#22d3ee",
      data: series.req,
    },
    {
      label: "P95 ms",
      value: String(Math.round(110 + latest(series.lat) * 40)),
      color: "#7dd3fc",
      data: series.lat,
    },
    {
      label: "ERR %",
      value: (latest(series.err) * 0.18).toFixed(2),
      color: "#a5f3fc",
      data: series.err,
    },
  ];

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const y = 96 + r * 96;

    // Label.
    ctx.fillStyle = "rgba(232,246,252,0.55)";
    ctx.font = `16px ${MONO}`;
    ctx.fillText(row.label, 30, y);

    // Big number.
    ctx.fillStyle = "#e8f6fc";
    ctx.font = `bold 36px ${MONO}`;
    ctx.fillText(row.value, 30, y + 22);

    // Sparkline.
    const sparkX = 260;
    const sparkY = y + 12;
    const sparkW = W - sparkX - 30;
    const sparkH = 56;
    ctx.strokeStyle = row.color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < row.data.length; i += 1) {
      const value = row.data[i];
      if (value === undefined) continue;
      const x = sparkX + (i / Math.max(row.data.length - 1, 1)) * sparkW;
      const dy = sparkY + (1 - Math.max(0, Math.min(1, value))) * sparkH;
      if (i === 0) ctx.moveTo(x, dy);
      else ctx.lineTo(x, dy);
    }
    ctx.stroke();

    // End dot — sells "live signal".
    const lastValue = row.data[row.data.length - 1] ?? 0;
    const lastY = sparkY + (1 - Math.max(0, Math.min(1, lastValue))) * sparkH;
    ctx.fillStyle = row.color;
    ctx.beginPath();
    ctx.arc(sparkX + sparkW, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function driftSeries(series: number[]): number[] {
  const next = series.slice(1);
  const last = series[series.length - 1] ?? 0.5;
  const target = 0.5 + (Math.random() - 0.5) * 0.45;
  next.push(last + (target - last) * 0.55);
  return next;
}

export function useRightScreenTexture(): THREE.CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const [series, setSeries] = useState(() => ({
    req: Array.from({ length: SPARK_LEN }, () => 0.4 + Math.random() * 0.5),
    lat: Array.from({ length: SPARK_LEN }, () => 0.4 + Math.random() * 0.5),
    err: Array.from({ length: SPARK_LEN }, () => 0.4 + Math.random() * 0.5),
  }));

  useEffect(() => {
    const idReq = window.setInterval(
      () => setSeries((s) => ({ ...s, req: driftSeries(s.req) })),
      1200,
    );
    const idLat = window.setInterval(
      () => setSeries((s) => ({ ...s, lat: driftSeries(s.lat) })),
      1500,
    );
    const idErr = window.setInterval(
      () => setSeries((s) => ({ ...s, err: driftSeries(s.err) })),
      2200,
    );
    return () => {
      window.clearInterval(idReq);
      window.clearInterval(idLat);
      window.clearInterval(idErr);
    };
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMetrics(ctx, series);
    texture.needsUpdate = true;
  }, [canvas, series, texture]);

  return texture;
}
