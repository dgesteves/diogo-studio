import { describe, expect, it } from "vitest";

import { brandColors } from "@/config/brand";
import { engagements } from "@/content/career";
import { siteConfig } from "@/content/profile";
import { createRecordingContext, type RecordingContext, type TextRun } from "@tests/recording-ctx";

import { drawPlayground } from "./playground-screen-draw";
import { drawPrinciples } from "./principles-screen-draw";
import { drawResume } from "./resume-screen-draw";
import { drawStack } from "./stack-screen-draw";
import { drawTimeline } from "./timeline-screen-draw";

// The two career panels read the authored record; the wall binds it in `wall-screens.tsx`
// and these bind the same thing, so what is asserted below is the projection onto 600×800.
const paintResume = (ctx: CanvasRenderingContext2D): void => drawResume(ctx, engagements);
const paintTimeline = (ctx: CanvasRenderingContext2D): void => drawTimeline(ctx, engagements);

/**
 * The five panels on the world's right wall. A visitor reads them as text at a distance, so
 * what these assert is the text, the accent that identifies each panel, and the one failure
 * a canvas cannot report: a line that runs off the edge. `wall-screen.tsx` sizes every one
 * of them 600×800, so that is what they are painted on here.
 */

const WIDTH = 600;
const HEIGHT = 800;

type Panel = {
  name: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
  accent: string;
  title: string;
  subtitle: string;
};

const PANELS: readonly Panel[] = [
  {
    name: "resume",
    draw: paintResume,
    accent: brandColors.accent,
    title: siteConfig.name.toUpperCase(),
    subtitle: siteConfig.role.toUpperCase(),
  },
  {
    name: "timeline",
    draw: paintTimeline,
    accent: "#a78bfa",
    title: "TIMELINE",
    // The sixth-most-recent engagement, which is as far down as 800px reaches.
    subtitle: "2019 → NOW",
  },
  {
    name: "principles",
    draw: drawPrinciples,
    accent: "#c084fc",
    title: "PRINCIPLES",
    subtitle: "HOW I BUILD",
  },
  {
    name: "stack",
    draw: drawStack,
    accent: "#7dd3fc",
    title: "STACK",
    subtitle: "TOOLS OF THE TRADE",
  },
  {
    name: "playground",
    draw: drawPlayground,
    accent: "#facc15",
    title: "PLAYGROUND",
    subtitle: "EXPERIMENTS · DEMOS",
  },
];

function paint(draw: (ctx: CanvasRenderingContext2D) => void): RecordingContext {
  const recording = createRecordingContext({ width: WIDTH, height: HEIGHT });
  draw(recording.ctx);
  return recording;
}

function leftEdge(run: TextRun): number {
  if (run.align === "right") return run.x - run.width;
  if (run.align === "center") return run.x - run.width / 2;
  return run.x;
}

function lineHeight(run: TextRun): number {
  return Number(/(\d+)px/.exec(run.font)?.[1] ?? 0);
}

// The stack panel distinguishes a group heading from a tool chip by font alone, and both
// can be all caps ("AI", "R3F"), so that is what the spec has to go by too.
function groupLabels(runs: readonly TextRun[]): string[] {
  return runs.filter((run) => run.font.startsWith("bold 14px")).map((run) => run.text);
}

function chipLabels(runs: readonly TextRun[]): TextRun[] {
  return runs.filter((run) => run.font.startsWith("16px"));
}

describe.each(PANELS)("$name wall screen", ({ draw, accent, title, subtitle }) => {
  it("fills the whole panel before it paints anything on it", () => {
    const { transcript } = paint(draw);

    expect(transcript.slice(0, 2)).toEqual(['fillStyle = "#03080c"', "fillRect(0, 0, 600, 800)"]);
  });

  it("heads the panel with its own title, subtitle and accent", () => {
    const { runs } = paint(draw);

    expect(runs[0]).toMatchObject({ text: title, style: accent, x: 36, y: 40 });
    expect(runs[1]).toMatchObject({ text: subtitle, x: 36, y: 80 });
  });

  it("keeps every line of text inside the panel", () => {
    const { runs } = paint(draw);

    for (const run of runs) {
      expect
        .soft(leftEdge(run), `"${run.text}" starts off the left edge`)
        .toBeGreaterThanOrEqual(0);
      expect
        .soft(leftEdge(run) + run.width, `"${run.text}" runs past the right edge`)
        .toBeLessThanOrEqual(WIDTH);
      expect
        .soft(run.y + lineHeight(run), `"${run.text}" runs past the bottom edge`)
        .toBeLessThanOrEqual(HEIGHT);
    }
  });

  it("draws text from the top left, so nothing depends on a previous panel's state", () => {
    const { runs, valuesOf } = paint(draw);

    expect(runs.every((run) => run.baseline === "top")).toBe(true);
    // Both are shared mutable state on a context these routines do not own: the right-aligned
    // rows set them and every one of them must hand back the default.
    expect(valuesOf("textAlign").at(-1)).toBe("left");
    expect(valuesOf("globalAlpha").at(-1)).toBe(1);
  });

  it("paints exactly the same panel twice, since nothing in it is random", () => {
    expect(paint(draw).transcript).toEqual(paint(draw).transcript);
  });
});

describe("resume panel", () => {
  it("projects the five most recent engagements, role uppercased, newest first", () => {
    const { text } = paint(paintResume);
    const rows = engagements.slice(0, 5);

    expect(text).toEqual([
      siteConfig.name.toUpperCase(),
      siteConfig.role.toUpperCase(),
      "● EXPERIENCE",
      ...rows.flatMap((engagement) => [
        engagement.role.toUpperCase(),
        engagement.company,
        engagement.years,
      ]),
      "● FOCUS",
      "Frontend Platform · AI-Native UX",
      "Design Systems · Performance",
      // No PDF exists behind this yet. `docs/refactor.md` Phase 8 owns removing it or
      // wiring a real file; it is a product decision, not a refactor's.
      "↧  DOWNLOAD RÉSUMÉ",
    ]);
  });

  it("hangs the dates off the right edge and the roles off the left", () => {
    const dates = paint(paintResume).runs.filter((run) => /^20\d\d/.test(run.text));

    expect(dates).toHaveLength(5);
    expect(dates.every((run) => run.align === "right" && run.x === WIDTH - 36)).toBe(true);
  });

  it("marks each role with an accent tick, so the rows read as a list", () => {
    const ticks = paint(paintResume)
      .callsTo("fillRect")
      .filter(([, , width]) => width === 4);

    expect(ticks.map(([, y]) => y)).toEqual([186, 268, 350, 432, 514]);
  });
});

describe("timeline panel", () => {
  it("reads from the most recent stop down, year over role over company", () => {
    const { text } = paint(paintTimeline);

    expect(text.slice(3)).toEqual(
      engagements
        .slice(0, 6)
        .flatMap((engagement) => [
          engagement.start.slice(0, 4),
          engagement.role,
          engagement.company,
        ]),
    );
  });

  it("threads one spine through a dot per stop", () => {
    const { callsTo } = paint(paintTimeline);
    const dots = callsTo("arc");

    expect(dots).toHaveLength(6);
    expect(dots.map(([x]) => x)).toEqual([56, 56, 56, 56, 56, 56]);
    // The spine is the second stroke — the header's divider is the first — and it has to
    // reach the last dot and no further, or it hangs in space.
    expect(callsTo("moveTo")[1]).toEqual([56, 200]);
    expect(callsTo("lineTo")[1]).toEqual([56, 650]);
    expect(dots.at(-1)?.[1]).toBe(650);
  });
});

describe("principles panel", () => {
  it("numbers all seven principles from 01", () => {
    const { text } = paint(drawPrinciples);

    expect(text.slice(3)).toEqual([
      "01",
      "Ship small, ship often",
      "02",
      "Accessibility is non-negotiable",
      "03",
      "Performance is a feature",
      "04",
      "Type-safe at every boundary",
      "05",
      "Design systems scale teams",
      "06",
      "Automate the boring parts",
      "07",
      "Clarity over cleverness",
    ]);
  });
});

describe("stack panel", () => {
  it("groups every tool under a heading", () => {
    const { runs, text } = paint(drawStack);

    expect(groupLabels(runs)).toEqual([
      "FRONTEND",
      "3D / MOTION",
      "STYLING",
      "PLATFORM",
      "QUALITY",
      "AI",
    ]);
    expect(text).toContain("React 19");
    expect(text).toContain("Playwright");
  });

  it("sizes each chip to the text inside it and keeps the row on the panel", () => {
    const { callsTo, runs } = paint(drawStack);
    const chips = callsTo("roundRect");
    const items = chipLabels(runs);

    expect(chips).toHaveLength(18);
    for (const [index, chip] of chips.entries()) {
      const x = Number(chip[0]);
      const width = Number(chip[2]);
      const item = items[index];
      expect.soft(width).toBeCloseTo((item?.width ?? 0) + 28, 5);
      expect.soft(x + width).toBeLessThanOrEqual(WIDTH);
    }
  });
});

describe("playground panel", () => {
  it("scores the experiments and invites a start", () => {
    const { text } = paint(drawPlayground);

    expect(text.slice(3)).toEqual([
      "P1",
      "Shader playground",
      "WebGL",
      "P2",
      "Generative art",
      "Canvas",
      "P3",
      "Game prototypes",
      "R3F",
      "P4",
      "Creative coding",
      "p5",
      "P5",
      "Audio-reactive viz",
      "WebAudio",
      "▶ PRESS START",
    ]);
  });
});
