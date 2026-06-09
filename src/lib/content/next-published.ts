type SluggedItem = {
  slug: string;
};

export function nextPublished<T extends SluggedItem>(
  ordered: readonly T[],
  currentSlug: string,
): T | undefined {
  const index = ordered.findIndex((item) => item.slug === currentSlug);
  if (index === -1) return undefined;
  const candidate = ordered[(index + 1) % ordered.length];
  return candidate && candidate.slug !== currentSlug ? candidate : undefined;
}
