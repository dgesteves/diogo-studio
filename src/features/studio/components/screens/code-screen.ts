"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";

import { MONO, createCanvasTexture } from "./canvas-texture";

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

function drawCode(ctx: CanvasRenderingContext2D, caretOn: boolean): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(125, 211, 252, 0.02)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

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
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(x + 2, y, 2, 22);
    }
  }
}

export function useLeftScreenTexture(): CanvasTexture {
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
