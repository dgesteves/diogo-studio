import type { ReactElement } from "react";
import type { Thing, WithContext } from "schema-dts";

export function JsonLd<T extends Thing>({ data }: { data: WithContext<T> }): ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />
  );
}

/**
 * `JSON.stringify` leaves `<` alone, so a string containing `</script>` would close this
 * element and everything after it would be markup. Escaping it as `\u003c` is still the same
 * JSON to a parser, and it keeps the guarantee local instead of resting on every caller
 * passing authored data.
 */
function serialize<T extends Thing>(data: WithContext<T>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
