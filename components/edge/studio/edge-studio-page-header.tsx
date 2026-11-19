"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EdgeStudioPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-[var(--space-4)] border-b border-[var(--border)] pb-[var(--space-4)]",
        className,
      )}
      data-testid="edge-studio-page-header"
    >
      <div className="min-w-0 space-y-1">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl type-sm text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
