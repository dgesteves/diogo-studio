import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { getSiteUrl } from "@/config/site";
import { caseStudies } from "@/lib/content/case-studies";
import { essays } from "@/lib/content/essays";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}${routes.home}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}${routes.work}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}${routes.writing}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}${routes.about}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}${routes.contact}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}${routes.colophon}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}${routes.uses}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
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
