import { drawCodeChannel } from "./code-channel";
import { drawGridChannel } from "./grid-channel";
import { drawWaveChannel } from "./wave-channel";

export type Channel = {
  name: string;
  draw: (ctx: CanvasRenderingContext2D, tick: number) => void;
};

export const CHANNELS: readonly Channel[] = [
  { name: "CH-01 \u00B7 GRID", draw: drawGridChannel },
  { name: "CH-02 \u00B7 LIVE CODE", draw: drawCodeChannel },
  { name: "CH-03 \u00B7 TELEMETRY", draw: drawWaveChannel },
];
