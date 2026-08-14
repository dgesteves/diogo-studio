import type { Metadata } from "next";
import type { ReactElement } from "react";
import { pageMetadata } from "@/site/metadata";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = pageMetadata("principles");

export default function PrinciplesPage(): ReactElement {
  return <PageView slug="principles" />;
}
