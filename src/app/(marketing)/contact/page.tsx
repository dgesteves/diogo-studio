import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactChannels, ContactForm } from "@/features/contact";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out about Staff+, Principal, Founding Engineer, or VP / Head of Engineering roles.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage(): ReactElement {
  return (
    <section role="region" aria-labelledby="contact-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="text-muted-foreground border-border bg-surface inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
          <StatusDot tone="good" />
          <span>Open to senior engineering roles</span>
        </div>

        <h1
          id="contact-heading"
          className="text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight text-balance"
        >
          Tell me about the system you’re trying to build.
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
          Mention the role altitude (IC, Founding, VPE), the company stage, and one decision you’re
          wrestling with. I’ll respond with how I’d approach it.
        </p>

        <div className="w-full max-w-2xl">
          <ContactForm />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
            Or reach me directly
          </span>
          <span className="bg-border h-px flex-1" aria-hidden="true" />
        </div>

        <ContactChannels />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild variant="outline" size="md">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Back home</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
