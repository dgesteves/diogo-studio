import type { ReactElement } from "react";
import type { Person, Thing, WebSite, WithContext } from "schema-dts";
import { siteConfig } from "@/content/profile";

import { getSiteUrl } from "./metadata";

export function JsonLd<T extends Thing>({ data }: { data: WithContext<T> }): ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />
  );
}

/**
 * `JSON.stringify` leaves `<` alone, so a string containing `</script>` would close this
 * element and everything after it would be markup. Escaping it as `\u003c` is still the same
 * JSON to a parser, and it keeps the guarantee local instead of resting on every caller
 * passing authored data.
 */
function serialize<T extends Thing>(data: WithContext<T>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const PERSON_ID = "#person";
const WEBSITE_ID = "#website";

export function personJsonLd(): WithContext<Person> {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}/${PERSON_ID}`,
    name: siteConfig.name,
    url: `${url}/`,
    jobTitle: siteConfig.role,
    description: siteConfig.tagline,
    email: `mailto:${siteConfig.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.address.locality,
      addressCountry: siteConfig.address.country,
    },
    sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
    knowsAbout: [...siteConfig.knowsAbout],
    alumniOf: siteConfig.alumniOf.map((name) => ({
      "@type": "CollegeOrUniversity",
      name,
    })),
    knowsLanguage: [...siteConfig.knowsLanguage],
  };
}

export function websiteJsonLd(): WithContext<WebSite> {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/${WEBSITE_ID}`,
    url: `${url}/`,
    name: siteConfig.name,
    description: siteConfig.tagline,
    inLanguage: "en",
    author: { "@id": `${url}/${PERSON_ID}` },
    publisher: { "@id": `${url}/${PERSON_ID}` },
  };
}
