import { createElement } from "react";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

import { ContactNotification } from "@/features/contact/emails/contact-notification";
import { contactSchema } from "@/features/contact/schemas/contact";
import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { createRateLimiter } from "@/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 15;

const allow = createRateLimiter({ prefix: "contact-form", limit: 5, windowMs: 3_600_000 });

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...init?.headers },
  });
}

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const { name, email, company, roleAltitude, message, company_url } = parsed.data;

  if (company_url) {
    return json({ ok: true });
  }

  if (!(await allow(req))) {
    return json(
      { error: "Too many submissions. Try again in a bit, or email me directly." },
      { status: 429 },
    );
  }

  if (!env.RESEND_API_KEY) {
    return json(
      {
        error: "Email delivery isn't configured on this deployment.",
        fallback: true,
        email: siteConfig.email,
      },
      { status: 503 },
    );
  }

  const to = env.CONTACT_TO_EMAIL ?? siteConfig.email;
  const resend = new Resend(env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      replyTo: email,
      subject: `Inbound · ${name}${company ? ` · ${company}` : ""}`,
      react: createElement(ContactNotification, {
        name,
        email,
        company,
        roleAltitude,
        message,
        receivedAt: new Date().toUTCString(),
      }),
    });

    if (error) {
      Sentry.captureException(new Error(`Resend send failed: ${error.message}`), {
        tags: { route: "api/contact" },
      });
      return json({ error: "Couldn't send right now. Please email me directly." }, { status: 502 });
    }

    return json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/contact" } });
    return json({ error: "Couldn't send right now. Please email me directly." }, { status: 502 });
  }
}
