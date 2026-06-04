import type { ReactElement } from "react";
import { HeroSection } from "./hero-section";
import { OperatingSection } from "./operating-section";
import { StudioSection } from "./studio-section";
import { TrustSection } from "./trust-section";

/**
 * Home page — Phase 2 introduces the 3D Career Graph as the signature hero
 * surface. The hero is split into two columns on `lg+`: typographic intro on
 * the left, Career Graph on the right. Below `lg`, the graph stacks under
 * the type for breathing room.
 *
 * Server Component — only the `CareerGraph` and `HeroAskCta` are client
 * islands. The SVG inside the graph is server-rendered to drive LCP.
 *
 * Sections:
 * 1. Hero — status + headline + subhead + CTAs + pattern strip + 3D graph.
 * 2. Operating modes — three altitudes within the last 18 months.
 * 3. Trust strip — operating companies, mono small caps.
 */
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
