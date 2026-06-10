import type { ReactElement, ReactNode } from "react";
import { extractToc } from "@/components/article/extract-toc";
import { Prose } from "@/components/article/prose";
import { ArticleToc } from "@/components/article/toc";

export function ArticleBody({ children }: { children: ReactNode }): ReactElement {
  const toc = extractToc(children);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="max-w-none lg:max-w-[68ch]">
        <Prose>{children}</Prose>
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <ArticleToc entries={toc} />
        </div>
      </aside>
    </div>
  );
}
