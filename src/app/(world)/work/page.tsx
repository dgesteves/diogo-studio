import type { Metadata } from "next";
import type { ReactElement } from "react";
import { pageMetadata } from "@/site/metadata";
import { PageView } from "@/site/page-view";

export const metadata: Metadata = pageMetadata("work");

export default function WorkPage(): ReactElement {
  return <PageView slug="work" />;
}
