import type { ReactElement } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { BOOT_STEPS } from "../constants/boot";

type BootLogProps = {
  pct: number;
  ready: boolean;
};

export function BootLog({ pct, ready }: BootLogProps): ReactElement {
  const total = BOOT_STEPS.length;

  return (
    <ul
      aria-hidden="true"
      className="w-full max-w-xs space-y-2 font-mono text-[10px] tracking-wide sm:text-[11px]"
    >
      {BOOT_STEPS.map((label, index) => {
        const done = ready || pct >= ((index + 1) / total) * 100;
        const active = !done && pct >= (index / total) * 100;

        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5 transition-colors duration-300",
              done ? "text-brand-cyan-bright" : active ? "text-white/90" : "text-white/45",
            )}
          >
            <span className="flex w-3 justify-center">
              {done ? (
                <Check className="size-3" />
              ) : (
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-current",
                    active && "bg-brand-cyan animate-pulse",
                  )}
                />
              )}
            </span>
            <span className="tabular text-[9px] opacity-50">
              {`0x${(index + 1).toString(16).toUpperCase().padStart(2, "0")}`}
            </span>
            <span className="flex-1 text-left">
              {label}
              {active && <span className="boot-caret text-brand-cyan ml-1">_</span>}
            </span>
            <span className="text-[9px] opacity-70">{done ? "OK" : active ? "··" : ""}</span>
          </li>
        );
      })}
    </ul>
  );
}
