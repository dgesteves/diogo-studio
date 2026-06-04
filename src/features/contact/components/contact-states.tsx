import type { ReactElement } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function ContactSuccess({ onReset }: { onReset: () => void }): ReactElement {
  return (
    <div
      role="status"
      className="border-signal-good/40 bg-signal-good/5 flex flex-col items-start gap-3 rounded-lg border p-6"
    >
      <div className="text-signal-good inline-flex items-center gap-2">
        <CheckCircle2 className="size-5" aria-hidden="true" />
        <span className="text-sm font-medium">Message received.</span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Thanks — it landed in my inbox and I&rsquo;ll reply directly. If it&rsquo;s urgent,{" "}
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          email me
        </a>
        .
      </p>
      <Button variant="outline" size="sm" onClick={onReset}>
        Send another
      </Button>
    </div>
  );
}

export function ContactFallback({ email }: { email: string }): ReactElement {
  return (
    <div
      role="status"
      className="border-signal-warn/40 bg-signal-warn/5 flex flex-col items-start gap-3 rounded-lg border p-6"
    >
      <p className="text-foreground text-sm font-medium">Email delivery isn&rsquo;t live here.</p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        This deployment doesn&rsquo;t have email configured. Reach me directly — fastest path
        anyway.
      </p>
      <Button asChild variant="accent" size="md">
        <a href={`mailto:${email}`}>
          <Mail className="size-4" aria-hidden="true" />
          <span>{email}</span>
        </a>
      </Button>
    </div>
  );
}
