import Image from "next/image";
import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import { NeonGridScene } from "./neon-grid-scene";

type WorldFallbackProps = {
  className?: string;
  showPoster?: boolean;
};

export function WorldFallback({ className, showPoster = false }: WorldFallbackProps): ReactElement {
  return (
    <div aria-hidden="true" className={cn("relative h-full w-full overflow-hidden", className)}>
      <NeonGridScene />
      {showPoster ? (
        <Image src="/images/world-poster.png" alt="" fill sizes="100vw" className="object-cover" />
      ) : null}
    </div>
  );
}
