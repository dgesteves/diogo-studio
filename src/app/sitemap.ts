import type { MetadataRoute } from "next";
import { caseStudies, essays } from "#content";
import { getSiteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/work`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${baseUrl}/writing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/colophon`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    { url: `${baseUrl}/uses`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  const caseStudyRoutes: MetadataRoute.Sitemap = caseStudies
    .filter((s) => !s.draft)
    .map((study) => ({
      url: `${baseUrl}${study.permalink}`,
      lastModified: new Date(study.updatedAt ?? study.publishedAt),
      changeFrequency: "monthly",
      priority: 0.85,
    }));

  const essayRoutes: MetadataRoute.Sitemap = essays
    .filter((e) => !e.draft)
    .map((essay) => ({
      url: `${baseUrl}${essay.permalink}`,
      lastModified: new Date(essay.updatedAt ?? essay.publishedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...caseStudyRoutes, ...essayRoutes];
}
