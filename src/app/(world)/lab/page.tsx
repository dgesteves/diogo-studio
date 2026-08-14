import type { Metadata } from "next";
import type { ReactElement } from "react";
import { pageMetadata } from "@/site/metadata";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = pageMetadata("lab");

export default function LabPage(): ReactElement {
  return <PageView slug="lab" />;
}
