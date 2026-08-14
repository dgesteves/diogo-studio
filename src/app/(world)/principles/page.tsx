import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Principles",
  description:
    "Engineering principles Diogo Esteves applies across platforms, teams, and product lines.",
  alternates: { canonical: routes.principles },
};

export default function PrinciplesPage(): ReactElement {
  return <PageView slug="principles" />;
}
