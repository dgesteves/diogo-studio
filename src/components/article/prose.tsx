import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const paragraphClassName =
  "[&>p]:text-foreground [&>p]:text-base [&>p]:leading-7 [&>p]:text-pretty";

const listClassName =
  "[&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-1.5 [&>ul]:pl-5 [&>ul>li]:text-foreground [&>ul>li]:text-base [&>ul>li]:leading-7 [&>ul>li]:text-pretty [&>ul>li]:marker:text-subtle-foreground";

const quoteClassName =
  "[&>blockquote]:border-accent [&>blockquote]:text-muted-foreground [&>blockquote]:border-l-2 [&>blockquote]:pl-4 [&>blockquote]:text-base [&>blockquote]:leading-7";

const inlineClassName =
  "[&_strong]:text-foreground [&_strong]:font-medium [&_code]:bg-code-bg [&_code]:text-code-foreground [&_code]:border-border [&_code]:rounded [&_code]:border [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]";

export function Prose({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        paragraphClassName,
        listClassName,
        quoteClassName,
        inlineClassName,
      )}
    >
      {children}
    </div>
  );
}
