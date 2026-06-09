import type { ReactElement } from "react";

export function ContentEmptyState({ message }: { message: string }): ReactElement {
  return (
    <div className="border-border bg-surface text-muted-foreground rounded-lg border border-dashed p-10 text-center">
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
