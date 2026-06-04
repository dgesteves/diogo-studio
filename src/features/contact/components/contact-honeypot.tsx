import type { ReactElement } from "react";
import type { UseFormRegister } from "react-hook-form";

import type { ContactInput } from "../schemas/contact";

export function ContactHoneypot({
  register,
}: {
  register: UseFormRegister<ContactInput>;
}): ReactElement {
  return (
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
  );
}
