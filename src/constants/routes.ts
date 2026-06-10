export const routes = {
  home: "/",
  work: "/work",
  writing: "/writing",
  about: "/about",
  contact: "/contact",
  uses: "/uses",
  colophon: "/colophon",
} as const;

export function caseStudyPath(slug: string): string {
  return `${routes.work}/${slug}`;
}
