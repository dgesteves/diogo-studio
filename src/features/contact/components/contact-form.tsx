"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  contactDefaults,
  contactSchema,
  ROLE_ALTITUDES,
  type ContactInput,
} from "../schemas/contact";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

/**
 * Branded contact form — Phase 5.
 *
 * Client-side validation via `react-hook-form` + the shared `contactSchema`
 * (same schema the API route enforces). On submit it POSTs JSON to
 * `/api/contact`. The route degrades gracefully: a 503 `{ fallback: true }`
 * (no Resend key) flips the form into a "email me directly" state instead of
 * showing an error, so the surface is always useful.
 */

type FormState = { kind: "idle" } | { kind: "success" } | { kind: "fallback"; email: string };

const fieldBase =
  "w-full rounded-md border bg-surface-inset px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ContactForm(): ReactElement {
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: contactDefaults,
    mode: "onBlur",
  });

  async function onSubmit(values: ContactInput) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        setState({ kind: "success" });
        reset(contactDefaults);
        toast.success("Message sent. I'll reply soon.");
        return;
      }

      let body: { error?: string; fallback?: boolean; email?: string } = {};
      try {
        body = await res.json();
      } catch {
        /* non-JSON error body — fall through to generic copy */
      }

      if (res.status === 503 && body.fallback) {
        setState({ kind: "fallback", email: body.email ?? siteConfig.email });
        return;
      }

      toast.error(body.error ?? "Something went wrong. Please try again.");
    } catch {
      toast.error("Network error. Check your connection and try again.");
    }
  }

  if (state.kind === "success") {
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
        <Button variant="outline" size="sm" onClick={() => setState({ kind: "idle" })}>
          Send another
        </Button>
      </div>
    );
  }

  if (state.kind === "fallback") {
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
          <a href={`mailto:${state.email}`}>
            <Mail className="size-4" aria-hidden="true" />
            <span>{state.email}</span>
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* Honeypot — hidden from humans, catnip for bots. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="company_url">Leave this field empty</label>
        <input
          id="company_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company_url")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name?.message} required>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Rivera"
            aria-invalid={!!errors.name}
            className={cn(fieldBase, errors.name ? "border-signal-hot" : "border-border")}
            {...register("name")}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jane@company.com"
            aria-invalid={!!errors.email}
            className={cn(fieldBase, errors.email ? "border-signal-hot" : "border-border")}
            {...register("email")}
          />
        </Field>

        <Field label="Company" htmlFor="company" error={errors.company?.message}>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            placeholder="Optional"
            aria-invalid={!!errors.company}
            className={cn(fieldBase, errors.company ? "border-signal-hot" : "border-border")}
            {...register("company")}
          />
        </Field>

        <Field label="You are" htmlFor="roleAltitude" error={errors.roleAltitude?.message}>
          <select
            id="roleAltitude"
            defaultValue=""
            className={cn(fieldBase, "border-border appearance-none")}
            {...register("roleAltitude")}
          >
            <option value="" disabled>
              Select context…
            </option>
            {ROLE_ALTITUDES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Message" htmlFor="message" error={errors.message?.message} required>
        <textarea
          id="message"
          rows={6}
          placeholder="The system you're building, the role altitude, and one decision you're wrestling with."
          aria-invalid={!!errors.message}
          className={cn(
            fieldBase,
            "resize-y",
            errors.message ? "border-signal-hot" : "border-border",
          )}
          {...register("message")}
        />
      </Field>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="accent" size="md" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Sending…</span>
            </>
          ) : (
            <>
              <span>Send message</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
        <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
          Rate-limited · no tracking
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-muted-foreground inline-flex items-center gap-1 font-mono text-[10px] font-medium tracking-wider uppercase"
      >
        {label}
        {required ? (
          <span className="text-signal-hot" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-signal-hot text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
