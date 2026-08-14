import { getStationEntry } from "@/content/pages";
import { routes } from "@/content/pages";
import { siteConfig } from "@/config/site";
import type { Destination } from "../types";

export const reachDestinations: readonly Destination[] = [
  {
    ...getStationEntry("contact"),
    eyebrow: "Say hello",
    title: "Let's build something out of this world.",
    summary:
      "Get in touch with Diogo Esteves — open to Staff+, Principal, Founding Engineer, and VP / Head of Engineering roles.",
    blocks: [
      { kind: "lede", text: siteConfig.availability },
      {
        kind: "list",
        title: "Best fit",
        items: [
          "AI-native product companies, seed to Series B.",
          "Elite remote-first engineering organizations.",
          "Teams where the frontend is the product.",
        ],
      },
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
        items: [siteConfig.location, "Portuguese (native) · English (full professional)"],
      },
    ],
  },
  {
    ...getStationEntry("resume"),
    eyebrow: "The full record",
    title: "Staff / Principal Frontend & Platform Engineer.",
    summary:
      "Résumé of Diogo Esteves — AI-native systems, enterprise UI infrastructure, and scalable web architectures.",
    blocks: [
      {
        kind: "lede",
        text: "AI-native systems, enterprise UI infrastructure, scalable web architectures. Targeting Staff+, Principal, or Founding Engineer roles, and VP / Head of Engineering mandates at AI-native companies.",
      },
      {
        kind: "stats",
        items: [
          { label: "Experience", value: "11+ yrs", hint: "Deloitte → Fueled" },
          { label: "Companies", value: "8", hint: "startup → Fortune-class" },
          { label: "Base", value: "Lisbon", hint: "Remote · US-aligned" },
        ],
      },
      {
        kind: "list",
        title: "Credentials",
        items: [
          "Computer Engineering — ISEL, Lisbon.",
          "LLB in Law — Universidade Lusófona.",
          "Meta Front-End Developer Professional Certificate.",
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
