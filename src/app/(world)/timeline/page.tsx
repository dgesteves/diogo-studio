import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Timeline",
  description: "The chronological career and education timeline of Diogo Esteves.",
  alternates: { canonical: routes.timeline },
};

export default function TimelinePage(): ReactElement {
  return <PageView slug="timeline" />;
}
