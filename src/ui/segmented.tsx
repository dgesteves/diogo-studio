"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "./cn";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  Icon: LucideIcon;
};

type SegmentedProps<T extends string> = {
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T | undefined;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>): ReactElement {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1">
      {options.map(({ value: optionValue, label: optionLabel, Icon }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              "focus-visible:ring-brand-cyan focus-visible:ring-offset-brand-ink relative inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-[10px] tracking-widest uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              selected
                ? "text-brand-cyan-bright [text-shadow:0_0_10px_var(--brand-cyan)]"
                : "text-white/40 hover:text-white/75",
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
            {optionLabel}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-1.5 bottom-0 h-px transition-opacity",
                selected
                  ? "bg-brand-cyan opacity-100 shadow-[0_0_8px_var(--brand-cyan)]"
                  : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
