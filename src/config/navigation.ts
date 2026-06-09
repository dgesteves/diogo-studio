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
