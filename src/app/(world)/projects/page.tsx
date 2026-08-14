import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Projects",
  description: "Highlighted projects spanning AI platforms, design systems, and streaming media.",
  alternates: { canonical: routes.projects },
};

export default function ProjectsPage(): ReactElement {
  return <PageView slug="projects" />;
}
