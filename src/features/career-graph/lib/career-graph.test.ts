import { describe, expect, it } from "vitest";
import { caseStudyPath, routes } from "@/constants/routes";
import { nodes, type NodeId } from "@/content/data/career-graph-nodes";
import { getNode } from "./get-node";
import { nodeHref, PUBLISHED_CASE_STUDY_SLUGS } from "./node-href";
import { projectToSvg } from "./project-to-svg";

describe("career-graph logic", () => {
  it("nodeHref deep-links to the case study for published slugs, falls back to /work", () => {
    for (const n of nodes) {
      const href = nodeHref(n);
      if (n.slug && PUBLISHED_CASE_STUDY_SLUGS.has(n.slug)) {
        expect(href).toBe(caseStudyPath(n.slug));
      } else {
        expect(href).toBe(routes.work);
      }
    }
  });

  it("getNode returns the matching node and throws on unknowns", () => {
    expect(getNode("eino").id).toBe("eino");
    expect(() => getNode("does-not-exist" as NodeId)).toThrow();
  });

  it("projectToSvg keeps points inside the viewport with padding", () => {
    const viewport = {
      width: 1000,
      height: 600,
      padding: { x: 80, top: 60, bottom: 80 },
    };
    for (const n of nodes) {
      const { x, y } = projectToSvg(n.position, viewport);
      expect(x).toBeGreaterThanOrEqual(viewport.padding.x);
      expect(x).toBeLessThanOrEqual(viewport.width - viewport.padding.x);
      expect(y).toBeGreaterThanOrEqual(viewport.padding.top);
      expect(y).toBeLessThanOrEqual(viewport.height - viewport.padding.bottom);
    }
  });
});
