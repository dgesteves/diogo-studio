import { describe, expect, it } from "vitest";

import { worldColors } from "../materials";
import { createRecordingContext, type Path, type RecordingContext } from "@tests/recording-ctx";

import {
  drawCode,
  CODE_TOKENS,
  drawMetrics,
  type MetricsView,
  drawTerminal,
  type StatusView,
  STATUS_ROWS,
} from "./monitors";
import {
  ALARM,
  CHANNEL_PIGMENTS,
  CHANNELS,
  CONTROL_SCREEN,
  controlDeckView,
  drawControlDeck,
  KEY_LAMPS,
  KEYS,
} from "./control-deck";
import { drawMacbookDesktop, MACBOOK_SCREEN } from "./macbook";
import { drawPhoneHome, PHONE_SCREEN } from "./phone";
import { drawTabletHome, TABLET_SCREEN } from "./tablet";
import { monogram, type HomeApp } from "./home";

/**
 * The three screens on the studio desk, the control deck's panel, the two devices lying on it
 * — the phone by the mouse and the tablet beside the keyboard — and the laptop's desktop
 * across the room.
 * They redraw on a frame or a timer, so what matters is that a given input paints one exact
 * thing — and that the inputs that move (a caret, a frame rate, a clock, a level) each change
 * the picture.
 */

const DESK = { width: 640, height: 400 };

function paint(draw: (ctx: CanvasRenderingContext2D) => void, size = DESK): RecordingContext {
  const recording = createRecordingContext(size);
  draw(recording.ctx);
  return recording;
}

// The sparkline is the one path drawn in the plot area — grouping by `beginPath` is what
// tells it apart from the grid and the rules drawn around it, without a spec guessing at
// coordinates.
function sparkline({ paths }: RecordingContext): Path {
  return paths.find((path) => path.points.every(([x]) => x >= 250)) ?? { points: [], paints: [] };
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

/**
 * The console panel. Its two failures both still look like a working screen: a meter painted
 * past the end of its track, and a key row where every chip is lit or none is.
 */
describe("control deck panel", () => {
  const KEY_ROW_Y = 264;
  const level = 0.42;
  const deck = (levels: readonly number[], active = 0): RecordingContext =>
    paint((ctx) => drawControlDeck(ctx, { levels, active }), CONTROL_SCREEN);

  const chips = ({ paths }: RecordingContext) =>
    paths.filter((path) => path.points.some(([, y]) => y === KEY_ROW_Y));

  it("names every channel and every key, and reads each level as a percentage", () => {
    const { text } = deck(CHANNELS.map(() => level));

    expect(text).toEqual([
      "●",
      "CONTROL",
      "hub · linked",
      ...CHANNELS.flatMap((channel) => [channel, "42%"]),
      ...KEYS,
    ]);
  });

  it("keeps a meter inside its track whatever level it is handed", () => {
    const { callsTo, text } = deck([1.6, -0.4, 0.5, 0]);
    const bars = callsTo("roundRect").filter(([, y]) => y !== KEY_ROW_Y);
    // Track and fill for each of the four channels, in pairs.
    const track = Number(bars[0]?.[2]);

    expect(bars).toHaveLength(CHANNELS.length * 2);
    for (const [, , width] of bars) {
      expect.soft(Number(width)).toBeGreaterThan(0);
      expect.soft(Number(width)).toBeLessThanOrEqual(track);
    }
    expect(text).toContain("100%");
    expect(text).toContain("0%");
  });

  it("paints every channel in its own hue, so no two meters read as one instrument", () => {
    const painted = deck(CHANNELS.map(() => level)).valuesOf("fillStyle");
    const hues = CHANNELS.map((channel) => CHANNEL_PIGMENTS[channel]);

    expect(new Set(hues).size).toBe(CHANNELS.length);
    for (const hue of hues) expect.soft(painted).toContain(hue);
  });

  it("hands a channel over its ceiling to the alarm, whichever hue it was", () => {
    const calm = deck([0.5, 0.5, 0.5, 0.5]);
    const hot = deck([0.95, 0.5, 0.5, 0.5]);

    expect(calm.valuesOf("fillStyle")).not.toContain(ALARM);
    expect(hot.valuesOf("fillStyle")).toContain(ALARM);
  });

  it("lights exactly one key, the one the view names, in that key's own lamp", () => {
    const painted = chips(
      deck(
        CHANNELS.map(() => level),
        2,
      ),
    );
    const lit = KEYS.map((key, index) => painted[index]?.paints[0]?.style === KEY_LAMPS[key]);

    expect(lit).toEqual([false, false, true, false]);
  });

  it("drifts every channel inside its meter and steps the lit key along the row", () => {
    const seen = new Set<number>();

    for (let t = 0; t < 24; t += 0.25) {
      const view = controlDeckView(t);
      seen.add(view.active);
      for (const value of view.levels) {
        expect.soft(value).toBeGreaterThan(0);
        expect.soft(value).toBeLessThan(1);
      }
    }

    expect([...seen].sort()).toEqual(KEYS.map((_, index) => index));
    expect(controlDeckView(1).levels).not.toEqual(controlDeckView(2).levels);
  });
});

/**
 * The phone's home screen. Its failures are all quiet ones: a station dropped off the end of
 * the grid, a label run into its neighbor, a dock that takes five. The screen is 7 cm of desk
 * seen from across the room, so none of them shows up anywhere but in the transcript.
 */
describe("phone home screen", () => {
  const CLOCK = "16:20";
  const DATE = "Thursday, August 20";

  /** Enough to overflow the screen, so what it drops is a decision rather than an accident. */
  const APPS: readonly HomeApp[] = Array.from({ length: 24 }, (_, index) => ({
    label: `Station ${index}`,
    accent: `#${(index + 16).toString(16).padStart(2, "0")}d3ee`,
  }));

  const home = (apps: readonly HomeApp[] = APPS): RecordingContext =>
    paint((ctx) => drawPhoneHome(ctx, { apps, clock: CLOCK, date: DATE }), PHONE_SCREEN);

  it("docks four apps and fills the grid with the rest, in reading order", () => {
    const labels = home().runs.map((run) => run.text);
    const docked = APPS.slice(0, 4).map((app) => app.label);
    const gridded = APPS.slice(4, 20).map((app) => app.label);

    // The dock is wordless — a docked app is known by its tile — so no label of one is set.
    for (const label of docked) expect.soft(labels).not.toContain(label);
    expect(labels.filter((text) => text.startsWith("Station "))).toEqual(gridded);
  });

  it("drops what the screen has no room for rather than painting off the edge", () => {
    const { runs } = home();
    const dropped = APPS.slice(20).map((app) => app.label);

    expect(dropped).not.toEqual([]);
    for (const label of dropped) expect.soft(runs.map((run) => run.text)).not.toContain(label);
    for (const run of runs) {
      expect.soft(run.y).toBeLessThan(PHONE_SCREEN.height);
      expect.soft(run.x).toBeGreaterThan(0);
    }
  });

  it("elides a label too long for its column instead of running it into the next", () => {
    const long = [...APPS.slice(0, 4), { label: "A station named at length", accent: "#22d3ee" }];
    const label = home(long).runs.find((run) => run.text.startsWith("A station"));

    expect(label?.text).toMatch(/…$/);
    expect(label!.width).toBeLessThan(PHONE_SCREEN.width * 0.25);
  });

  it("shows the same minute in the status bar and on the card", () => {
    const { runs } = home();

    expect(runs.filter((run) => run.text === CLOCK)).toHaveLength(2);
    expect(runs.filter((run) => run.text === DATE)).toHaveLength(1);
  });

  it("floods one tile per app with that app's own station color", () => {
    const { callsTo, valuesOf } = home();
    const shown = APPS.slice(0, 20);
    // A tile is the only square this screen fills — every other fill is a rounded path — and
    // it is filled twice, once with the color and once with the gloss laid over it.
    const squares = new Set(
      callsTo("fillRect")
        .filter(([, , width, height]) => width === height)
        .map(([x, y]) => `${x},${y}`),
    );

    expect(squares.size).toBe(shown.length);
    for (const app of shown) expect.soft(valuesOf("fillStyle")).toContain(app.accent);
  });

  it("takes the initials of a label, and never more than two", () => {
    expect(monogram("Case studies")).toBe("CS");
    expect(monogram("Open source")).toBe("OS");
    expect(monogram("Now")).toBe("N");
    expect(monogram("Résumé")).toBe("R");
    expect(monogram("one two three four")).toBe("OT");
  });
});

/**
 * The tablet's home screen. It shows the same room as the phone's from the same kit, so what
 * is worth asserting is what makes it a *tablet*: five to a row rather than four, a dock that
 * is five wide, and a card that names the city the studio's clock is set to.
 */
describe("tablet home screen", () => {
  const CLOCK = "16:20";
  const DATE = "Thursday, August 20";
  const CITY = "Lisbon";
  const DOCKED = 5;
  const COLUMNS = 5;
  const GRIDDED = COLUMNS * 3;

  /** Enough to overflow the screen, so what it drops is a decision rather than an accident. */
  const APPS: readonly HomeApp[] = Array.from({ length: 24 }, (_, index) => ({
    label: `Station ${index}`,
    accent: `#${(index + 16).toString(16).padStart(2, "0")}d3ee`,
  }));

  const home = (apps: readonly HomeApp[] = APPS): RecordingContext =>
    paint(
      (ctx) => drawTabletHome(ctx, { apps, clock: CLOCK, date: DATE, city: CITY }),
      TABLET_SCREEN,
    );

  it("docks five apps and fills the grid with the rest, in reading order", () => {
    const labels = home().runs.map((run) => run.text);

    // The dock is wordless — a docked app is known by its tile — so no label of one is set.
    for (const app of APPS.slice(0, DOCKED)) expect.soft(labels).not.toContain(app.label);
    expect(labels.filter((text) => text.startsWith("Station "))).toEqual(
      APPS.slice(DOCKED, DOCKED + GRIDDED).map((app) => app.label),
    );
  });

  it("lays the grid out five to a row, on one pitch", () => {
    const centers = home()
      .runs.filter((run) => run.text.startsWith("Station "))
      .map((run) => run.x);
    const row = centers.slice(0, COLUMNS);

    // Every row starts over at the same five columns, which is what makes it a grid.
    expect(centers.slice(COLUMNS, COLUMNS * 2)).toEqual(row);
    expect(centers.slice(COLUMNS * 2)).toEqual(row);
    const pitches = row.slice(1).map((x, index) => x - row[index]!);
    for (const pitch of pitches) expect.soft(pitch).toBeCloseTo(pitches[0]!, 6);
  });

  it("drops what the screen has no room for rather than painting off the edge", () => {
    const { runs } = home();
    const dropped = APPS.slice(DOCKED + GRIDDED).map((app) => app.label);

    expect(dropped).not.toEqual([]);
    for (const label of dropped) expect.soft(runs.map((run) => run.text)).not.toContain(label);
    for (const run of runs) {
      expect.soft(run.y).toBeLessThan(TABLET_SCREEN.height);
      expect.soft(run.x).toBeGreaterThan(0);
    }
  });

  it("elides a label too long for its column instead of running it into the next", () => {
    const long = [
      ...APPS.slice(0, DOCKED),
      { label: "A station named at length", accent: "#22d3ee" },
    ];
    const label = home(long).runs.find((run) => run.text.startsWith("A station"));

    expect(label?.text).toMatch(/…$/);
    expect(label!.width).toBeLessThan(TABLET_SCREEN.width * 0.2);
  });

  it("shows the studio's minute twice and names the city it is kept in", () => {
    const { runs } = home();

    expect(runs.filter((run) => run.text === CLOCK)).toHaveLength(2);
    expect(runs.filter((run) => run.text === DATE)).toHaveLength(1);
    expect(runs.filter((run) => run.text === CITY)).toHaveLength(1);
  });

  it("floods one tile per app with that app's own station color", () => {
    const { callsTo, valuesOf } = home();
    const shown = APPS.slice(0, DOCKED + GRIDDED);
    // A tile is the only square this screen fills — every other fill is a rounded path — and
    // it is filled twice, once with the color and once with the gloss laid over it.
    const squares = new Set(
      callsTo("fillRect")
        .filter(([, , width, height]) => width === height)
        .map(([x, y]) => `${x},${y}`),
    );

    expect(squares.size).toBe(shown.length);
    for (const app of shown) expect.soft(valuesOf("fillStyle")).toContain(app.accent);
  });
});

/**
 * The laptop's desktop. It shows the same stations the two devices on the desk show, so what
 * this file has to hold is the two things that make it a *desktop* rather than a third copy of
 * a home screen — the menu bar it shares with a notch, and the window standing open on it.
 */
describe("laptop desktop", () => {
  // Short enough to survive both the sidebar and a tile caption: the elision that longer ones
  // get is the next test's claim, not this fixture's business.
  const APPS: readonly HomeApp[] = [
    { label: "Studio", accent: "#22d3ee" },
    { label: "Work", accent: "#a78bfa" },
    { label: "Now", accent: "#34d399" },
  ];
  const view = { apps: APPS, clock: "09:41", date: "Friday, August 21" };
  const desktop = (): RecordingContext =>
    paint((ctx) => drawMacbookDesktop(ctx, view), MACBOOK_SCREEN);

  it("hangs the clock and the date off the right of the menu bar", () => {
    const { runs } = desktop();
    const right = runs.find((run) => run.align === "right");

    expect(right?.text).toBe("Friday, August 21   09:41");
    expect(right?.y).toBeLessThan(MACBOOK_SCREEN.width * 0.03);
  });

  /**
   * The notch is a piece the panel does not have, so it is painted over the bar rather than
   * under it, and it hangs off the top edge — the only rounded rectangle on the screen whose
   * two upper corners are square.
   */
  it("cuts the notch out of the middle of the menu bar", () => {
    const [x, y, width, , radii] =
      desktop()
        .callsTo("roundRect")
        .find((call) => call[1] === 0) ?? [];

    expect(Number(x) + Number(width) / 2).toBeCloseTo(MACBOOK_SCREEN.width / 2, 6);
    expect(y).toBe(0);
    expect(radii).toEqual([0, 0, expect.any(Number), expect.any(Number)]);
  });

  it("lists every station down the sidebar and names each tile in the grid", () => {
    const { runs } = desktop();
    const sidebar = runs.filter((run) => run.align === "left").map((run) => run.text);
    const captions = runs.filter((run) => run.align === "center").map((run) => run.text);

    for (const app of APPS) {
      expect.soft(sidebar, app.label).toContain(app.label);
      expect.soft(captions, app.label).toContain(app.label);
    }
  });

  /** A station name too long for the sidebar is elided there, not run into the pane. */
  it("elides a name the sidebar cannot fit rather than overrunning it", () => {
    const long = [{ label: "A station with a very long name indeed", accent: "#22d3ee" }];
    const { runs } = paint(
      (ctx) => drawMacbookDesktop(ctx, { ...view, apps: long }),
      MACBOOK_SCREEN,
    );

    expect(runs.some((run) => run.text.endsWith("…"))).toBe(true);
  });

  it("repaints when the minute does, and only then", () => {
    const first = desktop()
      .runs.map((run) => run.text)
      .join("|");
    const later = paint(
      (ctx) => drawMacbookDesktop(ctx, { ...view, clock: "09:42" }),
      MACBOOK_SCREEN,
    );

    expect(later.runs.map((run) => run.text).join("|")).not.toBe(first);
  });
});
