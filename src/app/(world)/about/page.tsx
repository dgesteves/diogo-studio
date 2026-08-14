import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AboutPortrait } from "@/features/about";
import { pageMetadata } from "@/site/metadata";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = pageMetadata("about");

export default function AboutPage(): ReactElement {
  return <PageView slug="about" media={<AboutPortrait />} />;
}
