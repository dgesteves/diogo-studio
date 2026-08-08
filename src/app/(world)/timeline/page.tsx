import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Timeline",
  description: "The chronological career and education timeline of Diogo Esteves.",
  alternates: { canonical: routes.timeline },
};

export default function TimelinePage(): ReactElement {
  return <DestinationView slug="timeline" />;
}
