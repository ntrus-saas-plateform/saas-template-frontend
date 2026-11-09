"use client";

import { AlertCircle, Inbox, LoaderCircle, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EdgeLoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[12rem] flex-col items-center justify-center gap-[var(--space-3)] text-[var(--text-secondary)]"
      aria-busy="true"
      aria-label={label}
    >
      <LoaderCircle className="size-[var(--icon-lg)] animate-spin text-[var(--primary)]" />
      <p className="type-sm">{label}</p>
    </div>
  );
}

export function EdgeEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-[var(--space-6)] py-[var(--space-8)] text-center">
      <Inbox
        className="size-[var(--icon-lg)] text-[var(--text-muted)]"
        aria-hidden
      />
      <h2 className="type-md text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-md type-sm text-[var(--text-secondary)]">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function EdgeErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-[var(--space-5)] elevation-0">
      <div className="flex items-center gap-[var(--space-2)]">
        <AlertCircle
          className="size-[var(--icon-md)] text-[var(--danger)]"
          aria-hidden
        />
        <h2 className="type-md text-[var(--danger)]">{title}</h2>
      </div>
      <p className="max-w-md type-sm text-[var(--text-secondary)]">
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function EdgeForbiddenState({
  title = "Access restricted",
  description = "You do not have permission to view this area.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-6)] py-[var(--space-8)] text-center">
      <ShieldOff
        className="size-[var(--icon-lg)] text-[var(--text-muted)]"
        aria-hidden
      />
      <h2 className="type-md text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-md type-sm text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
