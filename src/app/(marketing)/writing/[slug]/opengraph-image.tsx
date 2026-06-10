import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/og/og-template";
import { essays } from "@/lib/content/essays";

export const alt = "Essay — Diogo Esteves";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams(): { slug: string }[] {
  return essays.filter((e) => !e.draft).map((e) => ({ slug: e.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReturnType<typeof renderOgImage>> {
  const { slug } = await params;
  const essay = essays.find((e) => e.slug === slug);
  return renderOgImage({
    eyebrow: "Essay",
    title: essay?.title ?? "Essay",
    subtitle: essay?.dek ?? essay?.description,
  });
}
