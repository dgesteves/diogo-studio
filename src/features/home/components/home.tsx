import type { ReactElement } from "react";
import { HeroSection } from "./hero-section";
import { OperatingSection } from "./operating-section";
import { StudioSection } from "./studio-section";
import { TrustSection } from "./trust-section";

export function Home(): ReactElement {
  return (
    <>
      <HeroSection />
      <OperatingSection />
      <StudioSection />
      <TrustSection />
    </>
  );
}
