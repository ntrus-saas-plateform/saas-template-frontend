"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type BackLinkProps = {
  /** Explicit destination. When set, navigation is deterministic. */
  href?: string;
  /** Used with history back when there is nothing to go back to. */
  fallbackHref?: string;
  label?: string;
  className?: string;
};

/**
 * Standard "return" affordance for nested screens/pages.
 *
 * - With `href`: navigates straight to the parent screen.
 * - Without `href`: goes back in history, falling back to `fallbackHref`
 *   (e.g. a deep link opened in a new tab).
 */
export function BackLink({
  href,
  fallbackHref,
  label = "Retour",
  className,
}: BackLinkProps) {
  const router = useRouter();

  const classes = cn(
    "inline-flex h-8 items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] pl-1 pr-[var(--space-2)] type-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        <ArrowLeft className="size-[var(--icon-sm)] shrink-0" aria-hidden />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        if (fallbackHref) router.push(fallbackHref);
      }}
    >
      <ArrowLeft className="size-[var(--icon-sm)] shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
