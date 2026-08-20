import { afterEach, describe, expect, it } from "vitest";
import { Box3, Quaternion, Vector3 } from "three";

import { renderScene, unmountScenes } from "@tests/r3f";
import {
  CONTROL_DECK,
  ControlDeck,
  createDeckGeometry,
  deckProfile,
  DECK_HEIGHT,
  FACE_LENGTH,
  onFace,
  SCREEN_HEIGHT,
  SCREEN_S,
  SCREEN_WIDTH,
  SKIRT_PORT_Y,
  SKIRT_PORTS,
} from "./control-deck";

/**
 * The console, which is one measurement — the slope — and everything that has to agree with
 * it. None of what goes wrong here throws. An `ExtrudeGeometry` fed the finished outline
 * comes out a bevel oversized and still renders; a panel laid on the face with the wrong turn
 * renders as a screen facing the ceiling, or upside down; a key row wider than the console
 * hangs off the side of it. All of that is a picture nobody looks at in a headless suite, so
 * it is measured off the mounted object instead.
 *
 * jsdom rather than node, because half of these assertions are about where the parts of a
 * mounted console end up rather than about the arithmetic that placed them.
 */

const RISE = CONTROL_DECK.depth * Math.tan(CONTROL_DECK.slope);
/** The face, as a height over the desk at a given depth. Everything on the deck is under it. */
const faceHeightAt = (z: number): number =>
  CONTROL_DECK.padHeight +
  CONTROL_DECK.frontHeight +
  (CONTROL_DECK.depth / 2 - z) * Math.tan(CONTROL_DECK.slope);

/** What a knob, a keycap or a port is allowed to stand out of the surface it is set into. */
const PROUD = 0.014;

afterEach(unmountScenes);

describe("the control deck's shell", () => {
  const bounds = ((): Box3 => {
    const geometry = createDeckGeometry();
    geometry.computeBoundingBox();
    return geometry.boundingBox ?? new Box3();
  })();

  /**
   * Measured in the geometry's own frame, which is the profile's: `x` is the console's depth,
   * `y` its height, and the extrusion runs up `z` across the desk.
   */
  it("comes out the size of the console rather than the size of its profile", () => {
    const size = bounds.getSize(new Vector3());

    expect(size.x).toBeCloseTo(CONTROL_DECK.depth, 6);
    expect(size.z).toBeCloseTo(CONTROL_DECK.width, 6);
  });

  /**
   * Height is the one measurement the bevel cannot restore exactly. `ExtrudeGeometry` offsets
   * a corner along its bisector, and where the corner is sharper than a right angle — here the
   * top of the back wall, at 62° — it falls back to an approximation that lands short. So the
   * console is as tall as it says to within a bevel, and never taller: a profile fed the
   * finished outline instead would overshoot in all three directions at once.
   */
  it("stands within a bevel of the height its slope gives it, and never over", () => {
    const nominal = CONTROL_DECK.frontHeight + RISE;
    const height = bounds.getSize(new Vector3()).y;

    expect(height).toBeLessThanOrEqual(nominal);
    expect(height).toBeGreaterThan(nominal - CONTROL_DECK.bevel);
    expect(DECK_HEIGHT).toBeCloseTo(CONTROL_DECK.padHeight + nominal, 6);
  });

  it("stands on its pads instead of sinking a bevel into them", () => {
    expect(bounds.min.y).toBeCloseTo(0, 6);
    expect(bounds.min.x).toBeCloseTo(-CONTROL_DECK.depth / 2, 6);
  });

  /**
   * The one place the inset is not the number it is given: a sloped edge pulled in by `inset`
   * moves down the page by `inset / cos(slope)`. Subtracting the inset itself leaves the face
   * a degree shallower than every other measurement here assumes.
   */
  it("insets the sloped face along its own normal rather than straight down", () => {
    const inset = 0.004;
    const [outerFront, outerBack] = topEdge(0);
    const [innerFront] = topEdge(inset);

    // Distance from the inset face's front corner to the line the outer face runs along.
    const edge = outerBack.clone().sub(outerFront).normalize();
    const offset = innerFront.clone().sub(outerFront);
    const along = edge.clone().multiplyScalar(offset.dot(edge));

    expect(offset.sub(along).length()).toBeCloseTo(inset, 6);
  });
});

/** The profile's two top corners, front first, as points in (depth, height). */
function topEdge(inset: number): [Vector3, Vector3] {
  const [front, back] = deckProfile(inset)
    .getPoints(1)
    .filter((point) => point.y > CONTROL_DECK.frontHeight / 2)
    .sort((a, b) => b.x - a.x)
    .map((point) => new Vector3(point.x, point.y, 0));

  if (!front || !back) throw new Error("The console profile has no sloped top edge");
  return [front, back];
}

describe("the console face", () => {
  it("keeps the panel on the face, clear of the key row and of the back edge", () => {
    expect(SCREEN_S - SCREEN_HEIGHT / 2).toBeGreaterThan(0);
    expect(SCREEN_S + SCREEN_HEIGHT / 2).toBeLessThan(FACE_LENGTH);
    expect(SCREEN_WIDTH).toBeLessThan(CONTROL_DECK.width);
  });

  /** A point on the face is on the face: it satisfies the plane the top of the wedge runs in. */
  it("places a face point on the face, and a lift along its normal", () => {
    const [, y, z] = onFace(0, SCREEN_S);
    expect(y).toBeCloseTo(faceHeightAt(z), 6);

    const lift = 0.01;
    const [, liftedY, liftedZ] = onFace(0, SCREEN_S, lift);
    expect(liftedY - y).toBeCloseTo(lift * Math.cos(CONTROL_DECK.slope), 6);
    expect(liftedZ - z).toBeCloseTo(lift * Math.sin(CONTROL_DECK.slope), 6);
  });
});

/**
 * The hub half of the device. The skirt is three centimeters of wall and the face starts
 * immediately above it, so a port set a millimeter too high is cut through the console rather
 * than into its front.
 */
describe("the port bank", () => {
  it("sets every port inside the skirt, clear of the desk and of the face", () => {
    const floor = CONTROL_DECK.padHeight;
    const ceiling = CONTROL_DECK.padHeight + CONTROL_DECK.frontHeight;

    for (const port of SKIRT_PORTS) {
      expect.soft(SKIRT_PORT_Y - port.height / 2).toBeGreaterThan(floor);
      expect.soft(SKIRT_PORT_Y + port.height / 2).toBeLessThan(ceiling);
      expect.soft(Math.abs(port.x) + port.width / 2).toBeLessThan(CONTROL_DECK.width / 2);
    }
  });
});

describe("the mounted deck", () => {
  it("lays every part of the console on it rather than off its edges", async () => {
    const scene = await renderScene(<ControlDeck />);
    const at = new Vector3();

    for (const mesh of scene.meshes) {
      mesh.getWorldPosition(at);
      expect.soft(Math.abs(at.x)).toBeLessThanOrEqual(CONTROL_DECK.width / 2 + PROUD);
      expect.soft(Math.abs(at.z)).toBeLessThanOrEqual(CONTROL_DECK.depth / 2 + PROUD);
      expect.soft(at.y).toBeGreaterThanOrEqual(0);
      expect.soft(at.y).toBeLessThanOrEqual(faceHeightAt(at.z) + PROUD);
    }
  });

  /**
   * The reason this object exists. The room's camera looks down on the desk, so a display
   * lying flat is a smear — the panel has to be turned up the slope and toward the chair, and
   * turned the right way up while it is there. Both are one rotation, and a wrong one still
   * renders a screen.
   */
  it("turns the panel up the slope, facing the chair, with its image the right way up", async () => {
    const scene = await renderScene(<ControlDeck />);
    const [panel] = scene.meshesWith("PlaneGeometry");
    const { slope } = CONTROL_DECK;
    const turn = panel?.getWorldQuaternion(new Quaternion()) ?? new Quaternion();

    const normal = new Vector3(0, 0, 1).applyQuaternion(turn);
    const up = new Vector3(0, 1, 0).applyQuaternion(turn);

    expect(panel).toBeDefined();

    expect(normal.y).toBeCloseTo(Math.cos(slope), 6);
    expect(normal.z).toBeCloseTo(Math.sin(slope), 6);
    expect(up.y).toBeCloseTo(Math.sin(slope), 6);
    expect(up.z).toBeCloseTo(-Math.cos(slope), 6);
  });
});
