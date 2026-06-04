import type { ReactElement } from "react";
import type { Thing, WithContext } from "schema-dts";

/**
 * Renders a JSON-LD `<script>` for structured data. Server-only; the payload
 * is serialized at render time, never hydrated. `schema-dts` gives us
 * compile-time typing on the shapes (see `@/lib/structured-data`).
 *
 * JSON-LD is injected as a string via `dangerouslySetInnerHTML` because the
 * content is a controlled, build-time object — never user input.
 */
export function JsonLd<T extends Thing>({ data }: { data: WithContext<T> }): ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
