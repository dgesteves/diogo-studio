import type { ReactElement } from "react";
import { MetricGrid, MetricTile } from "@/components/article/metric-tile";
import { Sparkline } from "@/components/article/sparkline";
import { StackList } from "@/components/article/stack-list";

export function Intro(): ReactElement {
  return (
    <>
      <p>
        The honest framing of this one: I was not a system architect at Peacock. I was a senior
        engineer on web surfaces during a period when “don’t be the reason it broke” mattered more
        than “ship the clever idea.” The case study is about the working habits that produced
        quietly reliable code at that scale.
      </p>
      <p>
        If you’re hiring me for streaming-grade work, this is the engagement where I learned what
        the words <em>streaming-grade</em> actually mean.
      </p>
      <MetricGrid>
        <MetricTile
          label="Concurrent sessions"
          value="Peak"
          unit="live events"
          tone="hot"
          hint="NFL Sunday + marquee Olympic moments stress every surface, not just the player."
        >
          <Sparkline
            values={[20, 22, 26, 35, 60, 95, 88, 70, 52, 38, 28, 22]}
            tone="hot"
            ariaLabel="Concurrent session spikes"
          />
        </MetricTile>
        <MetricTile
          label="Web TTI"
          value="< 3s"
          unit="median"
          tone="good"
          hint="Performance budgets on the auth, landing, and account surfaces — measured continuously."
        >
          <Sparkline
            values={[44, 42, 39, 38, 36, 34, 32, 31, 30, 29, 28, 28]}
            tone="good"
            ariaLabel="TTI trend over time"
          />
        </MetricTile>
        <MetricTile
          label="Rollback distance"
          value="Single"
          unit="commit"
          tone="accent"
          hint="Every change had to be revertable without redeploying upstream services."
        />
        <MetricTile
          label="On-call posture"
          value="Rehearsed"
          unit="for events"
          tone="warn"
          hint="Pre-event runbooks; during-event eyes-on; post-event retros."
        />
      </MetricGrid>
      <StackList
        label="Stack"
        items={[
          "React",
          "TypeScript",
          "Redux",
          "RxJS",
          "Node BFFs",
          "Splunk",
          "Datadog",
          "Feature flags + canary",
        ]}
      />
    </>
  );
}
