import { describe, expect, it } from "vitest";
import { Object3D } from "three";
import { getHotspotObjects, registerHotspot, unregisterHotspot } from "./hotspot-registry";

describe("hotspot registry", () => {
  it("registers and unregisters objects", () => {
    const a = new Object3D();
    const b = new Object3D();

    registerHotspot(a);
    registerHotspot(b);
    expect(getHotspotObjects()).toContain(a);
    expect(getHotspotObjects()).toContain(b);

    unregisterHotspot(a);
    expect(getHotspotObjects()).not.toContain(a);
    expect(getHotspotObjects()).toContain(b);

    unregisterHotspot(b);
    expect(getHotspotObjects()).not.toContain(b);
  });

  it("does not duplicate the same object", () => {
    const a = new Object3D();
    registerHotspot(a);
    registerHotspot(a);
    expect(getHotspotObjects().filter((object) => object === a)).toHaveLength(1);
    unregisterHotspot(a);
  });
});
