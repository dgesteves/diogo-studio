import { getStationEntry, routes } from "../pages";
import type { Destination } from "../schema";

export const resume: Destination = {
  ...getStationEntry("resume"),
  eyebrow: "The full record",
  title: "Staff / Principal Frontend & Platform Engineer.",
  summary:
    "Résumé of Diogo Esteves — AI-native systems, enterprise UI infrastructure, and scalable web architectures.",
  blocks: [
    {
      kind: "lede",
      text: "AI-native systems, enterprise UI infrastructure, scalable web architectures. Targeting Staff+, Principal, or Founding Engineer roles, and VP / Head of Engineering mandates at AI-native companies.",
    },
    {
      kind: "stats",
      items: [
        { label: "Experience", value: "11+ yrs", hint: "Deloitte → Fueled" },
        { label: "Companies", value: "8", hint: "startup → Fortune-class" },
        { label: "Base", value: "Lisbon", hint: "Remote · US-aligned" },
      ],
    },
    {
      kind: "list",
      title: "Credentials",
      items: [
        "Computer Engineering — ISEL, Lisbon.",
        "LLB in Law — Universidade Lusófona.",
        "Meta Front-End Developer Professional Certificate.",
      ],
    },
    {
      kind: "links",
      items: [
        { label: "Selected experience", href: routes.work },
        { label: "Technical stack", href: routes.stack },
        { label: "Full timeline", href: routes.timeline },
        { label: "Contact", href: routes.contact },
      ],
    },
  ],
};
