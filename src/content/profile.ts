import { education } from "./career";

/**
 * The author. Identity, role, reach, and the facts the metadata, JSON-LD and the
 * agent all state — declared once, here, because this domain is the only place a
 * fact may live.
 *
 * Deployment configuration is not identity: `getSiteUrl()` reads the environment and
 * therefore stays out of `content/`, which imports nothing.
 */
export const siteConfig = {
  name: "Diogo Esteves",
  shortName: "Diogo Esteves",
  initials: "DE",
  role: "Staff / Principal Frontend & Platform Engineer",
  tagline: "AI-native systems, enterprise UI infrastructure, scalable web architectures.",
  location: "Lisbon, Portugal · Remote (US-aligned hours)",
  availability: "Open to Staff+, Principal, Founding Engineer, and VP / Head of Engineering roles.",
  email: "diogo.esteves.goncalves@gmail.com",
  address: {
    locality: "Lisbon",
    country: "PT",
  },
  knowsAbout: [
    "Frontend platform engineering",
    "AI-native product engineering",
    "Design systems",
    "Web performance",
    "Streaming reliability",
    "Engineering leadership",
  ],
  alumniOf: education.map((entry) => entry.institution),
  knowsLanguage: ["pt", "en"],
  links: {
    github: "https://github.com/dgesteves",
    linkedin: "https://linkedin.com/in/diogo-esteves",
  },
  twitterHandle: "@dgesteves",
} as const;
