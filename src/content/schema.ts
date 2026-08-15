import type { InternalHref, RouteKey, RoutePath } from "./pages";

/**
 * The shape of the authored record. Every renderer — the DOM reading surface, the 3D
 * room's canvas screens, the agent's retrieval index — derives from these types and
 * none of them may restate a fact.
 */
export type ContentLink =
  | { label: string; href: string; external: true }
  | { label: string; href: InternalHref; external?: false };

/**
 * Every block carries an `id`, and it is required rather than optional because it is
 * what the retrieval index anchors a citation to: `site/blocks.tsx` renders it as the
 * element id, so `/work#experience` lands the reader on the paragraph the agent quoted.
 * Optional would make an un-anchorable chunk representable, and all 25 chunks of the
 * index that preceded this had `anchor` undefined for exactly that reason.
 */
type BlockId = { id: string };

export type ContentBlock =
  | ({ kind: "lede"; text: string } & BlockId)
  | ({ kind: "prose"; paragraphs: readonly string[] } & BlockId)
  | ({ kind: "list"; title?: string; items: readonly string[] } & BlockId)
  | ({
      kind: "stats";
      items: readonly { label: string; value: string; hint?: string }[];
    } & BlockId)
  | ({
      kind: "cards";
      items: readonly { title: string; meta?: string; body: string }[];
    } & BlockId)
  | ({
      kind: "timeline";
      items: readonly {
        period: string;
        title: string;
        org?: string;
        points: readonly string[];
        tags?: readonly string[];
      }[];
    } & BlockId)
  | ({
      kind: "links";
      items: readonly ContentLink[];
    } & BlockId);

export type Destination = {
  slug: RouteKey;
  href: RoutePath;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  blocks: readonly ContentBlock[];
};
