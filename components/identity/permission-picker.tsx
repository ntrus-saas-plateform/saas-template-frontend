"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Search, X } from "lucide-react";
import { Checkbox, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatPermissionKey,
  type Permission,
} from "@/lib/api/identity";

export function PermissionPicker({
  permissions,
  selected,
  onChange,
  disabled,
  className,
  /** Fill parent height; only the catalog list scrolls. */
  fill = false,
}: {
  permissions: Permission[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
  fill?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, Permission[]>();
    const list = Array.isArray(permissions) ? permissions : [];
    for (const perm of list) {
      const key = formatPermissionKey(perm);
      const hay =
        `${key} ${perm.description ?? ""} ${perm.resource} ${perm.action}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      const list = map.get(perm.resource) ?? [];
      list.push(perm);
      map.set(perm.resource, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, items]) => ({
        resource,
        items: items.sort((a, b) => a.action.localeCompare(b.action)),
      }));
  }, [permissions, query]);

  const selectedSet = useMemo(
    () => new Set(Array.isArray(selected) ? selected : []),
    [selected],
  );

  const visibleKeys = useMemo(
    () => groups.flatMap((g) => g.items.map((p) => formatPermissionKey(p))),
    [groups],
  );

  const toggle = (key: string) => {
    if (disabled) return;
    if (selectedSet.has(key)) onChange(selected.filter((k) => k !== key));
    else onChange([...selected, key]);
  };

  const toggleGroup = (items: Permission[]) => {
    if (disabled) return;
    const keys = items.map((p) => formatPermissionKey(p));
    const allOn = keys.every((k) => selectedSet.has(k));
    if (allOn) {
      onChange(selected.filter((k) => !keys.includes(k)));
      return;
    }
    const next = new Set(selected);
    for (const k of keys) next.add(k);
    onChange([...next]);
  };

  const selectVisible = () => {
    if (disabled || visibleKeys.length === 0) return;
    const next = new Set(selected);
    for (const k of visibleKeys) next.add(k);
    onChange([...next]);
  };

  const clearVisible = () => {
    if (disabled) return;
    const drop = new Set(visibleKeys);
    onChange(selected.filter((k) => !drop.has(k)));
  };

  const visibleSelectedCount = visibleKeys.filter((k) =>
    selectedSet.has(k),
  ).length;
  const allVisibleOn =
    visibleKeys.length > 0 && visibleSelectedCount === visibleKeys.length;

  return (
    <div
      className={cn(
        "flex flex-col gap-[var(--space-3)]",
        fill && "min-h-0 flex-1",
        className,
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]",
          fill && "flex min-h-0 flex-1 flex-col",
        )}
      >
        <div className="flex shrink-0 items-center gap-[var(--space-2)] border-b border-[var(--border)] bg-[var(--surface-muted)]/40 px-[var(--space-3)] py-[var(--space-2)]">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une permission…"
              className="h-9 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
              disabled={disabled}
              aria-label="Filtrer les permissions"
            />
          </div>
          <span className="shrink-0 type-xs tabular-nums text-[var(--text-muted)]">
            {selected.length} sélectionnée{selected.length === 1 ? "" : "s"}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {selected.length > 0 ? (
            <motion.div
              key="selection-actions"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="shrink-0 overflow-hidden border-b border-[var(--primary)]/25 bg-[var(--primary-soft)]"
            >
              <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)]">
                <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
                  <p className="type-sm font-semibold text-[var(--primary)]">
                    {selected.length} permission
                    {selected.length === 1 ? "" : "s"} sélectionnée
                    {selected.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex flex-wrap items-center gap-[var(--space-1)]">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={disabled || allVisibleOn || visibleKeys.length === 0}
                      onClick={selectVisible}
                    >
                      Tout le filtre
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={disabled || visibleSelectedCount === 0}
                      onClick={clearVisible}
                    >
                      Retirer le filtre
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => onChange([])}
                    >
                      Tout effacer
                    </Button>
                  </div>
                </div>
                <div className="flex max-h-16 flex-wrap gap-[var(--space-1)] overflow-y-auto">
                  {selected.map((key) => (
                    <button
                      key={key}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(key)}
                      className="inline-flex h-7 max-w-full items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] border border-[var(--primary)]/30 bg-[var(--bg-surface)] px-[var(--space-2)] type-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
                      aria-label={`Retirer ${key}`}
                    >
                      <span className="min-w-0 truncate font-mono">{key}</span>
                      <X className="size-3 shrink-0" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className={cn(
            "overflow-y-auto",
            fill ? "min-h-0 flex-1" : "max-h-[min(280px,40vh)]",
          )}
        >
          {groups.length === 0 ? (
            <p className="px-[var(--space-4)] py-[var(--space-6)] text-center type-sm text-[var(--text-muted)]">
              Aucune permission trouvée.
            </p>
          ) : (
            groups.map((group) => {
              const keys = group.items.map((p) => formatPermissionKey(p));
              const selectedCount = keys.filter((k) =>
                selectedSet.has(k),
              ).length;
              const allOn = selectedCount === keys.length && keys.length > 0;
              const someOn = selectedCount > 0 && !allOn;
              const isCollapsed = collapsed[group.resource] === true;
              return (
                <section
                  key={group.resource}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex h-10 items-center gap-[var(--space-2)] px-[var(--space-2)]">
                    <Checkbox
                      compact
                      disabled={disabled}
                      checked={allOn}
                      indeterminate={someOn}
                      aria-label={`Sélectionner le module ${group.resource}`}
                      onChange={() => toggleGroup(group.items)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] text-left hover:bg-[var(--surface-muted)]"
                      onClick={() =>
                        setCollapsed((c) => ({
                          ...c,
                          [group.resource]: !isCollapsed,
                        }))
                      }
                      aria-expanded={!isCollapsed}
                    >
                      <ChevronRight
                        className={cn(
                          "size-3.5 shrink-0 text-[var(--text-muted)] transition-transform",
                          !isCollapsed && "rotate-90",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 truncate type-sm font-semibold text-[var(--text-primary)]">
                        {group.resource}
                      </span>
                      <span
                        className={cn(
                          "type-xs tabular-nums",
                          selectedCount > 0
                            ? "font-semibold text-[var(--primary)]"
                            : "text-[var(--text-muted)]",
                        )}
                      >
                        {selectedCount}/{keys.length}
                      </span>
                    </button>
                  </div>
                  {!isCollapsed ? (
                    <ul className="pb-[var(--space-1)]">
                      {group.items.map((perm) => {
                        const key = formatPermissionKey(perm);
                        const on = selectedSet.has(key);
                        return (
                          <li key={perm.id || key} className="px-[var(--space-2)]">
                            <div
                              className={cn(
                                "flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)] transition-colors",
                                on
                                  ? "bg-[var(--primary-soft)] ring-1 ring-inset ring-[var(--primary)]/25"
                                  : "hover:bg-[var(--surface-muted)]",
                                disabled && "opacity-50",
                              )}
                            >
                              <Checkbox
                                compact
                                disabled={disabled}
                                checked={on}
                                onChange={() => toggle(key)}
                                aria-label={key}
                              />
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => toggle(key)}
                                className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
                              >
                                <span className="flex flex-wrap items-baseline gap-x-[var(--space-2)]">
                                  <span
                                    className={cn(
                                      "font-mono type-xs font-medium",
                                      on
                                        ? "text-[var(--primary)]"
                                        : "text-[var(--text-primary)]",
                                    )}
                                  >
                                    {perm.action}
                                  </span>
                                  {perm.description ? (
                                    <span className="type-xs text-[var(--text-secondary)]">
                                      {perm.description}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block font-mono type-xs text-[var(--text-muted)]">
                                  {key}
                                </span>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
