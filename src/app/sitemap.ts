import type { MetadataRoute } from "next";
import { routes } from "@/constants/routes";
import { getSiteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  return Object.values(routes).map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === routes.home ? "weekly" : "monthly",
    priority: path === routes.home ? 1 : 0.7,
  }));
}
