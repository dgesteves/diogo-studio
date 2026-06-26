import type { ReactElement } from "react";

export function BootBackdrop(): ReactElement {
  return (
    <div aria-hidden="true" className="boot-scene absolute inset-0 overflow-hidden">
      <div className="scene-aurora absolute inset-x-0 top-0 h-[58%]" />
      <div className="boot-sun absolute top-[12%] left-1/2 size-[min(76vw,440px)] -translate-x-1/2 rounded-full">
        <div className="boot-sun-grilles absolute inset-0 rounded-full" />
      </div>
      <div className="scene-grid absolute inset-x-[-50%] bottom-[-35vh] h-[260vh]" />
      <div className="scene-horizon absolute inset-x-0 bottom-[42%] h-px" />
      <div className="boot-scan-beam absolute inset-x-0 top-0 h-40" />
      <div className="boot-motes absolute inset-0 opacity-40" />
      <div className="boot-readability absolute inset-0" />
      <div className="scene-scanlines absolute inset-0 opacity-50" />
      <div className="boot-crt absolute inset-0" />
      <div className="scene-vignette absolute inset-0" />
    </div>
  );
}
