import type { Metadata } from "next";
import type { ReactElement } from "react";
import { pageMetadata } from "@/site/metadata";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = pageMetadata("uses");

export default function UsesPage(): ReactElement {
  return <PageView slug="uses" />;
}
