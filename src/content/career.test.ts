import { describe, expect, it } from "vitest";

import {
  education,
  engagements,
  operatingCompanies,
  orgLine,
  patternLabels,
  type Engagement,
  type PatternId,
} from "./career";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

describe("the career record", () => {
  it("declares at least the flagship engagements, each exactly once", () => {
    const ids = new Set(engagements.map((engagement) => engagement.id));
    expect(ids.size).toBe(engagements.length);
    for (const required of ["eino", "peacock", "diligent", "moment", "bmw", "superglue"]) {
      expect(ids.has(required)).toBe(true);
    }
  });

  it("gives every engagement an anchorable id, a company, a role and at least one point", () => {
    for (const engagement of engagements) {
      expect(engagement.id).toMatch(/^[a-z0-9-]+$/);
      expect(engagement.company.trim()).not.toBe("");
      expect(engagement.role.trim()).not.toBe("");
      expect(engagement.period.trim()).not.toBe("");
      expect(engagement.years.trim()).not.toBe("");
      expect(engagement.points.length).toBeGreaterThan(0);
    }
  });

  it("tags every engagement with at least one known pattern", () => {
    const known = new Set(Object.keys(patternLabels) as PatternId[]);
    for (const engagement of engagements) {
      expect(engagement.patterns.length).toBeGreaterThan(0);
      for (const pattern of engagement.patterns) expect(known.has(pattern)).toBe(true);
    }
  });

  // `/timeline` merges engagements and education into one run by sorting on this string,
  // so a malformed or unsorted `start` is a silently scrambled page.
  it("carries sortable start months, newest engagement first", () => {
    for (const entry of [...engagements, ...education]) expect(entry.start).toMatch(MONTH);
    const starts = engagements.map((engagement) => engagement.start);
    expect(starts).toEqual([...starts].sort((a, b) => b.localeCompare(a)));
  });

  it("names each education entry once, with an institution and a qualification", () => {
    const ids = new Set(education.map((entry) => entry.id));
    expect(ids.size).toBe(education.length);
    for (const entry of education) {
      expect(entry.institution.trim()).not.toBe("");
      expect(entry.qualification.trim()).not.toBe("");
      expect(entry.points.length).toBeGreaterThan(0);
    }
  });
});

describe("orgLine()", () => {
  const base: Engagement = {
    id: "example",
    company: "Fueled",
    role: "Lead Engineer",
    period: "Dec 2025 — Present",
    years: "2025 — NOW",
    start: "2025-12",
    points: ["Shipped things."],
    patterns: ["enterprise"],
  };

  it("appends a location only when there is one", () => {
    expect(orgLine({ ...base, location: "Lisbon" })).toBe("Fueled · Lisbon");
    expect(orgLine(base)).toBe("Fueled");
  });
});

describe("operatingCompanies", () => {
  it("lists each company once, with no blanks", () => {
    expect(operatingCompanies).toHaveLength(engagements.length);
    expect(new Set(operatingCompanies).size).toBe(operatingCompanies.length);
    for (const company of operatingCompanies) expect(company.trim()).not.toBe("");
  });
});
