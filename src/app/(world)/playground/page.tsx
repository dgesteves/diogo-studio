import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Playground",
  description: "Interactive experiments powering this studio — 3D, motion, and command-driven UX.",
  alternates: { canonical: routes.playground },
};

export default function PlaygroundPage(): ReactElement {
  return <PageView slug="playground" />;
}
