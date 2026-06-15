import type { ReactElement } from "react";
import { HeroSection } from "./hero-section";

export function Home(): ReactElement {
  return (
    <section
      aria-labelledby="hero-heading"
      className="pointer-events-none relative z-10 flex min-h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8"
    >
      <HeroSection />
    </section>
  );
}
