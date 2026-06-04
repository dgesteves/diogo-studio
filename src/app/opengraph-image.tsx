import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/og/og-template";

export const alt = "Diogo Esteves — Staff / Principal Frontend & Platform Engineer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image(): ReturnType<typeof renderOgImage> {
  return renderOgImage({
    eyebrow: "Portfolio",
    title: "Engineering systems behind ambitious products.",
    subtitle: "AI-native systems, enterprise UI infrastructure, scalable web architectures.",
  });
}
