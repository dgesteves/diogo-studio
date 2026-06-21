"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/utils/cn";

type BootSegmentedOption<T extends string> = {
  value: T;
  label: string;
  Icon: LucideIcon;
};

type BootSegmentedProps<T extends string> = {
  label: string;
  options: ReadonlyArray<BootSegmentedOption<T>>;
  value: T | undefined;
  onChange: (value: T) => void;
};

export function BootSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: BootSegmentedProps<T>): ReactElement {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-brand-ink/80 inline-flex items-center gap-1 rounded-full border border-white/15 p-1 shadow-[0_2px_28px_rgba(0,0,0,0.55)] backdrop-blur-md"
    >
      {options.map(({ value: optionValue, label: optionLabel, Icon }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              "focus-visible:ring-brand-cyan focus-visible:ring-offset-brand-ink inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              selected ? "bg-brand-cyan text-brand-ink" : "text-white/55 hover:text-white",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
