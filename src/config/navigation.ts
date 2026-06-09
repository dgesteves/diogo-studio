import { routes } from "@/config/routes";

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavItem[] = [
  { label: "Work", href: routes.work, description: "Case studies, postmortems, and decisions." },
  {
    label: "Writing",
    href: routes.writing,
    description: "Essays on platform, AI-native UX, and design systems.",
  },
  {
    label: "About",
    href: routes.about,
    description: "Background, leadership philosophy, how I work.",
  },
  { label: "Contact", href: routes.contact, description: "Reach out about Staff+ or VP roles." },
];
