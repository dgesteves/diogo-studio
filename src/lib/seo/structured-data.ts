import type { Article, BreadcrumbList, Person, WebSite, WithContext } from "schema-dts";
import { env } from "@/env";
import { siteConfig } from "@/config/site";

/**
 * Typed JSON-LD builders (Phase 5).
 *
 * `Person` + `WebSite` are emitted once from the root layout and cross-linked
 * by stable `@id`s so the graph resolves to a single entity. `Article` and
 * `BreadcrumbList` are emitted per case-study / essay. Everything traces back
 * to verifiable facts from the resume — no invented credentials.
 */

function baseUrl(): string {
  return env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

const PERSON_ID = "#person";
const WEBSITE_ID = "#website";

export function personJsonLd(): WithContext<Person> {
  const url = baseUrl();
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
      addressLocality: "Lisbon",
      addressCountry: "PT",
    },
    sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
    knowsAbout: [
      "Frontend platform engineering",
      "AI-native product engineering",
      "Design systems",
      "Web performance",
      "Streaming reliability",
      "Engineering leadership",
    ],
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "ISEL — Instituto Superior de Engenharia de Lisboa",
      },
      {
        "@type": "CollegeOrUniversity",
        name: "Universidade Lusófona",
      },
    ],
    knowsLanguage: ["pt", "en"],
  };
}

export function websiteJsonLd(): WithContext<WebSite> {
  const url = baseUrl();
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

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  section?: string;
}): WithContext<Article> {
  const url = baseUrl();
  const canonical = `${url}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: "en",
    ...(input.section ? { articleSection: input.section } : {}),
    author: { "@id": `${url}/${PERSON_ID}` },
    publisher: { "@id": `${url}/${PERSON_ID}` },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): WithContext<BreadcrumbList> {
  const url = baseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${url}${item.path}`,
    })),
  };
}
