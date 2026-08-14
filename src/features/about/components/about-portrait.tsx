import type { ReactElement } from "react";
import { siteConfig } from "@/content/profile";

import { PixelatedPortrait } from "./pixelated-portrait";

const PORTRAIT = {
  src: "/images/diogo-esteves.png",
  alt: `Pixelated portrait of ${siteConfig.name}`,
} as const;

export function AboutPortrait(): ReactElement {
  return <PixelatedPortrait src={PORTRAIT.src} alt={PORTRAIT.alt} className="w-40 sm:w-48" />;
}
