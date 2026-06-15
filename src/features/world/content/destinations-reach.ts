import { routes } from "@/constants/routes";
import { siteConfig } from "@/config/site";
import type { Destination } from "../types";

export const reachDestinations: readonly Destination[] = [
  {
    slug: "contact",
    href: routes.contact,
    label: "Contact",
    eyebrow: "Say hello",
    title: "Let's build something out of this world.",
    summary:
      "Get in touch with Diogo Esteves — open to Staff+, Principal, Founding Engineer, and VP / Head of Engineering roles.",
    blocks: [
      { kind: "lede", text: siteConfig.availability },
      {
        kind: "links",
        items: [
          { label: "Email", href: `mailto:${siteConfig.email}`, external: true },
          { label: "LinkedIn", href: siteConfig.links.linkedin, external: true },
          { label: "GitHub", href: siteConfig.links.github, external: true },
          { label: "Read the résumé", href: routes.resume },
        ],
      },
      {
        kind: "list",
        title: "Based in",
        items: [siteConfig.location, "Portuguese (native) · English (fluent)"],
      },
    ],
  },
  {
    slug: "resume",
    href: routes.resume,
    label: "Résumé",
    eyebrow: "The full record",
    title: "Staff / Principal Frontend & Platform Engineer.",
    summary:
      "Résumé of Diogo Esteves — AI-native systems, enterprise UI infrastructure, and scalable web architectures.",
    blocks: [
      {
        kind: "lede",
        text: "AI-native systems, enterprise UI infrastructure, scalable web architectures. Targeting Staff+, Principal, or Founding Engineer roles, or VP / Head of Engineering mandates at seed–Series B AI-native companies.",
      },
      {
        kind: "stats",
        items: [
          { label: "Experience", value: "11+ yrs", hint: "since 2014" },
          { label: "Education", value: "ISEL", hint: "Computer Engineering" },
          { label: "Base", value: "Lisbon", hint: "Remote, US-aligned" },
        ],
      },
      {
        kind: "links",
        items: [
          { label: "Selected experience", href: routes.work },
          { label: "Technical stack", href: routes.stack },
          { label: "Full timeline", href: routes.timeline },
          { label: "Contact", href: routes.contact },
        ],
      },
    ],
  },
] as const;
