import { describe, expect, it } from "vitest";
import {
  edges,
  getNode,
  nodeHref,
  nodes,
  patternList,
  patterns,
  projectToSvg,
  type NodeId,
} from "./career-graph";

describe("career-graph data integrity", () => {
  it("declares at least the 5 flagship engagements + a coherent count", () => {
    expect(nodes.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(nodes.map((n) => n.id));
    for (const required of ["eino", "peacock", "diligent", "moment", "bmw"] as NodeId[]) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it("has unique node ids and labels", () => {
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
    expect(new Set(nodes.map((n) => n.label)).size).toBe(nodes.length);
  });

  it("keeps every position inside the documented [-1, 1] coordinate cube", () => {
    for (const n of nodes) {
      for (const [axis, v] of (["x", "y", "z"] as const).map(
        (a, i) => [a, n.position[i]!] as const,
      )) {
        expect(Math.abs(v)).toBeLessThanOrEqual(1.001);
        // Sanity: positions are deterministic numbers (not NaN).
        expect(Number.isFinite(v)).toBe(true);
        // Reads better in the assertion log:
        expect({ id: n.id, axis, v }).toBeDefined();
      }
    }
  });

  it("tags every node with at least one known pattern", () => {
    const known = new Set(patternList.map((p) => p.id));
    for (const n of nodes) {
      expect(n.patterns.length).toBeGreaterThan(0);
      for (const p of n.patterns) expect(known.has(p)).toBe(true);
    }
  });

  it("derives edges only between nodes that share a pattern", () => {
    for (const edge of edges) {
      const a = getNode(edge.from);
      const b = getNode(edge.to);
      const shared = a.patterns.filter((p) => b.patterns.includes(p));
      expect(shared.length).toBeGreaterThan(0);
      expect(shared).toContain(edge.pattern);
      expect(edge.sharedPatterns).toEqual(shared);
    }
  });

  it("edges are deduped — each unordered pair appears at most once", () => {
    const seen = new Set<string>();
    for (const e of edges) {
      const key = [e.from, e.to].sort().join("::");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("nodeHref points to /work#slug for nodes with a slug, /work otherwise", () => {
    for (const n of nodes) {
      const href = nodeHref(n);
      if (n.slug) expect(href).toBe(`/work#${n.slug}`);
      else expect(href).toBe("/work");
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

  it("every pattern declares a token-resolved color var", () => {
    for (const p of patternList) {
      expect(p.colorVar).toMatch(/^[a-z-]+$/);
      expect(patterns[p.id]).toBe(p);
    }
  });
});
