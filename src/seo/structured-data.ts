import type { Person, WebSite, WithContext } from "schema-dts";
import { getSiteUrl, siteConfig } from "@/config/site";

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
