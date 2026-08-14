import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Now",
  description: "What Diogo Esteves is building, learning, and optimizing for today.",
  alternates: { canonical: routes.now },
};

export default function NowPage(): ReactElement {
  return <PageView slug="now" />;
}
