import { routes } from "@/constants/routes";

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavItem[] = [
  {
    label: "Work",
    href: routes.work,
    description: "Selected engineering experience.",
  },
  {
    label: "Projects",
    href: routes.projects,
    description: "Highlighted projects and platforms.",
  },
  {
    label: "Writing",
    href: routes.writing,
    description: "Essays and field notes.",
  },
  {
    label: "About",
    href: routes.about,
    description: "Background, leadership philosophy, how I work.",
  },
  {
    label: "Résumé",
    href: routes.resume,
    description: "The full professional record.",
  },
  {
    label: "Contact",
    href: routes.contact,
    description: "Get in touch.",
  },
];
