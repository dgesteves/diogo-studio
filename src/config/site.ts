/**
 * Single source of truth for site-wide identity, navigation, and metadata.
 * Anything user-visible that is not page-specific should live here.
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
  links: {
    github: "https://github.com/dgesteves",
    linkedin: "https://linkedin.com/in/diogo-esteves",
  },
  twitterHandle: "@dgesteves",
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { label: "Work", href: "/work", description: "Case studies, postmortems, and decisions." },
  {
    label: "Writing",
    href: "/writing",
    description: "Essays on platform, AI-native UX, and design systems.",
  },
  { label: "About", href: "/about", description: "Background, leadership philosophy, how I work." },
  { label: "Contact", href: "/contact", description: "Reach out about Staff+ or VP roles." },
];

/**
 * Operating companies referenced in the hero trust strip and Phase 2 graph.
 * Order matters — most recent / highest-leverage first.
 */
export const operatingCompanies = [
  "Fueled",
  "Moment",
  "eino.ai",
  "NBCUniversal · Peacock",
  "Diligent",
  "BMW Group",
  "Deloitte",
] as const;

/**
 * Patterns that connect the operating companies. These will become edges in
 * the Phase 2 career graph and pattern filters on `/work`.
 */
export const patterns = [
  "AI-native platforms",
  "Design-system infrastructure",
  "Streaming-grade reliability",
  "Agentic UX",
  "Enterprise scale",
] as const;
