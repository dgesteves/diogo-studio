import type { ReactElement } from "react";
import { cn } from "@/utils/cn";

type NeonGridSceneProps = {
  className?: string;
};

export function NeonGridScene({ className }: NeonGridSceneProps): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-brand-ink absolute inset-0 overflow-hidden", className)}
    >
      <div className="scene-aurora absolute inset-x-0 top-0 h-[60%]" />
      <div className="scene-grid absolute inset-x-[-50%] bottom-[-35vh] h-[260vh]" />
      <div className="scene-horizon absolute inset-x-0 bottom-[42%] h-px" />
      <div className="scene-scanlines absolute inset-0 opacity-50" />
      <div className="scene-vignette absolute inset-0" />
    </div>
  );
}
