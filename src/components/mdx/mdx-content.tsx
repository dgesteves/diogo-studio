import type { ReactElement } from "react";
import * as runtime from "react/jsx-runtime";
import { mdxComponents, type MdxComponents } from "./components";

/**
 * MDX renderer — Server Component.
 *
 * Velite compiles each MDX document to a self-contained ES-module body
 * string. To render it on the server we evaluate that body once, hand it
 * the React 19 `jsx-runtime`, and pull out its default export.
 *
 * Why `new Function` is safe here:
 * - The MDX code is authored and committed by us; it isn't user-supplied.
 * - It's evaluated only on the server during static rendering.
 * - The output produces zero client JS — Next streams pre-rendered HTML.
 *
 * This is the canonical velite + Next App Router integration; see
 * https://velite.js.org/guide/with-nextjs.
 */

const compiledCache = new Map<string, MDXModule>();

type MDXModule = {
  default: React.ComponentType<{ components?: Partial<MdxComponents> }>;
};

function getMDXComponent(code: string): MDXModule["default"] {
  const cached = compiledCache.get(code);
  if (cached) return cached.default;
  const factory = new Function(code) as (jsxRuntime: typeof runtime) => MDXModule;
  const mod = factory({ ...runtime });
  compiledCache.set(code, mod);
  return mod.default;
}

export function MDXContent({
  code,
  components,
}: {
  code: string;
  /** Per-document overrides — merged over the shared `mdxComponents` map. */
  components?: Partial<MdxComponents>;
}): ReactElement {
  // The React Compiler `static-components` rule fires because `Component`
  // comes out of `new Function`. The factory is memoised by `code` string,
  // and this renders inside a Server Component (no client state to lose),
  // so identity churn is a non-issue here.
  const Component = getMDXComponent(code);
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={{ ...mdxComponents, ...components }} />;
}
