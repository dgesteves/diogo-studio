import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Speaking",
  description: "Talks, mentoring, and community leadership by Diogo Esteves.",
  alternates: { canonical: routes.speaking },
};

export default function SpeakingPage(): ReactElement {
  return <PageView slug="speaking" />;
}
