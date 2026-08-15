import "server-only";

import { getStationEntry, routes } from "../pages";
import type { Destination } from "../schema";

export const home: Destination = {
  ...getStationEntry("home"),
  eyebrow: "Enter the studio",
  title: "Engineering the systems behind ambitious products.",
  summary:
    "Staff / Principal frontend & platform engineer. 11+ years shipping AI-native products, design-system infrastructure, and streaming platforms used by tens of millions.",
  blocks: [
    {
      id: "welcome",
      kind: "lede",
      text: "This is the rig the work ships from — a living studio you can walk through. Every sign, screen, and surface is a door into the record: the work, the principles, the stack, the story.",
    },
    {
      id: "at-a-glance",
      kind: "stats",
      items: [
        { label: "Years shipping", value: "11+", hint: "frontend & platform" },
        { label: "Scale", value: "10M+", hint: "streaming subscribers" },
        { label: "Altitudes", value: "IC → VPE", hint: "last 18 months" },
      ],
    },
    {
      id: "start-here",
      kind: "links",
      items: [
        { label: "See the work", href: routes.work },
        { label: "Read the case studies", href: routes.caseStudies },
        { label: "Inspect the stack", href: routes.stack },
        { label: "Get in touch", href: routes.contact },
      ],
    },
  ],
};
