import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Open source",
  description: "Open-source work and experiments by Diogo Esteves.",
  alternates: { canonical: routes.openSource },
};

export default function OpenSourcePage(): ReactElement {
  return <DestinationView slug="openSource" />;
}
