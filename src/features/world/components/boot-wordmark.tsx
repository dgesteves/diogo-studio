import type { ReactElement } from "react";
import { siteConfig } from "@/config/site";
import { BOOT_ROLE_LINE } from "../constants/boot";

export function BootWordmark(): ReactElement {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-3">
      <p className="boot-neon boot-neon-in text-brand-cyan-bright font-mono text-xl font-semibold tracking-[0.3em] whitespace-nowrap uppercase sm:text-3xl sm:tracking-[0.34em]">
        {siteConfig.name}
      </p>
      <span className="bg-brand-cyan/60 h-px w-40 shadow-[0_0_14px_var(--brand-cyan)] sm:w-48" />
      <p className="text-brand-cyan/70 font-mono text-[9px] tracking-[0.42em] uppercase sm:text-[10px]">
        {BOOT_ROLE_LINE}
      </p>
    </div>
  );
}
