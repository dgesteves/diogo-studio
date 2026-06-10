import { essayMetas } from "@/content/essays";
import { defineEssay } from "./define-article";

export type { Essay } from "./define-article";

export const essays = essayMetas.map(defineEssay);
