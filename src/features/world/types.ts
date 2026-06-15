import type { RouteKey, RoutePath } from "@/constants/routes";

export type Vec3 = readonly [number, number, number];

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
      items: readonly { label: string; href: string; external?: boolean }[];
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

export type WorldObjectKind =
  | "monitor-left"
  | "monitor-center"
  | "monitor-right"
  | "neon-sign"
  | "bookshelf"
  | "server-rack"
  | "speaker-stack"
  | "plant"
  | "coffee"
  | "door"
  | "poster"
  | "whiteboard"
  | "arcade"
  | "frame";

export type WorldStation = {
  slug: RouteKey;
  neon: string;
  accent: string;
  position: Vec3;
  target: Vec3;
  anchor: Vec3;
  object: WorldObjectKind;
};
