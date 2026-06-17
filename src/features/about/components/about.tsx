import type { ReactElement } from "react";
import { siteConfig } from "@/config/site";
import { DestinationView } from "@/features/world";

import { PixelatedPortrait } from "./pixelated-portrait";

const PORTRAIT = {
  src: "/images/diogo-esteves.png",
  alt: `Pixelated portrait of ${siteConfig.name}`,
} as const;

export function About(): ReactElement {
  return (
    <DestinationView
      slug="about"
      media={<PixelatedPortrait src={PORTRAIT.src} alt={PORTRAIT.alt} className="w-40 sm:w-48" />}
    />
  );
}
