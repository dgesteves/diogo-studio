"use client";

import { Activity, EyeOff } from "lucide-react";
import type { ReactElement } from "react";
import { BootSegmented } from "./boot-segmented";

const OPTIONS = [
  { value: "on", label: "Inspector", Icon: Activity },
  { value: "off", label: "Hidden", Icon: EyeOff },
];

type BootInspectorToggleProps = {
  inspectorOn: boolean;
  onChange: (inspectorOn: boolean) => void;
};

export function BootInspectorToggle({
  inspectorOn,
  onChange,
}: BootInspectorToggleProps): ReactElement {
  return (
    <BootSegmented
      label="Inspector preference"
      options={OPTIONS}
      value={inspectorOn ? "on" : "off"}
      onChange={(value) => onChange(value === "on")}
    />
  );
}
