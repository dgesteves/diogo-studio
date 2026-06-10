import { essayMetas } from "@/features/writing/content";
import { defineEssay } from "@/lib/content/define-article";

export type { Essay } from "@/lib/content/define-article";

export const essays = essayMetas.map(defineEssay);
