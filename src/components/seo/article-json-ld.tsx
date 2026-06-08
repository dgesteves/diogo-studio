import type { ReactElement } from "react";

import { JsonLd } from "./json-ld";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";

export function ArticleJsonLd({
  title,
  description,
  permalink,
  publishedAt,
  updatedAt,
  section,
  crumbName,
  crumbPath,
}: {
  title: string;
  description: string;
  permalink: string;
  publishedAt: string;
  updatedAt?: string;
  section: string;
  crumbName: string;
  crumbPath: string;
}): ReactElement {
  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title,
          description,
          path: permalink,
          datePublished: publishedAt,
          dateModified: updatedAt ?? publishedAt,
          section,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: crumbName, path: crumbPath },
          { name: title, path: permalink },
        ])}
      />
    </>
  );
}
