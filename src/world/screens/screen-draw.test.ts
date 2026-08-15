import { describe, expect, it } from "vitest";

import { worldColors } from "@/world/materials";
import { createRecordingContext, type Path, type RecordingContext } from "@tests/recording-ctx";

import { drawCode } from "./code-screen-draw";
import { CODE_TOKENS } from "./code-screen-data";
import { drawMetrics, type MetricsView } from "./metrics-screen-draw";
import { drawTablet } from "./tablet-screen-draw";
import { drawTerminal, type StatusView } from "./terminal-screen-draw";
import { STATUS_ROWS } from "./terminal-screen-data";

/**
 * The three screens on the studio desk and the tablet beside them. They redraw on a frame
 * or a timer, so what matters is that a given input paints one exact thing — and that the
 * inputs that move (a caret, a frame rate, a clock, a stroke) each change the picture.
 */

const DESK = { width: 640, height: 400 };
const TABLET = { width: 358, height: 512 };

function paint(draw: (ctx: CanvasRenderingContext2D) => void, size = DESK): RecordingContext {
  const recording = createRecordingContext(size);
  draw(recording.ctx);
  return recording;
}

// The sparkline is the one path drawn in the plot area, and the tablet's ink is the one
// stroked twice — grouping by `beginPath` is what tells them apart from the grid and rules
// drawn around them, without a spec guessing at coordinates.
function sparkline({ paths }: RecordingContext): Path {
  return paths.find((path) => path.points.every(([x]) => x >= 250)) ?? { points: [], paints: [] };
}

function trace({ paths }: RecordingContext): Path {
  return paths.find((path) => path.paints.length === 2) ?? { points: [], paints: [] };
}

// The nib is the dot filled straight after the ink; the tool dots come later.
function head({ paths }: RecordingContext): Path | undefined {
  const ink = paths.findIndex((path) => path.paints.length === 2);
  return paths.slice(ink + 1).find((path) => path.points.length === 1);
}

describe("code screen", () => {
  it("numbers the visible window from line 12 and colors each token by kind", () => {
    const { runs } = paint((ctx) => drawCode(ctx, false));

    const gutter = runs.filter((run) => run.x === 30 && run.font.startsWith("16px"));
    expect(gutter.map((run) => run.text)).toEqual([
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
    ]);
    expect(runs.find((run) => run.text.startsWith("//"))?.style).toBe(CODE_TOKENS.comment);
    expect(runs.find((run) => run.text === "export")?.style).toBe(CODE_TOKENS.keyword);
    expect(runs.find((run) => run.text === "AgentInput")?.style).toBe(CODE_TOKENS.type);
    expect(runs.find((run) => run.text === '"tool"')?.style).toBe(CODE_TOKENS.string);
  });

  it("lays tokens out left to right by their measured width", () => {
    const { runs } = paint((ctx) => drawCode(ctx, false));
    const line = runs.filter((run) => run.y === 116 && run.x >= 80);

    expect(line.map((run) => run.text).join("")).toBe(
      "export async function run(input: AgentInput) {",
    );
    for (const [index, run] of line.entries()) {
      const previous = line[index - 1];
      if (previous) expect(run.x).toBeCloseTo(previous.x + previous.width, 5);
    }
  });

  it("keeps the longest line on the screen", () => {
    const { runs } = paint((ctx) => drawCode(ctx, false));

    for (const run of runs) {
      expect.soft(run.x + run.width, `"${run.text}" runs off the screen`).toBeLessThanOrEqual(640);
    }
  });

  it("blinks the caret at the end of the line it is on, and only when it is on", () => {
    const off = paint((ctx) => drawCode(ctx, false));
    const on = paint((ctx) => drawCode(ctx, true));

    const caret = (recording: RecordingContext): readonly (readonly unknown[])[] =>
      recording.callsTo("fillRect").filter(([, , width, height]) => width === 2 && height === 22);

    expect(caret(off)).toHaveLength(0);
    expect(caret(on)).toHaveLength(1);
    // Line index 5 of the window, immediately after `execute(step);`.
    const [, y] = caret(on)[0] ?? [];
    expect(y).toBe(220);
    expect(on.valuesOf("fillStyle")).toContain(worldColors.accentSoft);
  });
});

describe("metrics screen", () => {
  const view: MetricsView = {
    fps: 59.6,
    frameMs: 16.78,
    history: [60, 30, 72, 0],
    resolution: "1920×1080",
    dpr: 1.5,
  };

  it("reports the frame rate as a whole number and the rest at fixed precision", () => {
    const { text } = paint((ctx) => drawMetrics(ctx, view));

    expect(text).toContain("60");
    expect(text).toContain("16.8 ms");
    expect(text).toContain("1920×1080");
    expect(text).toContain("1.50×");
  });

  it("plots one sparkline point per sample, spread across the plot area", () => {
    const { points } = sparkline(paint((ctx) => drawMetrics(ctx, view)));

    expect(points).toHaveLength(view.history.length);
    expect(points.at(0)?.[0]).toBe(250);
    expect(points.at(-1)?.[0]).toBe(610);
  });

  it("clamps a sample that is off the scale instead of drawing outside the plot", () => {
    const { points } = sparkline(
      paint((ctx) => drawMetrics(ctx, { ...view, history: [240, -12, 36] })),
    );

    // 72 fps is the top of the scale (y 116) and 0 is the bottom (y 180); a reading above or
    // below the scale has to sit on the edge rather than escape the box.
    expect(points.map(([, y]) => y)).toEqual([116, 180, 148]);
  });

  it("draws a sparkline for a single sample without dividing by zero", () => {
    const { points } = sparkline(paint((ctx) => drawMetrics(ctx, { ...view, history: [36] })));

    expect(points).toEqual([[250, 148]]);
  });
});

describe("terminal screen", () => {
  const view: StatusView = {
    rows: STATUS_ROWS,
    time: "14:35:02",
    date: "Mon, 03 Feb",
    uptime: "00:12:34",
    focus: "design systems",
  };

  it("shows the status rows the site config owns, then focus, clock and uptime", () => {
    const { text } = paint((ctx) => drawTerminal(ctx, view));
    const shown = text.filter((entry) => entry !== "▸");

    expect(shown.filter((_, index) => index % 2 === 0)).toEqual([
      "● STUDIO · LIVE",
      ...STATUS_ROWS.map((row) => row.label),
      "focus",
      "local",
      "uptime",
    ]);
    // The three config values are all longer than the column, so what a visitor reads is a
    // truncation of each — which is the screen working, not a fixture that needs loosening.
    for (const [index, row] of STATUS_ROWS.entries()) {
      const value = shown[3 + index * 2] ?? "";
      expect.soft(row.value.startsWith(value.replace(/…$/, ""))).toBe(true);
    }
    expect(shown.at(-1)).toBe("00:12:34");
    expect(shown).toContain("14:35:02 · Mon, 03 Feb");
  });

  it("hangs the clock off the right edge, measured rather than guessed", () => {
    const clock = paint((ctx) => drawTerminal(ctx, view)).runs[1];

    expect(clock?.text).toBe("14:35:02");
    expect((clock?.x ?? 0) + (clock?.width ?? 0)).toBe(640 - 30);
  });

  it("truncates a value that would not fit, and leaves one that would", () => {
    const long = "a".repeat(80);
    const { text } = paint((ctx) => drawTerminal(ctx, { ...view, focus: long }));
    const shown = text.find((entry) => entry.startsWith("aaa")) ?? "";

    expect(shown.endsWith("…")).toBe(true);
    expect(shown.length).toBeLessThan(long.length);
    // 20px monospace in the 442px left after the label column.
    expect(shown.length * 12).toBeLessThanOrEqual(640 - 168 - 30);
    // A value that already fits is left alone.
    expect(text).toContain("00:12:34");
  });
});

describe("tablet screen", () => {
  it("draws the stroke up to the progress it is given", () => {
    const quarter = trace(paint((ctx) => drawTablet(ctx, { progress: 0.25, pressure: 0 }), TABLET));
    const whole = trace(paint((ctx) => drawTablet(ctx, { progress: 1, pressure: 0 }), TABLET));

    expect(quarter.points.length).toBeLessThan(whole.points.length);
    // Both traces start at the same place, so the drawing looks continuous as it grows.
    expect(quarter.points[0]).toEqual(whole.points[0]);
    // Painted twice on one path: a wide halo under a thin line.
    expect(whole.paints.map((paint) => paint.kind)).toEqual(["stroke", "stroke"]);
  });

  it("never traces fewer than two points, so an unstarted stroke is still a line", () => {
    const recording = paint((ctx) => drawTablet(ctx, { progress: 0, pressure: 0 }), TABLET);
    const { points } = trace(recording);

    expect(points).toHaveLength(2);
    // The nib sits on the end of the ink, whatever the progress.
    expect(head(recording)?.points[0]).toEqual(points.at(-1));
  });

  it("thickens the ink with pressure", () => {
    const light = paint((ctx) => drawTablet(ctx, { progress: 1, pressure: 0 }), TABLET);
    const heavy = paint((ctx) => drawTablet(ctx, { progress: 1, pressure: 1 }), TABLET);

    expect(light.valuesOf("lineWidth")).toContain(4);
    expect(heavy.valuesOf("lineWidth")).toContain(6.5);
  });

  it("frames the sketch with a grid, a header and five tools", () => {
    const recording = paint((ctx) => drawTablet(ctx, { progress: 1, pressure: 0.5 }), TABLET);
    const { callsTo, paths, text } = recording;

    expect(text).toEqual(["SKETCH", "layer 02"]);
    // The grid is one path of 42px verticals and horizontals, stroked once.
    const grid = paths[0];
    expect(grid?.points.filter(([, y]) => y === 0).map(([x]) => x)).toEqual([
      42, 84, 126, 168, 210, 252, 294, 336,
    ]);
    expect(grid?.paints).toHaveLength(1);
    // Five tool dots, of which exactly one carries the active accent.
    const tools = callsTo("arc").filter(([, , radius]) => radius === 13);
    expect(tools).toHaveLength(5);
    expect(
      paths
        .filter((path) => path.points.length === 1 && path.paints[0]?.kind === "fill")
        .filter((path) => path.paints[0]?.style === worldColors.accent),
    ).toHaveLength(1);
  });
});
