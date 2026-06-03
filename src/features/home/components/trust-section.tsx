import { operatingCompanies } from "@/config/site";

export function TrustSection() {
  return (
    <section role="region" aria-labelledby="trust-heading" className="border-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2
          id="trust-heading"
          className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase"
        >
          Selected engagements
        </h2>
        <ul className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {operatingCompanies.map((company, idx) => (
            <li key={company} className="flex items-center gap-6">
              <span className="tabular text-foreground/90">{company}</span>
              {idx < operatingCompanies.length - 1 ? (
                <span aria-hidden="true" className="text-subtle-foreground">
                  ·
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
