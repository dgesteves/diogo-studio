import { describe, expect, it } from "vitest";
import { edges } from "./career-graph-edges";
import { nodes, type NodeId } from "./career-graph-nodes";
import { patternList, patterns } from "@/constants/patterns";

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
        expect(Number.isFinite(v)).toBe(true);
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
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      const a = byId.get(edge.from)!;
      const b = byId.get(edge.to)!;
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

  it("every pattern declares a token-resolved color var", () => {
    for (const p of patternList) {
      expect(p.colorVar).toMatch(/^[a-z-]+$/);
      expect(patterns[p.id]).toBe(p);
    }
  });
});
