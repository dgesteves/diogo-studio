import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Open source",
  description: "Open-source work and experiments by Diogo Esteves.",
  alternates: { canonical: routes.openSource },
};

export default function OpenSourcePage(): ReactElement {
  return <PageView slug="openSource" />;
}
