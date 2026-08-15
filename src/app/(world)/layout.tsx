import { type ReactElement, type ReactNode } from "react";
import { AudioProvider, WorldAudio } from "@/world/audio";
import { CommandDeck } from "@/world/hud/deck";
import { ExploreHud } from "@/world/hud/explore";
import { WorldStage } from "@/world/world";
import { BootSequence, BootSplash } from "@/world/boot";

export default function WorldLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <AudioProvider>
      <WorldStage />
      <BootSplash />
      {children}
      <ExploreHud />
      <CommandDeck />
      <WorldAudio />
      <BootSequence />
    </AudioProvider>
  );
}
