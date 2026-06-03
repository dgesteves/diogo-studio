import { z } from "zod";

/**
 * Single source of truth for the contact form contract.
 *
 * Imported by both the client form (`react-hook-form` + `@hookform/resolvers`)
 * and the server route (`/api/contact`), so validation can never drift between
 * the two sides. Keep this file dependency-free beyond `zod` so it stays
 * importable from any runtime.
 */

/** Role altitudes the visitor can self-select — mirrors the home/contact copy. */
export const ROLE_ALTITUDES = [
  "Staff / Principal IC",
  "Founding Engineer",
  "VP / Head of Engineering",
  "Recruiter / Talent",
  "Peer / Just saying hi",
  "Other",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tell me who you are (2+ characters).")
    .max(100, "That name is suspiciously long (100 char max)."),
  email: z.string().trim().email("That doesn't look like a valid email."),
  company: z
    .string()
    .trim()
    .max(120, "Company name is too long (120 char max).")
    .optional()
    .or(z.literal("")),
  roleAltitude: z.enum(ROLE_ALTITUDES).optional(),
  message: z
    .string()
    .trim()
    .min(20, "A little more context helps — 20+ characters.")
    .max(4000, "That's a lot — keep it under 4000 characters."),
  /**
   * Honeypot. Hidden from humans via CSS + aria-hidden; bots fill every field
   * they can see in the DOM. A non-empty value means "almost certainly a bot",
   * and the route silently 200s without sending.
   */
  company_url: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** The empty form state — keeps `react-hook-form` defaultValues honest. */
export const contactDefaults: ContactInput = {
  name: "",
  email: "",
  company: "",
  roleAltitude: undefined,
  message: "",
  company_url: "",
};
