import type { ReactElement } from "react";
import { cn } from "@/utils/cn";

const CORNER = "border-brand-cyan/30 absolute size-5";
const LABEL = "text-brand-cyan/40 absolute font-mono text-[9px] tracking-[0.3em] uppercase";

export function BootHud(): ReactElement {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      <span className={cn(CORNER, "top-5 left-5 border-t border-l")} />
      <span className={cn(CORNER, "top-5 right-5 border-t border-r")} />
      <span className={cn(CORNER, "bottom-5 left-5 border-b border-l")} />
      <span className={cn(CORNER, "right-5 bottom-5 border-r border-b")} />
      <span className={cn(LABEL, "top-6 left-14")}>SYS · BOOT</span>
      <span className={cn(LABEL, "top-6 right-14")}>RENDER · WEBGL2</span>
      <span className={cn(LABEL, "bottom-6 left-14")}>NODE · LISBON</span>
      <span className={cn(LABEL, "right-14 bottom-6")}>38.7°N · 9.1°W</span>
    </div>
  );
}
