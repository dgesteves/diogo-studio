import "server-only";

import { getStationEntry, routes } from "../pages";
import { siteConfig } from "../profile";
import type { Page } from "../schema";

export const contact: Page = {
  ...getStationEntry("contact"),
  eyebrow: "Say hello",
  title: "Let's build something out of this world.",
  summary:
    "Get in touch with Diogo Esteves — open to Staff+, Principal, Founding Engineer, and VP / Head of Engineering roles.",
  blocks: [
    { id: "availability", kind: "lede", text: siteConfig.availability },
    {
      id: "best-fit",
      kind: "list",
      title: "Best fit",
      items: [
        "AI-native product companies, seed to Series B.",
        "Elite remote-first engineering organizations.",
        "Teams where the frontend is the product.",
      ],
    },
    {
      id: "channels",
      kind: "links",
      items: [
        { label: "Email", href: `mailto:${siteConfig.email}`, external: true },
        { label: "LinkedIn", href: siteConfig.links.linkedin, external: true },
        { label: "GitHub", href: siteConfig.links.github, external: true },
        { label: "Read the résumé", href: routes.resume },
      ],
    },
    {
      id: "based-in",
      kind: "list",
      title: "Based in",
      items: [siteConfig.location, "Portuguese (native) · English (full professional)"],
    },
  ],
};
