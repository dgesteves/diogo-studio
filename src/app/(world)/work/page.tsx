import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected engineering experience across streaming, governance, automotive, and AI-native platforms.",
  alternates: { canonical: routes.work },
};

export default function WorkPage(): ReactElement {
  return <PageView slug="work" />;
}
