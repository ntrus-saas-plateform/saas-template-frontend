import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Settings form surface: card + sticky save bar. */
export function SettingsPanel({
  children,
  className,
  footer,
  maxWidth = "full",
  variant = "card",
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  variant?: "card" | "stack";
}) {
  const max =
    maxWidth === "md"
      ? "max-w-md"
      : maxWidth === "lg"
        ? "max-w-2xl"
        : maxWidth === "xl"
          ? "max-w-4xl"
          : maxWidth === "2xl"
            ? "max-w-6xl"
            : "max-w-none";

  return (
    <div className={cn(max, className)}>
      {variant === "stack" ? (
        <div className="flex flex-col gap-[var(--space-4)]">{children}</div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="p-[var(--space-5)]">{children}</div>
        </div>
      )}
      {footer ? (
        <div className="sticky bottom-0 z-[1] mt-[var(--space-4)] flex items-center justify-end gap-[var(--space-2)] border-t border-[var(--border)] bg-[var(--bg-app)]/95 py-[var(--space-4)] backdrop-blur-sm">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
