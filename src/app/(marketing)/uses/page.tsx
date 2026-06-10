import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { Uses } from "@/features/uses";

export const metadata: Metadata = {
  title: "Uses",
  description: "Tools, hardware, editor, and dotfiles Diogo Esteves reaches for day-to-day.",
  alternates: { canonical: routes.uses },
};

export default function UsesPage(): ReactElement {
  return <Uses />;
}
