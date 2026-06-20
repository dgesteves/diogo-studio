import { type ReactElement, type ReactNode } from "react";
import { AudioProvider, AudioToggle, WorldAudio } from "@/features/audio";
import { BootSequence, WorldDock, WorldStage } from "@/features/world";

export default function MarketingLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <AudioProvider>
      <WorldStage />
      {children}
      <WorldDock />
      <AudioToggle />
      <WorldAudio />
      <BootSequence />
    </AudioProvider>
  );
}
