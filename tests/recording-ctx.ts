/**
 * A stand-in for `CanvasRenderingContext2D` that records what a draw routine paints.
 *
 * jsdom returns `null` from `getContext("2d")` and the native `canvas` package was
 * rejected, so pixels are not available to assert — but they are also not what these
 * routines are interesting for. What matters is the transcript: the words drawn on a
 * screen, where a line ends up, which branch a tick selected. This Proxy records every
 * call and property assignment in order, so a spec can assert those directly and
 * snapshot the rest.
 *
 * Text metrics are computed, not measured: every font in `src/` is the same monospace
 * stack, so an advance of 0.6em per character is close enough to make width-dependent
 * layout (chip widths, truncation, caret position) behave the way it does in a browser.
 */

/** Canvas 2D state properties. Anything else read off the context is treated as a method. */
const PROPERTIES = new Set([
  "direction",
  "fillStyle",
  "filter",
  "font",
  "fontKerning",
  "fontStretch",
  "fontVariantCaps",
  "globalAlpha",
  "globalCompositeOperation",
  "imageSmoothingEnabled",
  "imageSmoothingQuality",
  "letterSpacing",
  "lineCap",
  "lineDashOffset",
  "lineJoin",
  "lineWidth",
  "miterLimit",
  "shadowBlur",
  "shadowColor",
  "shadowOffsetX",
  "shadowOffsetY",
  "strokeStyle",
  "textAlign",
  "textBaseline",
  "textRendering",
  "wordSpacing",
]);

const TEXT_METHODS = new Set(["fillText", "strokeText"]);
// Everything that contributes a point to the current path, and the two that paint it.
const POINT_METHODS = new Set(["arc", "arcTo", "ellipse", "lineTo", "moveTo", "rect", "roundRect"]);
const PAINT_METHODS = new Set(["fill", "stroke"]);
const GRADIENT_METHODS = new Set([
  "createConicGradient",
  "createLinearGradient",
  "createRadialGradient",
]);

const MONOSPACE_ADVANCE = 0.6;
const FALLBACK_FONT_PX = 10;
const PRECISION = 1000;

const GRADIENT_LABEL = Symbol("gradient label");

type Pixel = readonly [r: number, g: number, b: number, a: number];

export type RecordingContextOptions = {
  width?: number;
  height?: number;
  /** The element the routine should see as `ctx.canvas`; a `{ width, height }` stub by default. */
  canvas?: HTMLCanvasElement;
  /** What `getImageData` reports for a pixel. Defaults to a deterministic ramp. */
  pixel?: (x: number, y: number) => Pixel;
};

/** A painted string with the state that decides where it lands and how it reads. */
export type TextRun = {
  text: string;
  x: number;
  y: number;
  font: string;
  align: string;
  baseline: string;
  style: string;
  /** The width the same metrics give `measureText`. */
  width: number;
};

/** One `stroke()` or `fill()`, with the state that decided how it looked. */
type Paint = {
  kind: string;
  style: string;
  lineWidth: number;
};

/**
 * The points collected since a `beginPath()`, and every paint applied to them. A shape is
 * the unit these routines actually draw in, and grouping by `beginPath` is what separates a
 * grid from the line drawn over it without a spec having to guess at coordinates.
 */
export type Path = {
  points: readonly (readonly [number, number])[];
  paints: readonly Paint[];
};

export type RecordingContext = {
  /** The recording stand-in, typed as the real thing for the routine under test. */
  readonly ctx: CanvasRenderingContext2D;
  /** Every call and property assignment, in order, one readable line each. */
  readonly transcript: readonly string[];
  /** The arguments of every call to one method, in order. */
  callsTo: (method: string) => readonly (readonly unknown[])[];
  /** Every value assigned to one property, in order. */
  valuesOf: (property: string) => readonly unknown[];
  /** Every string painted with `fillText`/`strokeText`, in draw order. */
  readonly text: readonly string[];
  /** The same strings with the position, font and alignment they were painted with. */
  readonly runs: readonly TextRun[];
  /** Each `beginPath()` group, with its points and the strokes or fills applied to it. */
  readonly paths: readonly Path[];
};

type Entry = { kind: "call" | "set"; name: string; args: readonly unknown[] };

function round(value: number): number {
  const rounded = Math.round(value * PRECISION) / PRECISION;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function format(value: unknown): string {
  if (typeof value === "number") return String(round(value));
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "object" && value !== null && GRADIENT_LABEL in value) {
    return String(Reflect.get(value, GRADIENT_LABEL));
  }
  return String(value);
}

/** A color as the routine wrote it; a gradient as its handle. */
function styleOf(value: unknown): string {
  return typeof value === "string" ? value : format(value);
}

function line(entry: Entry): string {
  if (entry.kind === "set") return `${entry.name} = ${format(entry.args[0])}`;
  return `${entry.name}(${entry.args.map(format).join(", ")})`;
}

function fontPx(font: unknown): number {
  const match = /(\d+(?:\.\d+)?)px/.exec(typeof font === "string" ? font : "");
  return match?.[1] === undefined ? FALLBACK_FONT_PX : Number(match[1]);
}

function defaultPixel(x: number, y: number): Pixel {
  return [(x * 17) % 256, (y * 23) % 256, (x * y * 7) % 256, 255];
}

type LabeledGradient = CanvasGradient & { [GRADIENT_LABEL]: string };

function makeGradient(label: string, record: (entry: Entry) => void): LabeledGradient {
  return {
    [GRADIENT_LABEL]: label,
    addColorStop(offset: number, color: string): void {
      record({ kind: "call", name: `${label}.addColorStop`, args: [offset, color] });
    },
  };
}

export function createRecordingContext(options: RecordingContextOptions = {}): RecordingContext {
  const width = options.canvas?.width ?? options.width ?? 640;
  const height = options.canvas?.height ?? options.height ?? 400;
  const canvas = options.canvas ?? { width, height };
  const pixel = options.pixel ?? defaultPixel;

  const entries: Entry[] = [];
  const runs: TextRun[] = [];
  const paths: { points: [number, number][]; paints: Paint[] }[] = [];
  const state = new Map<string, unknown>();
  let gradients = 0;

  const record = (entry: Entry): void => void entries.push(entry);

  function imageData(sw: number, sh: number): ImageData {
    const data = new Uint8ClampedArray(sw * sh * 4);
    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        data.set(pixel(x, y), (y * sw + x) * 4);
      }
    }
    return { data, width: sw, height: sh, colorSpace: "srgb" };
  }

  function advance(text: string): number {
    return text.length * fontPx(state.get("font")) * MONOSPACE_ADVANCE;
  }

  function recordRun(args: readonly unknown[]): void {
    const text = String(args[0] ?? "");
    runs.push({
      text,
      x: Number(args[1]),
      y: Number(args[2]),
      font: String(state.get("font") ?? ""),
      align: String(state.get("textAlign") ?? "start"),
      baseline: String(state.get("textBaseline") ?? "alphabetic"),
      style: styleOf(state.get("fillStyle")),
      width: advance(text),
    });
  }

  function recordPath(name: string, args: readonly unknown[]): void {
    if (name === "beginPath") paths.push({ points: [], paints: [] });
    const path = paths.at(-1);
    if (!path) return;
    if (POINT_METHODS.has(name)) path.points.push([Number(args[0]), Number(args[1])]);
    if (PAINT_METHODS.has(name)) {
      path.paints.push({
        kind: name,
        style: styleOf(state.get(name === "fill" ? "fillStyle" : "strokeStyle")),
        lineWidth: Number(state.get("lineWidth") ?? 1),
      });
    }
  }

  function call(name: string, args: readonly unknown[]): unknown {
    record({ kind: "call", name, args });
    recordPath(name, args);
    if (TEXT_METHODS.has(name)) recordRun(args);
    if (GRADIENT_METHODS.has(name)) {
      gradients += 1;
      return makeGradient(`gradient#${gradients}`, record);
    }
    if (name === "measureText") return { width: advance(String(args[0] ?? "")) };
    if (name === "getImageData") return imageData(Number(args[2]), Number(args[3]));
    return undefined;
  }

  // The one unavoidable cast: a Proxy cannot be typed as the interface it stands in for
  // without describing all ~70 members. It is contained here so no spec needs one.
  const ctx = new Proxy({} as CanvasRenderingContext2D, {
    get(_target, property) {
      if (typeof property === "symbol") return undefined;
      if (property === "canvas") return canvas;
      if (PROPERTIES.has(property)) return state.get(property);
      return (...args: unknown[]): unknown => call(property, args);
    },
    set(_target, property, value) {
      if (typeof property === "string") {
        state.set(property, value);
        record({ kind: "set", name: property, args: [value] });
      }
      return true;
    },
  });

  return {
    ctx,
    get transcript() {
      return entries.map(line);
    },
    callsTo: (method) => entries.filter((e) => e.name === method).map((e) => e.args),
    valuesOf: (property) =>
      entries.filter((e) => e.kind === "set" && e.name === property).map((e) => e.args[0]),
    get text() {
      return runs.map((run) => run.text);
    },
    get runs() {
      return [...runs];
    },
    get paths() {
      return paths.map((path) => ({ points: [...path.points], paints: [...path.paints] }));
    },
  };
}

/**
 * Hands every `getContext("2d")` in jsdom a recording context, for the routines that create
 * their own canvas. `vitest.setup.ts` answers `null` by default — the production-shaped
 * answer, and the one the no-context paths depend on — so this is opt-in per spec and has to
 * be undone in `afterEach`.
 */
export function stubCanvasContexts(options: RecordingContextOptions = {}): {
  readonly contexts: readonly RecordingContext[];
  restore: () => void;
} {
  const original = HTMLCanvasElement.prototype.getContext;
  const contexts: RecordingContext[] = [];

  function getContext(this: HTMLCanvasElement, contextId: string): CanvasRenderingContext2D | null {
    if (contextId !== "2d") return null;
    const recording = createRecordingContext({ ...options, canvas: this });
    contexts.push(recording);
    return recording.ctx;
  }

  // `getContext` is overloaded per context id, and a single-signature replacement is not
  // assignable to that type. Defining the property sidesteps it without an assertion.
  const install = (value: unknown): void => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value,
      configurable: true,
      writable: true,
    });
  };

  install(getContext);

  return { contexts, restore: () => install(original) };
}
