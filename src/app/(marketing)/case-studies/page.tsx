import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Case studies",
  description: "In-depth case studies on design systems, streaming scale, and agentic UX.",
  alternates: { canonical: routes.caseStudies },
};

export default function CaseStudiesPage(): ReactElement {
  return <DestinationView slug="caseStudies" />;
}
