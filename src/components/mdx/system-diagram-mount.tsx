"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import type { SystemDiagramData } from "./system-diagram-types";

/**
 * Client-only mount wrapper for `<SystemDiagramCanvas />`.
 *
 * `<SystemDiagram />` is a Server Component that owns the SVG fallback.
 * To bring in the xyflow canvas without bloating the server bundle, we
 * defer it via `next/dynamic({ ssr: false })` — but that helper is only
 * legal inside a Client Component. This file is the boundary.
 *
 * Two effects:
 * 1. xyflow + its CSS land in their own chunk (~80 KB gz), loaded only
 *    when the user actually scrolls a `<SystemDiagram />` into view on a
 *    JS-enabled session.
 * 2. The SVG fallback (rendered by the Server Component above) stays
 *    authoritative for LCP, no-JS, and reduced-motion users.
 */
const SystemDiagramCanvas = dynamic(
  () => import("./system-diagram-canvas").then((m) => m.SystemDiagramCanvas),
  { ssr: false, loading: () => null },
);

export function SystemDiagramMount({
  data,
  title,
}: {
  data: SystemDiagramData;
  title: string;
}): ReactElement {
  return <SystemDiagramCanvas data={data} title={title} />;
}
