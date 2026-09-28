"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { SettingsSection } from "@/components/settings/settings-form";
import { cn } from "@/lib/utils";

export type SettingsStage = {
  id: string;
  label: string;
  description?: string;
  columns?: 1 | 2;
  /** `block` = full-width body (tables), `fields` = 2-column form grid. */
  layout?: "fields" | "block";
  content: ReactNode;
  /** Stage-specific actions. `null` hides the shared footer (Back/Next remain). */
  footer?: ReactNode | null;
};

export function SettingsStages({
  stages,
  footer,
  className,
}: {
  stages: SettingsStage[];
  footer?: ReactNode;
  className?: string;
}) {
  const ids = useMemo(() => stages.map((s) => s.id), [stages]);
  const [activeId, setActiveId] = useState(stages[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && ids.includes(hash)) setActiveId(hash);
  }, [ids]);

  const index = Math.max(
    0,
    stages.findIndex((s) => s.id === activeId),
  );
  const current = stages[index] ?? stages[0];
  if (!current) return null;

  const go = (id: string) => {
    setActiveId(id);
    if (typeof window === "undefined") return;
    const url = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(null, "", url);
  };

  const isFirst = index === 0;
  const isLast = index === stages.length - 1;
  const actions = current.footer === undefined ? footer : current.footer;
  const showNav = stages.length > 1;

  return (
    <div className={cn("flex flex-col gap-[var(--space-4)]", className)}>
      {showNav ? (
      <nav aria-label="Form steps">
        <ol className="hidden sm:flex sm:items-start">
          {stages.map((stage, i) => {
            const active = i === index;
            const done = i < index;
            return (
              <li key={stage.id} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  aria-current={active ? "step" : undefined}
                  onClick={() => go(stage.id)}
                  className="flex min-w-0 flex-col items-center gap-[var(--space-1)] px-[var(--space-1)]"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-[var(--radius-full)] type-sm font-semibold",
                      active
                        ? "bg-[var(--primary)] text-[var(--on-primary)]"
                        : done
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-muted)]",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "max-w-full truncate type-xs",
                      active
                        ? "font-semibold text-[var(--primary)]"
                        : "text-[var(--text-secondary)]",
                    )}
                  >
                    {stage.label}
                  </span>
                </button>
                {i < stages.length - 1 ? (
                  <div
                    aria-hidden
                    className={cn(
                      "mb-5 h-px min-w-[var(--space-4)] flex-1",
                      i < index
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--border)]",
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="sm:hidden">
          <Select
            id="settings-stage-select"
            aria-label="Form step"
            value={current.id}
            onChange={(e) => go(e.target.value)}
          >
            {stages.map((stage, i) => (
              <option key={stage.id} value={stage.id}>
                {i + 1}. {stage.label}
              </option>
            ))}
          </Select>
        </div>
      </nav>
      ) : null}

      {current.layout === "block" ? (
        <section
          id={current.id}
          className="scroll-mt-8 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]"
        >
          <header className="border-b border-[var(--border)] px-[var(--space-5)] py-[var(--space-4)]">
            <h2 className="type-md text-[var(--text-primary)]">{current.label}</h2>
            {current.description ? (
              <p className="mt-[var(--space-1)] max-w-prose type-sm text-[var(--text-secondary)]">
                {current.description}
              </p>
            ) : null}
          </header>
          <div className="p-[var(--space-5)]">{current.content}</div>
        </section>
      ) : (
        <SettingsSection
          id={current.id}
          title={current.label}
          description={current.description}
          columns={current.columns ?? 2}
          className="w-full max-w-5xl"
        >
          {current.content}
        </SettingsSection>
      )}

      <div className="sticky bottom-0 z-[1] flex items-center justify-between gap-[var(--space-2)] border-t border-[var(--border)] bg-[var(--bg-app)]/95 py-[var(--space-4)] backdrop-blur-sm">
        {showNav ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isFirst}
            onClick={() => go(stages[index - 1].id)}
          >
            <ChevronLeft />
            Back
          </Button>
        ) : (
          <span />
        )}
        {showNav ? (
          <p className="type-xs text-[var(--text-muted)]">
            {index + 1} / {stages.length}
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-[var(--space-2)]">
          {showNav && !isLast ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => go(stages[index + 1].id)}
            >
              Next
              <ChevronRight />
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  );
}
