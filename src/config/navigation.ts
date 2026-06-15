import { routes } from "@/constants/routes";

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: NavItem[] = [
  {
    label: "About",
    href: routes.about,
    description: "Background, leadership philosophy, how I work.",
  },
];
