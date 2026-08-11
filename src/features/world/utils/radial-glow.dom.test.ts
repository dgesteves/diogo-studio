import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";
import type * as RadialGlow from "./radial-glow";

/**
 * The soft disc under every hotspot. It is one texture for the whole world by design —
 * 17 stations plus the AI core would otherwise each hold a 256² canvas that nothing
 * disposes — so the module caches, and every test here needs its own copy of the module.
 */

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

async function loadFresh(): Promise<typeof RadialGlow> {
  vi.resetModules();
  return import("./radial-glow");
}

beforeEach(() => {
  stub = undefined;
});

afterEach(() => {
  stub?.restore();
});

describe("createRadialGlowTexture", () => {
  it("fades from opaque at the center to nothing at the rim", async () => {
    stub = stubCanvasContexts();
    const { createRadialGlowTexture } = await loadFresh();

    const texture = createRadialGlowTexture();
    const recording = stub.contexts[0];
    const size = (texture.image as HTMLCanvasElement).width;

    expect(recording).toBeDefined();
    const [x0, y0, r0, x1, y1, r1] = recording!.callsTo("createRadialGradient")[0]!.map(Number);
    expect([x0, y0, x1, y1]).toEqual([size / 2, size / 2, size / 2, size / 2]);
    expect(r0).toBe(0);
    expect(r1).toBe(size / 2);

    const stops = recording!.callsTo("gradient#1.addColorStop").map(([at, color]) => [at, color]);
    expect(stops.map(([at]) => at)).toEqual([0, 0.45, 1]);
    expect(stops.at(0)?.[1]).toBe("rgba(255,255,255,1)");
    expect(stops.at(-1)?.[1]).toBe("rgba(255,255,255,0)");

    // The whole square is painted, so the quad has no visible edge where the disc ends.
    expect(recording!.callsTo("fillRect")[0]?.map(Number)).toEqual([0, 0, size, size]);
  });

  it("hands every hotspot the same texture instead of one canvas each", async () => {
    stub = stubCanvasContexts();
    const { createRadialGlowTexture } = await loadFresh();

    expect(createRadialGlowTexture()).toBe(createRadialGlowTexture());
    expect(stub.contexts).toHaveLength(1);
  });

  it("configures the texture as a sprite rather than a surface map", async () => {
    stub = stubCanvasContexts();
    const { createRadialGlowTexture } = await loadFresh();

    const texture = createRadialGlowTexture();

    expect(texture).toBeInstanceOf(CanvasTexture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.minFilter).toBe(LinearFilter);
    expect(texture.magFilter).toBe(LinearFilter);
    // A 256² glow with mipmaps costs a third more memory for a disc that is never minified.
    expect(texture.generateMipmaps).toBe(false);
  });

  it("still returns a texture when the browser refuses a 2D context", async () => {
    // jsdom's own answer, and a real browser's once too many contexts are live: an
    // unpainted glow is invisible, where a throw here takes the whole scene down.
    const { createRadialGlowTexture } = await loadFresh();

    expect(() => createRadialGlowTexture()).not.toThrow();
    expect(createRadialGlowTexture().image).toBeInstanceOf(HTMLCanvasElement);
  });
});
