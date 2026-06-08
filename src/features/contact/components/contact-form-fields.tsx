import type { ReactElement } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { ROLE_ALTITUDES, type ContactInput } from "../schemas/contact";
import { cn } from "@/lib/utils/cn";

import { Field, fieldBase } from "./contact-field";

export function ContactFields({
  register,
  errors,
}: {
  register: UseFormRegister<ContactInput>;
  errors: FieldErrors<ContactInput>;
}): ReactElement {
  return (
    <>
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
    </>
  );
}
