import { env } from "@/config/env";

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
  alumniOf: ["ISEL — Instituto Superior de Engenharia de Lisboa", "Universidade Lusófona"],
  knowsLanguage: ["pt", "en"],
  links: {
    github: "https://github.com/dgesteves",
    linkedin: "https://linkedin.com/in/diogo-esteves",
  },
  twitterHandle: "@dgesteves",
} as const;

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  return env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL;
}
