import { type ReactElement, type ReactNode } from "react";
import { AudioProvider, WorldAudio } from "@/features/audio";
import { CommandDeck, ExploreHud, WorldStage } from "@/features/world";
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
