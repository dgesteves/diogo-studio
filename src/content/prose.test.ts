import { describe, expect, it } from "vitest";
import { stationIndex } from "./pages";
import { getPage, pages } from "./prose";

// The scalar page list and the prose collection are separate modules so that client
// islands never pull page prose into the bundle. That split is only safe while the two
// agree, so assert it rather than trusting it.
describe("pages", () => {
  it("agrees with the page list, entry for entry and in order", () => {
    expect(pages).toHaveLength(stationIndex.length);
    pages.forEach((page, i) => {
      const station = stationIndex[i];
      expect(station).toBeDefined();
      expect(page.slug).toBe(station?.slug);
      expect(page.href).toBe(station?.href);
      expect(page.label).toBe(station?.label);
    });
  });

  it("gives every page an eyebrow, a title, a summary and at least one block", () => {
    for (const page of pages) {
      expect(page.eyebrow.length).toBeGreaterThan(0);
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.summary.length).toBeGreaterThan(0);
      expect(page.blocks.length).toBeGreaterThan(0);
    }
  });

  // A block id is rendered as an element id and cited as a URL fragment, so a duplicate
  // sends the reader to whichever one the browser finds first, and a space or a capital
  // makes a fragment that never resolves. Neither failure is visible on the page.
  it("gives every block a URL-safe id, unique within its page", () => {
    for (const page of pages) {
      const ids = page.blocks.map((block) => block.id);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(new Set(ids).size, `${page.href} repeats a block id`).toBe(ids.length);
    }
  });
});

describe("getPage", () => {
  it("returns the page authored for the slug", () => {
    for (const station of stationIndex) {
      expect(getPage(station.slug).slug).toBe(station.slug);
    }
  });
});
