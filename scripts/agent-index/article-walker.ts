import { Fragment, createElement, isValidElement, type ComponentType, type ReactNode } from "react";
import { H2 } from "@/components/article/heading";
import { slugifyHeading } from "@/lib/content/slugify-heading";

import type { RawSection } from "./types";

type AnyProps = { children?: ReactNode; "aria-hidden"?: boolean | "true" | "false" };
type AnyElement = React.ReactElement<AnyProps>;

function isHidden(props: AnyProps): boolean {
  return props["aria-hidden"] === true || props["aria-hidden"] === "true";
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(" ");
  if (!isValidElement<AnyProps>(node)) return "";
  if (isHidden(node.props)) return "";
  if (typeof node.type === "function") {
    try {
      return textOf((node.type as (props: AnyProps) => ReactNode)(node.props));
    } catch {
      return "";
    }
  }
  if (typeof node.type === "string" || node.type === Fragment) {
    return textOf(node.props.children);
  }
  return "";
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

type Accumulator = { sections: RawSection[]; current: RawSection };

function appendParagraph(acc: Accumulator, text: string): void {
  const paragraph = normalize(text);
  if (paragraph) acc.current.body += `${paragraph}\n\n`;
}

function flow(node: ReactNode, acc: Accumulator): void {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (typeof node === "string" || typeof node === "number") {
    appendParagraph(acc, String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) flow(child, acc);
    return;
  }
  if (!isValidElement<AnyProps>(node)) return;
  if (isHidden(node.props)) return;
  if (node.type === H2) {
    const heading = normalize(textOf(node.props.children));
    if (acc.current.body.trim()) acc.sections.push(acc.current);
    acc.current = { heading, anchor: slugifyHeading(heading), body: "" };
    return;
  }
  if (node.type === Fragment) {
    flow(node.props.children, acc);
    return;
  }
  if (typeof node.type === "function") {
    let rendered: ReactNode;
    try {
      rendered = (node.type as (props: AnyProps) => ReactNode)(node.props);
    } catch {
      return;
    }
    flow(rendered, acc);
    return;
  }
  if (typeof node.type === "string") {
    appendParagraph(acc, textOf(node));
  }
}

export function bodySections(Body: ComponentType): RawSection[] {
  const acc: Accumulator = { sections: [], current: { body: "" } };
  flow(createElement(Body) as AnyElement, acc);
  if (acc.current.body.trim()) acc.sections.push(acc.current);
  return acc.sections;
}
