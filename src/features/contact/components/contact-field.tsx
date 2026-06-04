import type { ReactElement, ReactNode } from "react";

export const fieldBase =
  "w-full rounded-md border bg-surface-inset px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, required, children }: FieldProps): ReactElement {
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
