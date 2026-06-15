import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const coreDestinations: readonly Destination[] = [
  {
    slug: "home",
    href: routes.home,
    label: "Studio",
    eyebrow: "Enter the studio",
    title: "Engineering the systems behind ambitious products.",
    summary:
      "Staff / Principal frontend & platform engineer. 11+ years shipping AI-native interfaces, design-system infrastructure, and streaming-grade platforms.",
    blocks: [
      {
        kind: "lede",
        text: "This is the rig the work ships from — a living studio you can walk through. Pick a surface, a sign, or a screen to explore the work, the principles, and the stack behind it.",
      },
      {
        kind: "stats",
        items: [
          { label: "Years shipping", value: "11+", hint: "frontend & platform" },
          { label: "Scale", value: "M+ users", hint: "Peacock · streaming" },
          { label: "Altitudes", value: "IC → VPE", hint: "last 18 months" },
        ],
      },
      {
        kind: "links",
        items: [
          { label: "See the work", href: routes.work },
          { label: "Read the principles", href: routes.principles },
          { label: "Inspect the stack", href: routes.stack },
          { label: "Get in touch", href: routes.contact },
        ],
      },
    ],
  },
  {
    slug: "about",
    href: routes.about,
    label: "About",
    eyebrow: "Background · philosophy",
    title: "The senior engineering voice on the surfaces users touch.",
    summary:
      "Background, leadership philosophy, and how Diogo Esteves works as a Staff/Principal frontend & platform engineer.",
    blocks: [
      {
        kind: "prose",
        paragraphs: [
          "I build the engineering systems behind ambitious products. Over 11+ years I've shipped frontend platforms and AI-native interfaces across very different scales — NBCUniversal's Peacock, BMW Group's innovation programs, Diligent's governance software, eino.ai's agentic network-planning platform, plus Moment, Superglue, Deloitte, and Fueled.",
          "The pattern across all of it: I'm the senior engineering voice on the surfaces users actually touch, plus the infrastructure underneath them. Design systems that survive multiple product lines. Monorepos that keep ten teams unblocked. AI workflows that hold up in production, not just in demos.",
          "I'm equally comfortable as a Staff IC inside a large engineering org and as a founding engineer or VP of Engineering inside a fast-moving AI startup. I've done both in the last eighteen months.",
        ],
      },
      {
        kind: "list",
        title: "How I work",
        items: [
          "Turn product ambiguity into composable, evolvable architectures.",
          "Set the hiring bar, leveling, and technical strategy.",
          "Lead with RFC culture and tight product/design/executive partnership.",
          "Treat accessibility, performance, and release safety as requirements, not polish.",
        ],
      },
    ],
  },
] as const;
