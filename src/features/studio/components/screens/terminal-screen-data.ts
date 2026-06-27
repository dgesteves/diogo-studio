import { siteConfig } from "@/config/site";

export type StatusRow = { label: string; value: string };

export const STATUS_ROWS: readonly StatusRow[] = [
  { label: "status", value: siteConfig.availability.toLowerCase() },
  { label: "role", value: siteConfig.role.toLowerCase() },
  { label: "based", value: siteConfig.location.toLowerCase() },
];

export const FOCUS_POOL: readonly string[] = siteConfig.knowsAbout.map((item) =>
  item.toLowerCase(),
);
