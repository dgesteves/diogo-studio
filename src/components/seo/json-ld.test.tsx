import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Person, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

/**
 * The one place in the app that writes a raw string into the document. `structured-data.ts`
 * owns what the graph says and `seo.spec.ts` parses it from a real page; this owns the one
 * property of the sink itself — that nothing in the data can end the script element.
 */

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
