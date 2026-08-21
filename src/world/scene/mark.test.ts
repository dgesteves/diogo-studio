import { describe, expect, it } from "vitest";

import { createRecordingContext } from "@tests/recording-ctx";
import { paintMark } from "./mark";

/**
 * The picture the Mac Studio and the MacBook both print on their lids. It is one routine
 * painting one silhouette, so it is asserted once here rather than at either object.
 */

describe("the mark", () => {
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
