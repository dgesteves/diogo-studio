import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-sm font-medium tracking-widest text-zinc-500 uppercase">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="bg-foreground text-background mt-2 rounded-full px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
      >
        Go home
      </Link>
    </main>
  );
}
