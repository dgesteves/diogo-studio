import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/og/og-template";
import { caseStudies } from "@/lib/content/case-studies";

export const alt = "Case study — Diogo Esteves";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams(): { slug: string }[] {
  return caseStudies.filter((s) => !s.draft).map((s) => ({ slug: s.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReturnType<typeof renderOgImage>> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  return renderOgImage({
    eyebrow: study ? `Case study · ${study.company}` : "Case study",
    title: study?.title ?? "Case study",
    subtitle: study?.description,
  });
}
