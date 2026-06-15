import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Principles",
  description:
    "Engineering principles Diogo Esteves applies across platforms, teams, and product lines.",
  alternates: { canonical: routes.principles },
};

export default function PrinciplesPage(): ReactElement {
  return <DestinationView slug="principles" />;
}
