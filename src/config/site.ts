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

export const operatingCompanies = [
  "Fueled",
  "Moment",
  "eino.ai",
  "NBCUniversal · Peacock",
  "Diligent",
  "BMW Group",
  "Deloitte",
] as const;

export const patterns = [
  "AI-native platforms",
  "Design-system infrastructure",
  "Streaming-grade reliability",
  "Agentic UX",
  "Enterprise scale",
] as const;
