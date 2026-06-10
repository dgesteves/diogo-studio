"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import type { SystemDiagramData } from "@/types/system-diagram";

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
