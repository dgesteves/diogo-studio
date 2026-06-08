"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { contactDefaults, contactSchema, type ContactInput } from "../schemas/contact";
import { siteConfig } from "@/config/site";

import { ContactFields } from "./contact-form-fields";
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
        body = {};
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

      <ContactFields register={register} errors={errors} />

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
