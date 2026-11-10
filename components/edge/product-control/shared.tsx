"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { productControlStatusTone } from "@/lib/edge/product-control";

export function ProductControlPagination({
  offset,
  limit,
  total,
  onOffsetChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (next: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  return (
    <div className="flex items-center gap-[var(--space-2)]">
      <Button
        type="button"
        variant="outline"
        disabled={offset <= 0}
        onClick={() => onOffsetChange(Math.max(0, offset - limit))}
      >
        Previous
      </Button>
      <span className="type-xs text-[var(--text-muted)]">
        {from}–{to} of {total}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={offset + limit >= total}
        onClick={() => onOffsetChange(offset + limit)}
      >
        Next
      </Button>
    </div>
  );
}

export function ProductControlStatusBadge({ status }: { status: string }) {
  return <Badge tone={productControlStatusTone(status)}>{status}</Badge>;
}

export function ProductControlTableShell({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
      <table className="min-w-full text-left type-sm">
        <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function ProductControlFilters({
  q,
  status,
  statusOptions,
  onQChange,
  onStatusChange,
  searchLabel = "Search product control",
  extra,
}: {
  q: string;
  status: string;
  statusOptions: readonly string[];
  onQChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  searchLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-3)] lg:flex-row lg:flex-wrap">
      <input
        className={fieldControlClass}
        placeholder="Search…"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        aria-label={searchLabel}
      />
      <select
        className={fieldControlClass}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {extra}
    </div>
  );
}

export function ProductControlInfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-4)]">
      <h3 className="type-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

export function ProductControlRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 type-xs text-[var(--text-muted)] sm:w-44">
        {label}
      </dt>
      <dd
        className={`break-all type-sm text-[var(--text-primary)] ${mono ? "font-mono type-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function ProductControlCountCard({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-4)]"
      aria-label={`${label}: ${count}`}
    >
      <p className="type-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
        {count}
      </p>
    </div>
  );
}

export function formatProductControlDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function ProductControlLoading({ label }: { label?: string }) {
  return <EdgeLoadingState label={label ?? "Loading product control…"} />;
}

export function ProductControlEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <EdgeEmptyState title={title} description={description} />;
}

export function ProductControlError({
  description,
  onRetry,
}: {
  description: string;
  onRetry?: () => void;
}) {
  return <EdgeErrorState description={description} onRetry={onRetry} />;
}

export function ProductControlForbidden({
  description,
}: {
  description: string;
}) {
  return <EdgeForbiddenState description={description} />;
}

export function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}
