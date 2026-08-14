import { describe, expect, it } from "vitest";

import { siteConfig } from "./profile";

describe("siteConfig", () => {
  it("carries the identity the metadata and JSON-LD are built from", () => {
    expect(siteConfig.name).toBe("Diogo Esteves");
    expect(siteConfig.email).toContain("@");
    expect(siteConfig.twitterHandle.startsWith("@")).toBe(true);
  });

  it("links out over https only", () => {
    const insecure = Object.values(siteConfig.links).filter((url) => !url.startsWith("https://"));

    expect(insecure).toEqual([]);
  });
});
