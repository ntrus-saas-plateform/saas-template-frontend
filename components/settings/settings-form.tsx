import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One settings card: title, optional description, 2-column field grid. */
export function SettingsSection({
  id,
  title,
  description,
  children,
  columns = 2,
  className,
}: {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-8 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]",
        className,
      )}
    >
      {title ? (
        <header className="border-b border-[var(--border)] px-[var(--space-5)] py-[var(--space-4)]">
          <h2 className="type-md text-[var(--text-primary)]">{title}</h2>
          {description ? (
            <p className="mt-[var(--space-1)] max-w-prose type-sm text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      <div
        className={cn(
          "grid gap-x-[var(--space-4)] gap-y-[var(--space-5)] p-[var(--space-5)]",
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SettingsFormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-[1] -mx-[var(--space-6)] mt-[var(--space-2)] flex items-center justify-end gap-[var(--space-2)] border-t border-[var(--border)] bg-[var(--bg-app)]/95 px-[var(--space-6)] py-[var(--space-4)] backdrop-blur-sm">
      {children}
    </div>
  );
}

/** Read-only key/value cells inside a settings section. */
export function SettingsFact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-[var(--space-1)] type-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
        {label}
      </p>
      <div className="type-sm text-[var(--text-primary)]">{children}</div>
    </div>
  );
}
