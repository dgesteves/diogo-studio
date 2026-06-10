import { isValidElement, type ReactNode } from "react";
import { slugifyHeading } from "@/lib/content/slugify-heading";
import { H2, H3 } from "./heading";

export type TocEntry = { id: string; title: string; depth: number };

type NodeProps = { children?: ReactNode };

function visit(node: ReactNode, entries: TocEntry[]): void {
  if (Array.isArray(node)) {
    for (const child of node) visit(child, entries);
    return;
  }
  if (!isValidElement<NodeProps>(node)) return;
  if (node.type === H2 || node.type === H3) {
    const title = typeof node.props.children === "string" ? node.props.children : "";
    if (title) {
      entries.push({ id: slugifyHeading(title), title, depth: node.type === H2 ? 0 : 1 });
    }
    return;
  }
  if (typeof node.type === "function") {
    const render = node.type as (props: NodeProps) => ReactNode;
    try {
      visit(render(node.props), entries);
    } catch {
      return;
    }
    return;
  }
  visit(node.props.children, entries);
}

export function extractToc(node: ReactNode): TocEntry[] {
  const entries: TocEntry[] = [];
  visit(node, entries);
  return entries;
}
