import "server-only";
import { createElement } from "react";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

import { ContactNotification } from "@/features/contact/emails/contact-notification";
import type { ContactInput } from "@/features/contact/schemas/contact";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";

type ContactDeliveryResult = { status: "sent" } | { status: "unconfigured" } | { status: "failed" };

const SENTRY_TAGS = { route: "api/contact" } as const;

export async function sendContactNotification(input: ContactInput): Promise<ContactDeliveryResult> {
  if (!env.RESEND_API_KEY) {
    return { status: "unconfigured" };
  }

  const { name, email, company, roleAltitude, message } = input;
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
        tags: SENTRY_TAGS,
      });
      return { status: "failed" };
    }

    return { status: "sent" };
  } catch (err) {
    Sentry.captureException(err, { tags: SENTRY_TAGS });
    return { status: "failed" };
  }
}
