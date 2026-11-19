"use client";

import { cn } from "@/lib/utils";

export type StudioSectionItem = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type StudioSectionGroup = {
  title: string;
  items: StudioSectionItem[];
};

export function EdgeStudioSectionNav({
  groups,
  value,
  onChange,
  className,
}: {
  groups: StudioSectionGroup[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Studio sections"
      className={cn(
        "flex w-full flex-col gap-[var(--space-4)] lg:w-56 lg:shrink-0",
        className,
      )}
      data-testid="edge-studio-section-nav"
    >
      {groups.map((group) => (
        <div key={group.title} className="space-y-[var(--space-1)]">
          <p className="px-[var(--space-2)] type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = item.id === value;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onChange(item.id)}
                    className={cn(
                      "w-full rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)] text-left transition-colors",
                      active
                        ? "bg-[var(--surface-muted)] font-semibold text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]/60 hover:text-[var(--text-primary)]",
                      item.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="type-sm block">{item.label}</span>
                    {item.description ? (
                      <span className="type-xs mt-0.5 block text-[var(--text-muted)]">
                        {item.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
