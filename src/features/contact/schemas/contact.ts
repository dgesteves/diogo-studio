import { z } from "zod";

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
  company_url: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactDefaults: ContactInput = {
  name: "",
  email: "",
  company: "",
  roleAltitude: undefined,
  message: "",
  company_url: "",
};
