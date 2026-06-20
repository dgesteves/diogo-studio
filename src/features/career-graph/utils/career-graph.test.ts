import { describe, expect, it } from "vitest";
import { routes } from "@/constants/routes";
import { nodes, type NodeId } from "@/features/career-graph/constants/career-graph-nodes";
import { getNode } from "./get-node";
import { nodeHref } from "./node-href";
import { projectToSvg } from "./project-to-svg";

describe("career-graph logic", () => {
  it("nodeHref points every node to the home route", () => {
    expect(nodeHref()).toBe(routes.home);
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
