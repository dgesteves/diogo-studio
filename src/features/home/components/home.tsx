import type { ReactElement } from "react";
import { HeroSection } from "./hero-section";

export function Home(): ReactElement {
  return (
    <>
      <div className="sr-only">
        <HeroSection />
      </div>
      <p className="text-subtle-foreground pointer-events-none fixed inset-x-0 top-20 z-10 px-4 text-center font-mono text-[10px] tracking-wider uppercase">
        Pick a sign in the studio — or use the dock — to explore
      </p>
    </>
  );
}
