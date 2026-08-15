import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { click, press } from "@tests/interactions";
import { ReducedMotionProvider } from "@/reduced-motion";
import { persistOverride } from "@/reduced-motion";
import { setHoveredStation } from "@/world/store";
import { createAudioEngine } from "./audio";
import { AudioProvider, useAudio } from "./audio";
import { WorldAudio } from "./audio";
import { AMBIENT_SRC, AMBIENT_VOLUME, AUDIO_STORAGE_KEY, FADE_SECONDS, SFX_VOLUME } from "./audio";

/**
 * Sound is off by default, opt-in from the boot gate, and silent under reduced motion — so the
 * branches worth asserting are the ones where it must *not* play, and they are all real: a
 * browser that blocks autoplay, a visitor who asked for less motion, storage the browser
 * refuses.
 *
 * This file exists because the claim that put it off — "Web Audio, no jsdom equivalent" — was
 * wrong. There is no `AudioContext` anywhere in `src/`: the engine is four `HTMLAudioElement`s
 * and a volume ramp on an interval, which jsdom has. Only `play()` and `pause()` are missing,
 * and they are stubbed below, which also keeps the run free of jsdom's "Not implemented" noise.
 */

const FADE_STEPS = Math.round(FADE_SECONDS * 60);
const FRAME_MS = 1000 / 60;

const route = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

let play: Mock<() => Promise<void>>;
let pause: Mock<() => void>;

/**
 * jsdom's `currentTime` is a constant 0, so asserting it reads 0 after a rewind is an
 * assertion that cannot fail. The setter is recorded instead.
 */
const rewinds: number[] = [];
const realCurrentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime");

/** The clip behind every `play()` call since the last reset, named, in order. */
function cuesPlayed(): string[] {
  return (play.mock.instances as HTMLAudioElement[]).map(
    (element) => element.src.split("/").pop() ?? "",
  );
}

/** Every element the engine builds, in construction order: ambient first, then the four cues. */
function elements(): HTMLAudioElement[] {
  return play.mock.instances as HTMLAudioElement[];
}

function ambientElement(): HTMLAudioElement {
  const found = elements().find((element) => element.src.endsWith(AMBIENT_SRC));
  if (!found) throw new Error("The engine never built the ambient loop");
  return found;
}

/** Runs the volume ramp to completion, one interval tick at a time. */
function finishFade(): void {
  act(() => void vi.advanceTimersByTime(FADE_STEPS * FRAME_MS));
}

beforeEach(() => {
  route.pathname = "/";
  vi.useFakeTimers();
  // jsdom implements neither, and calling them logs "Not implemented" to the virtual console.
  play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  pause = vi.fn<() => void>();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);

  rewinds.length = 0;
  Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
    configurable: true,
    get: () => 0,
    set: (value: number) => void rewinds.push(value),
  });
});

afterEach(() => {
  vi.useRealTimers();
  if (realCurrentTime) {
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", realCurrentTime);
  }
});

describe("createAudioEngine", () => {
  it("starts the ambient loop silent and fades it up, so entry is never abrupt", async () => {
    const engine = createAudioEngine();

    await engine.start();
    const ambient = ambientElement();

    expect(ambient.loop).toBe(true);
    expect(ambient.volume).toBe(0);

    finishFade();

    expect(ambient.volume).toBeCloseTo(AMBIENT_VOLUME);
  });

  it("ramps rather than jumps", async () => {
    const engine = createAudioEngine();
    await engine.start();

    act(() => void vi.advanceTimersByTime(FADE_STEPS * FRAME_MS * 0.5));

    const half = ambientElement().volume;
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(AMBIENT_VOLUME);
  });

  /**
   * Every browser blocks audio that no gesture asked for, and `play()` rejects when it does.
   * Fading up anyway would leave the volume set on an element that is not playing, so the next
   * legitimate start would fade from full to full — silently, forever.
   */
  it("gives up quietly when the browser refuses to autoplay", async () => {
    play.mockRejectedValue(new DOMException("NotAllowedError"));
    const engine = createAudioEngine();

    await engine.start();
    finishFade();

    expect(ambientElement().volume).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("fades out before pausing, so stopping is not a cut", async () => {
    const engine = createAudioEngine();
    await engine.start();
    finishFade();

    engine.stop();
    expect(pause).not.toHaveBeenCalled();

    finishFade();

    expect(ambientElement().volume).toBe(0);
    expect(pause).toHaveBeenCalledOnce();
  });

  it("does nothing when stopped or played before it ever started", () => {
    const engine = createAudioEngine();

    engine.stop();
    engine.play("hover");

    // No element built at all: the graph is created on `start`, so a muted visitor never
    // downloads five audio files.
    expect(play).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps one set of elements however often it is started", async () => {
    const engine = createAudioEngine();

    await engine.start();
    const built = new Set(elements());
    await engine.start();

    expect(new Set(elements())).toEqual(built);
  });

  /** Two overlapping fades would fight over the same volume and neither would land. */
  it("cancels a fade in flight rather than running two", async () => {
    const engine = createAudioEngine();
    await engine.start();

    act(() => void vi.advanceTimersByTime(FADE_STEPS * FRAME_MS * 0.25));
    engine.stop();

    expect(vi.getTimerCount()).toBe(1);

    finishFade();

    expect(ambientElement().volume).toBe(0);
  });

  it("restarts a cue from the beginning at the shared effects volume", async () => {
    const engine = createAudioEngine();
    await engine.start();
    play.mockClear();

    engine.play("select");

    const cue = play.mock.instances.at(-1) as HTMLAudioElement;
    expect(cue.volume).toBeCloseTo(SFX_VOLUME);
    // Without the rewind, a cue triggered twice in quick succession is silent the second time.
    expect(rewinds).toEqual([0]);
  });
});

describe("AudioProvider", () => {
  function Probe(): React.ReactElement {
    const audio = useAudio();
    return (
      <>
        <p>{audio.enabled ? "on" : "off"}</p>
        <button type="button" onClick={() => audio.toggle()}>
          toggle
        </button>
        <button type="button" onClick={() => audio.play("hover")}>
          cue
        </button>
      </>
    );
  }

  function mount() {
    return render(
      <ReducedMotionProvider>
        <AudioProvider>
          <Probe />
        </AudioProvider>
      </ReducedMotionProvider>,
    );
  }

  function state(): string {
    return screen.getByText(/^(on|off)$/).textContent ?? "";
  }

  it("starts muted, and stays silent until it is turned on", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    expect(state()).toBe("off");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "cue" }));
    });

    expect(play).not.toHaveBeenCalled();
  });

  it("confirms out loud when a visitor turns it on, and remembers the choice", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "toggle" }));
    });

    expect(state()).toBe("on");
    expect(window.localStorage.getItem(AUDIO_STORAGE_KEY)).toBe("1");
    // The cue is the point: it proves to the visitor that sound works.
    expect(play.mock.instances.at(-1)).toBeInstanceOf(HTMLAudioElement);
  });

  it("stops playing cues once a visitor turns sound back off", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await click(user, "toggle");
    await click(user, "toggle");
    play.mockClear();

    await click(user, "cue");

    // Before the first enable there is no engine to call, so this gate is only visible on the
    // way back down — which is the path a visitor who dislikes the sound actually takes.
    expect(play).not.toHaveBeenCalled();
  });

  it("stops and forgets when it is turned back off", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "toggle" }));
    });
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "toggle" }));
    });

    expect(state()).toBe("off");
    expect(window.localStorage.getItem(AUDIO_STORAGE_KEY)).toBe("0");
    finishFade();
    expect(pause).toHaveBeenCalled();
  });

  /**
   * A returning visitor who left sound on must not hear it on load — that is the autoplay
   * policy, and `enable()` would reject anyway. It resumes on the first gesture instead.
   */
  it("waits for a gesture before resuming a visitor who had it on", async () => {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, "1");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    expect(state()).toBe("off");
    expect(play).not.toHaveBeenCalled();

    await press(user, "{Enter}");

    expect(state()).toBe("on");
  });

  it("resumes on a pointer gesture too, and only once", async () => {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, "1");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await act(async () => {
      await user.click(document.body);
      await user.click(document.body);
    });

    expect(state()).toBe("on");
    // One `confirm` cue, not one per click.
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("drops the other gesture listener once one of them has resumed", async () => {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, "1");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await press(user, "{Enter}");
    play.mockClear();

    await act(async () => {
      await user.click(document.body);
    });

    // `{ once: true }` only removes the listener that fired, so without the explicit removals
    // the pointer listener survives a keyboard resume and re-enables on the next click —
    // replaying the confirmation cue at a moment nothing asked for it.
    expect(play).not.toHaveBeenCalled();
  });

  it("never resumes for a visitor who asked for reduced motion", async () => {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, "1");
    persistOverride(true);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await press(user, "{Enter}");

    expect(state()).toBe("off");
    expect(play).not.toHaveBeenCalled();
  });

  it("survives storage the browser refuses", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "toggle" }));
    });

    // The preference is lost, which is acceptable; the session is not.
    expect(state()).toBe("on");
  });

  it("refuses to be used outside its provider", () => {
    expect(() => renderHook(() => useAudio())).toThrow(/within <AudioProvider>/);
  });
});

describe("WorldAudio", () => {
  function mount() {
    return render(
      <AudioProvider>
        <WorldAudio />
        <Enabler />
      </AudioProvider>,
    );
  }

  /** Sound only plays once a visitor has asked for it, which the boot gate normally does. */
  function Enabler(): React.ReactElement {
    const { enable, toggle } = useAudio();
    return (
      <>
        <button type="button" onClick={() => void enable()}>
          enable
        </button>
        <button type="button" onClick={() => toggle()}>
          toggle
        </button>
      </>
    );
  }

  async function enable(): Promise<void> {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await click(user, "enable");
    play.mockClear();
  }

  it("stays silent while sound is off, however much the world moves", async () => {
    mount();

    act(() => setHoveredStation("work"));

    expect(play).not.toHaveBeenCalled();
  });

  /**
   * Keyed on a *change* of station, not on a store notification: the world store is written on
   * every pointer move, so a cue per notification would be a rattle.
   */
  it("plays one cue per station the pointer reaches", async () => {
    mount();
    await enable();

    act(() => setHoveredStation("work"));
    expect(cuesPlayed()).toEqual(["hover.mp3"]);

    act(() => setHoveredStation("resume"));
    expect(cuesPlayed()).toEqual(["hover.mp3", "hover.mp3"]);
  });

  it("says nothing when the pointer leaves the world entirely", async () => {
    mount();
    await enable();
    act(() => setHoveredStation("work"));
    play.mockClear();

    act(() => setHoveredStation(null));

    expect(cuesPlayed()).toEqual([]);
  });

  /**
   * Both effects re-run whenever `play` changes identity, which is not only when the station or
   * the route changes — turning sound off and on again does it, because `play` closes over
   * `enabled`. Without the "did it change" guards, that alone replays a cue for the station the
   * visitor is already on and a transition cue for a route they never left.
   *
   * This is the seam because of the React Compiler: the context value is memoized
   * automatically, so an ordinary re-render leaves `play` stable and neither effect re-runs.
   * The sound setting is the one thing that moves it.
   */
  it("stays quiet when only the sound setting changed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mount();
    await enable();
    act(() => setHoveredStation("work"));
    play.mockClear();

    await click(user, "toggle");
    await click(user, "toggle");

    // Exactly the two sounds re-enabling makes — the ambient loop and its confirmation — and
    // nothing from the world, which has not moved.
    expect(cuesPlayed()).toEqual(["ambient.mp3", "confirm.mp3"]);
  });

  it("plays a transition cue when the route changes", async () => {
    mount();
    await enable();
    act(() => setHoveredStation("work"));
    play.mockClear();

    route.pathname = "/work";
    act(() => setHoveredStation("resume"));

    expect(cuesPlayed()).toEqual(["hover.mp3", "whoosh.mp3"]);
  });
});
