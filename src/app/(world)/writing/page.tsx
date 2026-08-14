import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays and field notes on frontend platforms, AI-native UX, and engineering leadership.",
  alternates: { canonical: routes.writing },
};

export default function WritingPage(): ReactElement {
  return <PageView slug="writing" />;
}
