import type { InternalHref, RouteKey, RoutePath } from "./pages";

/**
 * The shape of the authored record. Every renderer — the DOM reading surface, the 3D
 * room's canvas screens, the agent's retrieval index — derives from these types and
 * none of them may restate a fact.
 */
export type ContentLink =
  | { label: string; href: string; external: true }
  | { label: string; href: InternalHref; external?: false };

export type ContentBlock =
  | { kind: "lede"; text: string }
  | { kind: "prose"; paragraphs: readonly string[] }
  | { kind: "list"; title?: string; items: readonly string[] }
  | {
      kind: "stats";
      items: readonly { label: string; value: string; hint?: string }[];
    }
  | {
      kind: "cards";
      items: readonly { title: string; meta?: string; body: string }[];
    }
  | {
      kind: "timeline";
      items: readonly {
        period: string;
        title: string;
        org?: string;
        points: readonly string[];
      }[];
    }
  | {
      kind: "links";
      items: readonly ContentLink[];
    };

export type Destination = {
  slug: RouteKey;
  href: RoutePath;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  blocks: readonly ContentBlock[];
};
