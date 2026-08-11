import { describe, expect, it } from "vitest";

import { createRecordingContext, type RecordingContext } from "@tests/recording-ctx";

import { CHANNELS } from "./lounge-tv-channels";
import { drawLoungeTv } from "./lounge-tv-screen-draw";

/**
 * The lounge television. `use-lounge-tv-texture.ts` ticks it every 110 ms on a 640×360
 * canvas, so every frame is a pure function of one integer — which is what makes the
 * channel rotation, the tune-in static and the progress bar assertable at all. The static
 * is seeded from that tick (see `decisions.md`); if it ever calls `Math.random()` again,
 * the determinism test below is what fails.
 */

const SIZE = { width: 640, height: 360 };
const CHANNEL_TICKS = 90;

function paint(tick: number): RecordingContext {
  const recording = createRecordingContext(SIZE);
  drawLoungeTv(recording.ctx, { tick });
  return recording;
}

/** The 2×2 grains `drawStatic` paints, and nothing else on the screen is that size. */
function grain(recording: RecordingContext): readonly (readonly unknown[])[] {
  return recording.callsTo("fillRect").filter(([, , w, h]) => w === 2 && h === 2);
}

/**
 * The overlay goes on last and always paints the same four strings — channel name, LIVE,
 * elapsed, total — so it is addressed from the end. Anything before them belongs to the
 * channel, which paints a different number of strings on each one.
 */
function channelName(tick: number): string | undefined {
  return paint(tick).text.at(-4);
}

describe("channel rotation", () => {
  it("gives every channel an equal turn and starts over", () => {
    const names = [0, 90, 180, 270, 360].map(channelName);

    expect(names).toEqual([
      "CH-01 · GRID",
      "CH-02 · LIVE CODE",
      "CH-03 · TELEMETRY",
      "CH-01 · GRID",
      "CH-02 · LIVE CODE",
    ]);
  });

  it("holds a channel for its whole slot", () => {
    expect(channelName(1)).toBe(channelName(CHANNEL_TICKS - 1));
    expect(channelName(CHANNEL_TICKS - 1)).not.toBe(channelName(CHANNEL_TICKS));
  });

  it("names as many channels as it can play", () => {
    const played = new Set(
      Array.from({ length: CHANNEL_TICKS * CHANNELS.length }, (_, tick) => channelName(tick)),
    );

    expect(played).toEqual(new Set(CHANNELS.map((channel) => channel.name)));
  });
});

describe("tune-in static", () => {
  it("bursts for the first two ticks of a channel and then clears", () => {
    expect(grain(paint(CHANNEL_TICKS))).toHaveLength(900);
    expect(grain(paint(CHANNEL_TICKS + 1))).toHaveLength(900);
    expect(grain(paint(CHANNEL_TICKS + 2))).toHaveLength(0);
  });

  it("is seeded by the tick: reproducible for one, different across two", () => {
    expect(paint(CHANNEL_TICKS).transcript).toEqual(paint(CHANNEL_TICKS).transcript);
    expect(grain(paint(CHANNEL_TICKS))).not.toEqual(grain(paint(CHANNEL_TICKS + 1)));
  });

  it("keeps every grain on the screen", () => {
    for (const [x, y] of grain(paint(0))) {
      expect.soft(Number(x)).toBeLessThan(SIZE.width);
      expect.soft(Number(y)).toBeLessThan(SIZE.height);
    }
  });
});

describe("overlay", () => {
  it("runs the progress bar across the screen and back", () => {
    const head = (tick: number): number => {
      const path = paint(tick).paths.at(-2);
      return Number(path?.points.at(-1)?.[0]);
    };

    expect(head(0)).toBe(18);
    expect(head(150)).toBeCloseTo(18 + (SIZE.width - 36) / 2, 5);
    // 300 ticks is one cycle, so the bar is back where it started.
    expect(head(300)).toBe(18);
  });

  it("counts the elapsed time up to the running time it advertises", () => {
    expect(paint(0).text).toContain("▶ 0:00");
    expect(paint(150).text).toContain("▶ 5:06");
    expect(paint(299).text).toContain("▶ 10:09");
    // The total never moves, and the elapsed time never passes it.
    expect(paint(299).text).toContain("10:12");
  });

  it("blinks the record dot on for eight ticks in twelve", () => {
    const dot = (tick: number): boolean =>
      paint(tick).paths.some((path) => path.paints[0]?.style === "#ff5d5d");

    expect([0, 7].map(dot)).toEqual([true, true]);
    expect([8, 11].map(dot)).toEqual([false, false]);
  });

  it("labels the feed live and leaves the context aligned left", () => {
    const { text, valuesOf } = paint(0);

    expect(text).toContain("LIVE");
    expect(valuesOf("textAlign").at(-1)).toBe("left");
  });
});

describe("channels", () => {
  it("grid: scrolls the perspective floor as the tick advances", () => {
    const floor = (tick: number): readonly number[] =>
      paint(tick)
        .paths.filter((path) => path.points.length === 2 && path.points[0]?.[0] === 0)
        .map((path) => Number(path.points[0]?.[1]));

    expect(floor(0)).not.toEqual(floor(4));
    // The horizon lines stay below the horizon and on the screen.
    for (const y of floor(0)) {
      expect.soft(y).toBeGreaterThanOrEqual(200);
      expect.soft(y).toBeLessThanOrEqual(SIZE.height);
    }
  });

  it("grid: paints the sky and the sun with gradients, then restores full opacity", () => {
    const { transcript, valuesOf } = paint(0);

    expect(transcript).toContain('gradient#1.addColorStop(0, "#04070b")');
    expect(transcript).toContain('gradient#2.addColorStop(1, "rgba(34, 211, 238, 0)")');
    expect(valuesOf("globalAlpha").at(-1)).toBe(1);
  });

  it("code: scrolls one line every six ticks and wraps", () => {
    // Tick 132 is inside the code channel's slot (90–179) and the point at which its
    // eleven-line loop starts over, which is what makes the numbers below readable.
    const first = (tick: number): string | undefined => paint(132 + tick).text[0];

    expect(first(0)).toBe("01");
    expect(first(5)).toBe("01");
    expect(first(6)).toBe("02");
    // One line short of the loop is the last line, not the twelfth.
    expect(first(-6)).toBe("11");
  });

  it("code: colors a comment differently from the code around it", () => {
    const { runs } = paint(90);
    const comment = runs.find((run) => run.text.startsWith("//"));
    const code = runs.find((run) => run.text.startsWith("export"));

    expect(comment?.style).toBe("rgba(125, 211, 252, 0.45)");
    expect(code?.style).toBe("#67e8f9");
  });

  it("code: blinks the cursor for half of every eight ticks", () => {
    // 96 starts an eight-tick blink cycle and is inside the code channel's slot.
    const cursor = (tick: number): number =>
      paint(96 + tick)
        .callsTo("fillRect")
        .filter(([, , w, h]) => w === 9 && h === 17).length;

    expect([0, 3].map(cursor)).toEqual([1, 1]);
    expect([4, 7].map(cursor)).toEqual([0, 0]);
  });

  it("telemetry: draws a waveform that spans the screen and moves with the tick", () => {
    // The waveform is drawn twice: a gradient fill closed off at the bottom corners, then
    // the line itself. The line is the one a visitor reads as the signal.
    const wave = (tick: number): readonly (readonly [number, number])[] =>
      paint(180 + tick).paths.find(
        (path) => path.paints[0]?.kind === "stroke" && path.points.length > 100,
      )?.points ?? [];

    expect(wave(0).at(0)?.[0]).toBe(0);
    // Sampled every 6px, so it reaches the last multiple of 6 rather than the edge itself —
    // 636 of 640. The gradient underneath is closed at the corner, so nothing looks cut.
    expect(wave(0).at(-1)?.[0]).toBeGreaterThan(SIZE.width - 6);
    expect(wave(0)).not.toEqual(wave(1));
    expect(paint(180).text).toContain("TELEMETRY");
  });
});
