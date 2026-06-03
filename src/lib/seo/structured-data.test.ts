import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  personJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";

type Json = Record<string, unknown>;

/**
 * `schema-dts` types are deep unions that resist direct indexing. We assert
 * against the serialized payload instead — which is exactly what `<JsonLd>`
 * emits via `JSON.stringify`, so the test mirrors production output.
 */
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

  describe("articleJsonLd", () => {
    it("builds an absolute canonical URL from the path", () => {
      const article = asJson(
        articleJsonLd({
          title: "Title",
          description: "Desc",
          path: "/work/example",
          datePublished: "2025-01-01",
        }),
      );
      expect(article["@type"]).toBe("Article");
      expect(String(article.url)).toMatch(/\/work\/example$/);
      expect(article.mainEntityOfPage).toBe(article.url);
    });

    it("defaults dateModified to datePublished when omitted", () => {
      const article = asJson(
        articleJsonLd({
          title: "Title",
          description: "Desc",
          path: "/writing/example",
          datePublished: "2025-02-02",
        }),
      );
      expect(article.dateModified).toBe("2025-02-02");
    });

    it("preserves an explicit dateModified and section", () => {
      const article = asJson(
        articleJsonLd({
          title: "Title",
          description: "Desc",
          path: "/work/example",
          datePublished: "2025-01-01",
          dateModified: "2025-03-03",
          section: "Case study",
        }),
      );
      expect(article.dateModified).toBe("2025-03-03");
      expect(article.articleSection).toBe("Case study");
    });
  });

  describe("breadcrumbJsonLd", () => {
    it("emits 1-indexed positions in order", () => {
      const crumb = asJson(
        breadcrumbJsonLd([
          { name: "Work", path: "/work" },
          { name: "Example", path: "/work/example" },
        ]),
      );
      expect(crumb["@type"]).toBe("BreadcrumbList");
      const items = crumb.itemListElement as Json[];
      expect(items.map((item) => item.position)).toEqual([1, 2]);
      expect(items[0]!.name).toBe("Work");
      expect(String(items[1]!.item)).toMatch(/\/work\/example$/);
    });
  });
});
