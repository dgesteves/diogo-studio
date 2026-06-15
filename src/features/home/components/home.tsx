import type { ReactElement } from "react";
import { HeroSection } from "./hero-section";
import { OperatingSection } from "./operating-section";
import { TrustSection } from "./trust-section";

export function Home(): ReactElement {
  return (
    <>
      <HeroSection />
      <div className="bg-background relative z-10">
        <OperatingSection />
        <TrustSection />
      </div>
    </>
  );
}
