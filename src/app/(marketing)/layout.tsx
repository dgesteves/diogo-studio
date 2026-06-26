import { type ReactElement, type ReactNode } from "react";
import { AudioProvider, WorldAudio } from "@/features/audio";
import { BootSequence, BootSplash, CommandDeck, WorldStage } from "@/features/world";

export default function MarketingLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <AudioProvider>
      <WorldStage />
      <BootSplash />
      {children}
      <CommandDeck />
      <WorldAudio />
      <BootSequence />
    </AudioProvider>
  );
}
