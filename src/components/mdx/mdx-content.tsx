import type { ReactElement } from "react";
import * as runtime from "react/jsx-runtime";
import { mdxComponents, type MdxComponents } from "./components";

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
  components?: Partial<MdxComponents>;
}): ReactElement {
  const Component = getMDXComponent(code);
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={{ ...mdxComponents, ...components }} />;
}
