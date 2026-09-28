import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Viewport-locked page shell: header stays put, list/table body scrolls.
 * Use on catalog pages with DataTable fill.
 */
export function FillPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Flexible region under a sticky header (tabs, table, panels). */
export function FillSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
