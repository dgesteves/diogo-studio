import { type ReactElement, type ReactNode } from "react";
import { WorldDock, WorldStage } from "@/features/world";

export default function MarketingLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <WorldStage />
      {children}
      <WorldDock />
    </>
  );
}
