import { describe, expect, it } from "vitest";
import { careerEngagements, operatingCompanies, type EngagementId } from "./career";
import { patternList, patterns } from "@/constants/patterns";

describe("career data integrity", () => {
  it("declares at least the 5 flagship engagements + a coherent count", () => {
    expect(careerEngagements.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(careerEngagements.map((e) => e.id));
    for (const required of ["eino", "peacock", "diligent", "moment", "bmw"] as EngagementId[]) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it("has unique engagement ids and names", () => {
    expect(new Set(careerEngagements.map((e) => e.id)).size).toBe(careerEngagements.length);
    expect(new Set(careerEngagements.map((e) => e.name)).size).toBe(careerEngagements.length);
  });

  it("tags every engagement with at least one known pattern", () => {
    const known = new Set(patternList.map((p) => p.id));
    for (const e of careerEngagements) {
      expect(e.patterns.length).toBeGreaterThan(0);
      for (const p of e.patterns) expect(known.has(p)).toBe(true);
    }
  });

  it("lists each operating company once, with no blanks", () => {
    expect(operatingCompanies.length).toBeGreaterThanOrEqual(careerEngagements.length);
    expect(new Set(operatingCompanies).size).toBe(operatingCompanies.length);
    for (const company of operatingCompanies) expect(company.trim()).not.toBe("");
  });

  it("every pattern declares a token-resolved color var", () => {
    for (const p of patternList) {
      expect(p.colorVar).toMatch(/^[a-z-]+$/);
      expect(patterns[p.id]).toBe(p);
    }
  });
});
