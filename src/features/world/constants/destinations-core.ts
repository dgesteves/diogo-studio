import { getStationEntry } from "@/content/pages";
import { routes } from "@/content/pages";
import type { Destination } from "../types";

export const coreDestinations: readonly Destination[] = [
  {
    ...getStationEntry("home"),
    eyebrow: "Enter the studio",
    title: "Engineering the systems behind ambitious products.",
    summary:
      "Staff / Principal frontend & platform engineer. 11+ years shipping AI-native products, design-system infrastructure, and streaming platforms used by tens of millions.",
    blocks: [
      {
        kind: "lede",
        text: "This is the rig the work ships from — a living studio you can walk through. Every sign, screen, and surface is a door into the record: the work, the principles, the stack, the story.",
      },
      {
        kind: "stats",
        items: [
          { label: "Years shipping", value: "11+", hint: "frontend & platform" },
          { label: "Scale", value: "10M+", hint: "streaming subscribers" },
          { label: "Altitudes", value: "IC → VPE", hint: "last 18 months" },
        ],
      },
      {
        kind: "links",
        items: [
          { label: "See the work", href: routes.work },
          { label: "Read the case studies", href: routes.caseStudies },
          { label: "Inspect the stack", href: routes.stack },
          { label: "Get in touch", href: routes.contact },
        ],
      },
    ],
  },
  {
    ...getStationEntry("about"),
    eyebrow: "Background · philosophy",
    title: "The senior engineering voice on the surfaces users touch.",
    summary:
      "Background, leadership philosophy, and how Diogo Esteves works as a Staff/Principal frontend & platform engineer.",
    blocks: [
      {
        kind: "prose",
        paragraphs: [
          "I build the engineering systems behind ambitious products. For 11+ years I've been the senior engineering voice on platforms used by millions — streaming at Sky and Peacock, governance software at Diligent, innovation systems at BMW Group, and AI-native products at eino.ai, Moment, and Fueled.",
          "I've operated at both ends of the spectrum: founding-engineer altitude inside seed to Series B AI startups, and Staff / Lead altitude inside Fortune-class enterprises with strict reliability, accessibility, and compliance constraints.",
          "I'm most useful to teams where the frontend is the product — not a thin layer over an API — where AI is a first-class part of the experience, and where architectural taste, hiring leverage, and execution speed compound.",
        ],
      },
      {
        kind: "list",
        title: "What I actually do",
        items: [
          "Architect frontend platforms — design systems, monorepos, micro frontends, and developer experience that make product teams faster.",
          "Build AI-native product surfaces — agentic UX, RAG-backed flows, and the human-in-the-loop patterns that make LLMs feel like real software.",
          "Lead engineering organizations — hiring, leveling, technical strategy, and the operating system of a high-trust, async, shipping-oriented team.",
          "Translate business ambiguity into durable architecture, partnering directly with founders, CTOs, and product leadership.",
        ],
      },
      {
        kind: "list",
        title: "Beyond the code",
        items: [
          "Portuguese (native) · English (full professional).",
          "Computer Engineering at ISEL — after an LLB in Law.",
          "Meta Front-End Developer Professional Certificate.",
        ],
      },
    ],
  },
] as const;
