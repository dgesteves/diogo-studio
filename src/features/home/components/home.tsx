import type { ReactElement } from "react";
import { HeroSection } from "./hero-section";

export function Home(): ReactElement {
  return (
    <div className="sr-only">
      <HeroSection />
    </div>
  );
}
