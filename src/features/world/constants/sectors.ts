import type { Destination } from "../types";
import { coreDestinations } from "./destinations-core";
import { craftDestinations } from "./destinations-craft";
import { experienceDestinations } from "./destinations-experience";
import { explorationDestinations } from "./destinations-explorations";
import { projectDestinations } from "./destinations-projects";
import { reachDestinations } from "./destinations-reach";
import { stanceDestinations } from "./destinations-stance";
import { timelineDestinations } from "./destinations-timeline";
import { toolingDestinations } from "./destinations-tooling";

export type WorldSector = {
  label: string;
  destinations: readonly Destination[];
};

export const worldSectors: readonly WorldSector[] = [
  { label: "Core", destinations: coreDestinations },
  { label: "Experience", destinations: experienceDestinations },
  { label: "Projects", destinations: projectDestinations },
  { label: "Craft", destinations: craftDestinations },
  { label: "Stance", destinations: stanceDestinations },
  { label: "Tooling", destinations: toolingDestinations },
  { label: "Explorations", destinations: explorationDestinations },
  { label: "Reach", destinations: reachDestinations },
  { label: "Timeline", destinations: timelineDestinations },
];
