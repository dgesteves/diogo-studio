import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";

import { createRecordingContext } from "@tests/recording-ctx";
import {
  BODY_HEIGHT,
  BODY_LIFT,
  createBodyGeometry,
  createLidGeometry,
  FRONT_PORTS,
  FRONT_Z,
  LED_X,
  MAC_STUDIO,
  macProfile,
  paintMark,
  PORT_RELIEF,
  PORT_Y,
} from "./mac-studio";

/**
 * The machine's own measurements, which are the whole of what makes it read as that machine
 * and none of which fails loudly. `ExtrudeGeometry` grows its section outward by the bevel,
 * so a body fed the finished outline comes out a centimeter oversized with its front wall
 * standing in front of its own ports — which renders as a plain aluminum box, throws nothing,
 * and is invisible in every other assertion in the suite.
 */

function boundsOf(geometry: { computeBoundingBox: () => void; boundingBox: Box3 | null }): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

/**
 * Measured in the geometry's own frame, which is the shape's: `x` is the machine's width, `y`
 * its depth, and the extrusion runs up `z`. The mesh turns it a quarter turn so that `z`
 * becomes height — asserting the turned mesh would be asserting R3F rather than the model.
 */
describe("the Mac Studio's shell", () => {
  const body = boundsOf(createBodyGeometry());

  it("comes out the size of the machine rather than the size of its profile", () => {
    const size = body.getSize(new Vector3());

    expect(size.x).toBeCloseTo(MAC_STUDIO.width, 6);
    expect(size.y).toBeCloseTo(MAC_STUDIO.depth, 6);
    expect(size.z).toBeCloseTo(BODY_HEIGHT, 6);
  });

  /** The extrusion runs from `-bevelThickness`, so the lift is what stands it on its base. */
  it("stands on the base instead of sinking a fillet into it", () => {
    expect(body.min.z + BODY_LIFT).toBeCloseTo(0, 6);
    expect(body.max.z + BODY_LIFT).toBeCloseTo(BODY_HEIGHT, 6);
  });

  it("draws a profile that is square and centered on the machine", () => {
    const points = macProfile().getPoints(64);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.max(...xs)).toBeCloseTo(MAC_STUDIO.width / 2, 6);
    expect(Math.min(...xs)).toBeCloseTo(-MAC_STUDIO.width / 2, 6);
    expect(Math.max(...ys)).toBeCloseTo(MAC_STUDIO.depth / 2, 6);
    expect(Math.min(...ys)).toBeCloseTo(-MAC_STUDIO.depth / 2, 6);
  });

  it("covers the flat top the bevel leaves, and no more", () => {
    const lid = boundsOf(createLidGeometry());
    const top = MAC_STUDIO.width / 2 - MAC_STUDIO.edgeFillet;

    expect(lid.max.x).toBeLessThan(top);
    // A lid much smaller than the top it covers reads as a panel lying on the machine.
    expect(lid.max.x).toBeGreaterThan(top - 0.003);
  });
});

describe("the Mac Studio's front", () => {
  const wallZ = MAC_STUDIO.depth / 2;
  const flatBand = {
    low: MAC_STUDIO.baseHeight + MAC_STUDIO.edgeFillet,
    high: MAC_STUDIO.baseHeight + BODY_HEIGHT - MAC_STUDIO.edgeFillet,
  };

  it("sets the ports into the wall they are meant to be in", () => {
    expect(FRONT_Z).toBeCloseTo(wallZ, 6);
    expect(FRONT_Z + PORT_RELIEF).toBeGreaterThan(wallZ);
  });

  it("keeps every port on the flat of the face, clear of both fillets", () => {
    for (const port of FRONT_PORTS) {
      expect.soft(PORT_Y - port.height / 2).toBeGreaterThan(flatBand.low);
      expect.soft(PORT_Y + port.height / 2).toBeLessThan(flatBand.high);
    }
  });

  /** Past the corner the wall has turned away, and anything set there reads as a scratch. */
  it("keeps every port and the LED clear of the corner radius", () => {
    const straight = MAC_STUDIO.width / 2 - MAC_STUDIO.cornerRadius;

    for (const port of FRONT_PORTS) {
      expect.soft(Math.abs(port.x) + port.width / 2).toBeLessThan(straight);
    }
    expect(Math.abs(LED_X)).toBeLessThan(straight);
  });

  /** One row, weighted left: the LED is the right-hand end of it, not a second line. */
  it("puts the LED on the ports' own line, out past all of them", () => {
    expect(LED_X).toBeGreaterThan(Math.max(...FRONT_PORTS.map((port) => port.x + port.width / 2)));
  });

  it("groups the ports in the left third, in the order the machine has them", () => {
    const xs = FRONT_PORTS.map((port) => port.x);

    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(Math.max(...xs)).toBeLessThan(0);
  });
});

describe("the mark on the lid", () => {
  const painted = (): ReturnType<typeof createRecordingContext> => {
    const recording = createRecordingContext({ width: 128, height: 128 });
    paintMark(recording.ctx);
    return recording;
  };

  /**
   * The bite is a piece missing from the outline rather than a hole in a face, so it only
   * exists if the routine cuts. Painted with the composite left alone, the mark is a blob.
   */
  it("cuts the valley and the bite back out of the lobes, then restores the composite", () => {
    const modes = painted().valuesOf("globalCompositeOperation");

    expect(modes).toEqual(["destination-out", "source-over"]);
  });

  it("keeps the whole mark inside the square it is painted on", () => {
    const { paths } = painted();

    for (const path of paths) {
      for (const [x, y] of path.points) {
        expect.soft(x).toBeGreaterThanOrEqual(0);
        expect.soft(x).toBeLessThanOrEqual(128);
        expect.soft(y).toBeGreaterThanOrEqual(0);
        expect.soft(y).toBeLessThanOrEqual(128);
      }
    }
  });

  it("bites the right side, which is the side that makes it that mark", () => {
    const { paths } = painted();
    // The cut shapes are the two after the three that flood the body.
    const bite = paths[4];

    expect(bite?.points[0]?.[0]).toBeGreaterThan(64);
  });
});
