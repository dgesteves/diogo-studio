import { caseStudyBodies } from "@/content/case-studies/bodies";
import { essayBodies } from "@/content/essays/bodies";
import { caseStudies } from "@/lib/content/case-studies";
import { essays } from "@/lib/content/essays";

import { bodySections } from "./article-walker";
import { buildArticleChunks } from "./chunker";
import type { IndexEntry } from "./types";

export function caseStudyChunks(): IndexEntry[] {
  return [...caseStudies]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .flatMap((study) =>
      buildArticleChunks({
        kind: "case-study",
        slug: study.slug,
        permalink: study.permalink,
        sourceTitle: study.title,
        description: study.description,
        tags: [...study.patterns],
        sections: sectionsFor(caseStudyBodies[study.slug]),
      }),
    );
}

function sectionsFor(Body: Parameters<typeof bodySections>[0] | undefined) {
  return Body ? bodySections(Body) : [];
}

export function essayChunks(): IndexEntry[] {
  return [...essays]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .flatMap((essay) =>
      buildArticleChunks({
        kind: "essay",
        slug: essay.slug,
        permalink: essay.permalink,
        sourceTitle: essay.title,
        description: essay.description,
        tags: [...essay.patterns],
        sections: sectionsFor(essayBodies[essay.slug]),
      }),
    );
}
