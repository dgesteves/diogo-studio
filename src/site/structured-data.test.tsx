import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Person, WithContext } from "schema-dts";
import { siteConfig } from "@/content/profile";

import { JsonLd, personJsonLd, websiteJsonLd } from "./structured-data";

/**
 * What the graph says, and the one place in the app that writes a raw string into the
 * document. `seo.spec.ts` parses the result from a real page; what is here is the shape of
 * the data and the one property of the sink itself — that nothing in the data can end the
 * script element.
 */

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

function person(name: string): WithContext<Person> {
  return { "@context": "https://schema.org", "@type": "Person", name };
}

describe("JsonLd", () => {
  it("emits the graph as a linked-data script", () => {
    const html = renderToStaticMarkup(<JsonLd data={person("Diogo Esteves")} />);

    expect(html).toBe(
      '<script type="application/ld+json">' +
        '{"@context":"https://schema.org","@type":"Person","name":"Diogo Esteves"}' +
        "</script>",
    );
  });

  it("cannot be closed early by its own data", () => {
    const hostile = person("</script><script>alert(1)</script>");
    const html = renderToStaticMarkup(<JsonLd data={hostile} />);

    // One closing tag, at the end, and the payload still parses as the same JSON.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const payload = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(payload)).toEqual(hostile);
  });
});
