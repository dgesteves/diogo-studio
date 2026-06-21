"use client";

import { Volume2, VolumeX } from "lucide-react";
import type { ReactElement } from "react";
import { BootSegmented } from "./boot-segmented";

const OPTIONS = [
  { value: "on", label: "Sound", Icon: Volume2 },
  { value: "off", label: "Muted", Icon: VolumeX },
];

type BootSoundToggleProps = {
  soundOn: boolean;
  onChange: (soundOn: boolean) => void;
};

export function BootSoundToggle({ soundOn, onChange }: BootSoundToggleProps): ReactElement {
  return (
    <BootSegmented
      label="Sound preference"
      options={OPTIONS}
      value={soundOn ? "on" : "off"}
      onChange={(value) => onChange(value === "on")}
    />
  );
}
