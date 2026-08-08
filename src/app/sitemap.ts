import { cacheLife } from "next/cache";
import type { MetadataRoute } from "next";
import { routes } from "@/constants/routes";
import { getSiteUrl } from "@/config/site";

// `new Date()` is an uncached dynamic API under `cacheComponents`, which would drop
// this route out of static rendering. The content only changes on deploy, so cache
// it for the longest profile and let a new build produce a new timestamp.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("max");

  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  return Object.values(routes).map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === routes.home ? "weekly" : "monthly",
    priority: path === routes.home ? 1 : 0.7,
  }));
}
