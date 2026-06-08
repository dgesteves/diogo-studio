import type { ReactElement } from "react";
import { aboutCommunity, aboutEducation, aboutPrinciples } from "@/content/data/about";

import { SectionLabel } from "./about-section";

export function PrinciplesSection(): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <SectionLabel>How I work</SectionLabel>
      <div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
        {aboutPrinciples.map((p) => (
          <div key={p.title} className="bg-surface flex flex-col gap-2 p-5">
            <h3 className="text-foreground text-sm font-medium tracking-tight">{p.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommunitySection(): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <SectionLabel>Beyond the org</SectionLabel>
      <div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
        {aboutCommunity.map((c) => (
          <div key={c.title} className="bg-surface flex flex-col gap-2 p-5">
            <h3 className="text-foreground text-sm font-medium tracking-tight">{c.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EducationSection(): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <SectionLabel>Education</SectionLabel>
      <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
        {aboutEducation.map((e) => (
          <div key={e.school} className="bg-surface flex flex-col gap-1.5 p-5">
            <dt className="text-foreground text-sm leading-snug font-medium">{e.school}</dt>
            <dd className="text-muted-foreground text-sm">
              {e.credential}
              <span className="text-subtle-foreground tabular ml-2 font-mono text-xs">
                {e.years}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
