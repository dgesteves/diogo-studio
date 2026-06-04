"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
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

import { Field, fieldBase } from "./contact-field";
import { ContactHoneypot } from "./contact-honeypot";
import { ContactFallback, ContactSuccess } from "./contact-states";

type FormState = { kind: "idle" } | { kind: "success" } | { kind: "fallback"; email: string };

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
        // Non-JSON error body — fall through to generic copy.
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
    return <ContactSuccess onReset={() => setState({ kind: "idle" })} />;
  }

  if (state.kind === "fallback") {
    return <ContactFallback email={state.email} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <ContactHoneypot register={register} />

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
