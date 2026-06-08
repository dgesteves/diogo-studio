import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function MobileLink({
  href,
  pathname,
  onNavigate,
  children,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  children: ReactNode;
}): ReactElement {
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-3 text-base transition-colors",
        isActive
          ? "bg-surface-muted text-foreground"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <span>{children}</span>
      {isActive ? (
        <span
          aria-hidden="true"
          className="text-accent font-mono text-[10px] tracking-wider uppercase"
        >
          Current
        </span>
      ) : null}
    </Link>
  );
}
