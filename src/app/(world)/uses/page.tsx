import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Uses",
  description: "The hardware, software, and rig Diogo Esteves ships the work from.",
  alternates: { canonical: routes.uses },
};

export default function UsesPage(): ReactElement {
  return <PageView slug="uses" />;
}
