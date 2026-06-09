type PublishableItem = {
  draft: boolean;
  order: number;
  publishedAt: string;
};

export function sortPublished<T extends PublishableItem>(items: readonly T[]): T[] {
  return [...items]
    .filter((item) => !item.draft)
    .sort((a, b) => a.order - b.order || b.publishedAt.localeCompare(a.publishedAt));
}
