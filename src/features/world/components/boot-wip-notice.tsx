import type { ReactElement } from "react";
import { Construction } from "lucide-react";
import { BOOT_WIP_BADGE, BOOT_WIP_MESSAGE } from "../constants/boot";

export function BootWipNotice(): ReactElement {
  return (
    <div
      role="note"
      className="border-brand-magenta/35 bg-brand-ink/60 w-full max-w-xs border px-4 py-3 shadow-[0_0_20px_color-mix(in_srgb,var(--brand-magenta)_12%,transparent)] backdrop-blur-sm sm:max-w-sm"
    >
      <p className="text-brand-magenta flex items-center justify-center gap-2 font-mono text-[9px] font-semibold tracking-[0.32em] uppercase sm:text-[10px]">
        <Construction aria-hidden="true" className="size-3.5" />
        {BOOT_WIP_BADGE}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/60 sm:text-xs">
        {BOOT_WIP_MESSAGE}
      </p>
    </div>
  );
}
