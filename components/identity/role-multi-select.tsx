"use client";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api/identity";

export function RoleMultiSelect({
  roles,
  selected,
  onChange,
}: {
  roles: Role[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const orgRoles = roles.filter(
    (r) => r.scope === "organization" || r.scope === "tenant",
  );
  return (
    <div className="flex max-h-40 flex-wrap gap-2 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-[var(--space-2)]">
      {orgRoles.length === 0 ? (
        <p className="type-sm text-[var(--text-muted)]">No roles available.</p>
      ) : (
        orgRoles.map((role) => {
          const active = selected.includes(role.name);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((r) => r !== role.name)
                    : [...selected, role.name],
                )
              }
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                active
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] ring-[var(--primary)]/20"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] ring-[var(--border)]",
              )}
            >
              {role.name}
            </button>
          );
        })
      )}
    </div>
  );
}
