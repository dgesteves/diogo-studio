import ReactThreeTestRenderer from "@react-three/test-renderer";
import { Color, type Light, type Mesh, type Object3D } from "three";
import { afterEach, describe, expect, it } from "vitest";
import { brandColors } from "@/config/brand";
import { worldPalettes } from "@/config/world-theme";
import { ROOM } from "@/constants/room";
import { setWorldMode, type WorldMode } from "@/stores/world-theme-store";
import { StudioScene } from "./studio-scene";

/**
 * An exact count, deliberately. Restructure phases 3-4 move 40 scene files and merge
 * clusters, and their failure mode is a mesh silently disappearing — a lower bound
 * would not catch that. Change it only when you mean to change the scene.
 */
const SCENE_MESH_COUNT = 228;

type PlaneParams = { width: number; height: number };

type SceneQuery = {
  meshes: Mesh[];
  lightsOfType: (type: string) => Light[];
  planeParams: () => PlaneParams[];
};

const renderers: { unmount: () => Promise<void> }[] = [];

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function isLight(object: Object3D): object is Light {
  return (object as Light).isLight === true;
}

function readPlaneParams(mesh: Mesh): PlaneParams | undefined {
  const params: unknown = (mesh.geometry as { parameters?: unknown }).parameters;
  if (typeof params !== "object" || params === null) return undefined;
  const { width, height } = params as Partial<PlaneParams>;
  return typeof width === "number" && typeof height === "number" ? { width, height } : undefined;
}

async function renderScene(mode: WorldMode = "night"): Promise<SceneQuery> {
  // Unmount first: a still-subscribed renderer would receive the store change as an
  // unwrapped act() update.
  await Promise.all(renderers.splice(0).map((previous) => previous.unmount()));
  setWorldMode(mode);

  const renderer = await ReactThreeTestRenderer.create(<StudioScene />);
  renderers.push(renderer);

  const objects: Object3D[] = [];
  renderer.scene.instance.traverse((object) => objects.push(object));
  const meshes = objects.filter(isMesh);

  return {
    meshes,
    lightsOfType: (type) => objects.filter(isLight).filter((light) => light.type === type),
    planeParams: () =>
      meshes.map(readPlaneParams).filter((params): params is PlaneParams => !!params),
  };
}

afterEach(async () => {
  await Promise.all(renderers.splice(0).map((renderer) => renderer.unmount()));
});

describe("StudioScene", () => {
  it("mounts the whole scene graph headlessly", async () => {
    const scene = await renderScene();

    expect(scene.meshes).toHaveLength(SCENE_MESH_COUNT);
    expect(scene.meshes.every((mesh) => mesh.geometry.type.length > 0)).toBe(true);
  });

  it("lights the room from the shared brand tokens", async () => {
    const scene = await renderScene();

    expect(scene.lightsOfType("AmbientLight")).toHaveLength(1);
    expect(scene.lightsOfType("HemisphereLight")).toHaveLength(1);
    expect(scene.lightsOfType("DirectionalLight")).toHaveLength(1);

    const pointColors = scene.lightsOfType("PointLight").map((light) => light.color.getHexString());
    expect(pointColors).toContain(new Color(brandColors.accent).getHexString());
    expect(pointColors).toContain(new Color(brandColors.accentSoft).getHexString());
  });

  it("swaps the light rig with the world palette instead of remounting the scene", async () => {
    const night = await renderScene();
    expect(night.lightsOfType("AmbientLight")[0]?.intensity).toBeCloseTo(
      worldPalettes.night.ambientIntensity,
    );

    const day = await renderScene("day");

    expect(day.lightsOfType("AmbientLight")[0]?.intensity).toBeCloseTo(
      worldPalettes.day.ambientIntensity,
    );
    expect(day.meshes).toHaveLength(SCENE_MESH_COUNT);
  });

  it("sizes the room shell from the shared ROOM constants", async () => {
    const scene = await renderScene();

    const walls = scene.planeParams().filter((params) => params.width === ROOM.wallSpan);

    expect(walls.length).toBeGreaterThan(0);
    expect(walls.some((params) => params.height === ROOM.wallHeight)).toBe(true);
  });
});
