import { contactSchema } from "@/features/contact/schemas/contact";
import { siteConfig } from "@/config/site";
import { createRateLimiter } from "@/lib/rate-limit";
import { sendContactNotification } from "@/lib/email/send-contact-notification";

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

  if (parsed.data.company_url) {
    return json({ ok: true });
  }

  if (!(await allow(req))) {
    return json(
      { error: "Too many submissions. Try again in a bit, or email me directly." },
      { status: 429 },
    );
  }

  const result = await sendContactNotification(parsed.data);

  if (result.status === "unconfigured") {
    return json(
      {
        error: "Email delivery isn't configured on this deployment.",
        fallback: true,
        email: siteConfig.email,
      },
      { status: 503 },
    );
  }

  if (result.status === "failed") {
    return json({ error: "Couldn't send right now. Please email me directly." }, { status: 502 });
  }

  return json({ ok: true });
}
