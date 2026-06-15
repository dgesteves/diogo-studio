"use client";

import { Command } from "cmdk";
import { ArrowUpRight, UserRound } from "lucide-react";
import { type ReactElement, type ReactNode } from "react";
import { routes } from "@/constants/routes";

export function iconForPage(href: string): ReactElement {
  if (href.startsWith(routes.about)) return <UserRound className="size-4" />;
  return <ArrowUpRight className="size-4" />;
}

type ItemProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
  external?: boolean;
  onSelect: () => void;
};

export function Item({ icon, label, hint, external, onSelect }: ItemProps): ReactElement {
  return (
    <Command.Item
      onSelect={onSelect}
      className="text-foreground aria-selected:bg-surface-muted aria-selected:text-foreground data-[selected=true]:bg-surface-muted flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
    >
      <span className="border-border bg-surface-inset text-muted-foreground grid size-7 place-items-center rounded-md border">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {hint ? (
        <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
          {hint}
        </span>
      ) : null}
      {external ? <ArrowUpRight className="text-subtle-foreground size-3.5" /> : null}
    </Command.Item>
  );
}
