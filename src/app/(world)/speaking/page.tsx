import type { Metadata } from "next";
import type { ReactElement } from "react";
import { pageMetadata } from "@/site/metadata";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = pageMetadata("speaking");

export default function SpeakingPage(): ReactElement {
  return <PageView slug="speaking" />;
}
