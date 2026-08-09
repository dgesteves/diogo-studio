import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { personJsonLd, websiteJsonLd } from "@/seo/structured-data";

type Json = Record<string, unknown>;

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

describe("structured-data", () => {
  describe("personJsonLd", () => {
    const person = asJson(personJsonLd());

    it("is a Person with a stable #person @id", () => {
      expect(person["@type"]).toBe("Person");
      expect(String(person["@id"])).toMatch(/#person$/);
    });

    it("uses identity from siteConfig", () => {
      expect(person.name).toBe(siteConfig.name);
      expect(person.jobTitle).toBe(siteConfig.role);
    });

    it("links out to the real social profiles", () => {
      expect(person.sameAs).toEqual(
        expect.arrayContaining([siteConfig.links.github, siteConfig.links.linkedin]),
      );
    });

    it("lists both real alma maters", () => {
      expect(Array.isArray(person.alumniOf)).toBe(true);
      expect(person.alumniOf as unknown[]).toHaveLength(2);
    });
  });

  describe("websiteJsonLd", () => {
    it("cross-links author + publisher to the Person @id", () => {
      const person = asJson(personJsonLd());
      const website = asJson(websiteJsonLd());
      expect(website["@type"]).toBe("WebSite");
      expect(website.author).toEqual({ "@id": person["@id"] });
      expect(website.publisher).toEqual({ "@id": person["@id"] });
    });
  });
});
