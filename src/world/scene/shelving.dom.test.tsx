import type * as Drei from "@react-three/drei";
import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Color, SRGBColorSpace, Texture, type MeshStandardMaterial } from "three";
import { geometryParams, materialOf, renderScene, unmountScenes } from "@tests/r3f";
import { worldPalettes } from "../materials";
import { setWorldMode, type WorldMode } from "../store";

/**
 * The framed photograph on the lower floating shelf. It is the only image file the scene
 * loads, so it is also the only place two silent defects can happen: an uploaded color map
 * left at `NoColorSpace`, which renders a photograph washed out, and a picture plane whose
 * proportions come from the frame rather than from the file, which stretches a face. Neither
 * throws, and the shelf looks furnished either way.
 *
 * The loader is stubbed because jsdom never resolves an `Image`: unmocked, `useTexture`
 * suspends forever and the print silently never mounts — which is what the `<Suspense>`
 * boundary around it is for, and why asserting on it needs the stub.
 */

const photograph = new Texture();

vi.mock("@react-three/drei", async (importOriginal) => ({
  ...(await importOriginal<typeof Drei>()),
  useTexture: () => photograph,
}));

const { PRINT_ASPECT, WallShelves } = await import("./shelving");

afterEach(unmountScenes);

async function shelves(mode: WorldMode = "night") {
  // Set before mounting: changing it under a live scene notifies subscribers unwrapped.
  await act(async () => setWorldMode(mode));
  const scene = await renderScene(<WallShelves />);
  return materialOf<MeshStandardMaterial>(scene.meshesWith("PlaneGeometry")[0]);
}

describe("the framed print", () => {
  it("hangs the photograph as an sRGB color map", async () => {
    const material = await shelves();

    expect(material.map).toBe(photograph);
    // three leaves a `TextureLoader` texture at `NoColorSpace`, which is not what a JPEG is.
    expect(material.map?.colorSpace).toBe(SRGBColorSpace);
    // A print is matte: a self-lit one would read as a fourth screen on that wall.
    expect(material.emissiveMap).toBeNull();
    expect(material.toneMapped).toBe(true);
  });

  it("shapes the picture to the file's proportions, not the frame's", async () => {
    const scene = await renderScene(<WallShelves />);

    const picture = geometryParams(scene.meshesWith("PlaneGeometry")[0]);

    expect(picture.width! / picture.height!).toBeCloseTo(PRINT_ASPECT);
  });

  /**
   * A photograph is the one texture in the room that arrives already lit — daylight, in a
   * room the palette otherwise keeps unlit. Left untinted it reads as a lightbox at night,
   * so the multiply is the palette's rather than the material's.
   */
  it("dims the photograph at night and lets it back up in daylight", async () => {
    const night = await shelves("night");
    expect(night.color.getHex()).toBe(new Color(worldPalettes.night.printTint).getHex());

    await unmountScenes();
    const day = await shelves("day");
    expect(day.color.getHex()).toBe(new Color(worldPalettes.day.printTint).getHex());

    const brightness = (color: Color) => color.r + color.g + color.b;
    expect(brightness(night.color)).toBeLessThan(brightness(day.color));
  });
});
