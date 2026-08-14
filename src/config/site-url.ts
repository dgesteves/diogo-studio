import { env } from "@/config/env";

const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeUrl(value: string): string {
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const candidate = env.NEXT_PUBLIC_APP_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;

  return candidate ? normalizeUrl(candidate) : DEFAULT_SITE_URL;
}
