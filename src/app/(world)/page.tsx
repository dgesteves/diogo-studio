import type { ReactElement } from "react";
import { HomeCta } from "@/site/home-cta";
import { PageView } from "@/site/page-view";

/**
 * No `metadata` export, deliberately: the root's default title and description are the
 * site's own and its canonical is already `/`. Asserted in `pages.test.tsx`.
 */
export default function HomePage(): ReactElement {
  return <PageView slug="home" actions={<HomeCta />} />;
}
