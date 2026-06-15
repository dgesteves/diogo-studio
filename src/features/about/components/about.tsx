import type { ReactElement } from "react";
import { siteConfig } from "@/config/site";

import { PixelatedPortrait } from "./pixelated-portrait";

const PORTRAIT = {
  src: "/images/diogo-esteves.png",
  alt: `Pixelated portrait of ${siteConfig.name}`,
} as const;

export function About(): ReactElement {
  return (
    <section
      role="region"
      aria-labelledby="about-heading"
      className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />

      <h1 id="about-heading" className="sr-only">
        {siteConfig.name}
      </h1>

      <PixelatedPortrait
        src={PORTRAIT.src}
        alt={PORTRAIT.alt}
        className="relative w-64 sm:w-80 lg:w-96"
      />
    </section>
  );
}
