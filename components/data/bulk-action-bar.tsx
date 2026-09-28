"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BulkAction = {
  id: string;
  label: string;
  permission?: string;
  tone?: "default" | "danger";
  /** Receives the current selection when clicked. */
  onClick: (selectedIds: string[]) => void;
  disabled?: boolean;
};

export function BulkActionBar({
  selectedCount,
  selectedIds,
  actions,
  onClear,
  className,
}: {
  selectedCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {selectedCount > 0 ? (
        <motion.div
          key="bulk-bar"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "flex w-full flex-wrap items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-[var(--space-4)] py-[var(--space-2)]",
            className,
          )}
          role="toolbar"
          aria-label="Actions groupées"
        >
          <p className="type-sm font-semibold text-[var(--primary)]">
            {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            {actions.map((a) => (
              <Button
                key={a.id}
                type="button"
                size="sm"
                variant={a.tone === "danger" ? "danger" : "secondary"}
                disabled={a.disabled}
                onClick={() => a.onClick(selectedIds)}
              >
                {a.label}
              </Button>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={onClear}>
              Effacer
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
