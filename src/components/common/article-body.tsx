import type { ComponentProps, ReactElement } from "react";
import { MDXContent } from "@/components/mdx/mdx-content";
import { TableOfContents } from "@/components/mdx/toc";

export function ArticleBody({
  code,
  toc,
}: {
  code: ComponentProps<typeof MDXContent>["code"];
  toc: ComponentProps<typeof TableOfContents>["items"];
}): ReactElement {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="mdx-prose max-w-none lg:max-w-[68ch]">
        <MDXContent code={code} />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <TableOfContents items={toc} />
        </div>
      </aside>
    </div>
  );
}
