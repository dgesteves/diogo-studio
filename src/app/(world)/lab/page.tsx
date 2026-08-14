import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Research and development explorations by Diogo Esteves — AI tooling and interface R&D.",
  alternates: { canonical: routes.lab },
};

export default function LabPage(): ReactElement {
  return <PageView slug="lab" />;
}
