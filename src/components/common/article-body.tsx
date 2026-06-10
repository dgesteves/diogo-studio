import type { ReactElement } from "react";
import { ArticleBlocks } from "@/components/article/article-blocks";
import { TableOfContents } from "@/components/article/toc";
import type { ArticleBlock } from "@/content/schema/article-blocks";
import type { TocItem } from "@/content/schema/toc";

export function ArticleBody({
  blocks,
  toc,
}: {
  blocks: readonly ArticleBlock[];
  toc: readonly TocItem[];
}): ReactElement {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="max-w-none lg:max-w-[68ch]">
        <ArticleBlocks blocks={blocks} />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <TableOfContents items={toc} />
        </div>
      </aside>
    </div>
  );
}
