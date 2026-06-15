import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Projects",
  description: "Highlighted projects spanning AI platforms, design systems, and streaming media.",
  alternates: { canonical: routes.projects },
};

export default function ProjectsPage(): ReactElement {
  return <DestinationView slug="projects" />;
}
