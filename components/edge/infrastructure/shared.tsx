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
import { infraStatusTone } from "@/lib/edge/infrastructure";

export function InfraPagination({
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

export function InfraStatusBadge({ status }: { status: string }) {
  return <Badge tone={infraStatusTone(status)}>{status}</Badge>;
}

export function InfraTableShell({
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

export function InfraFilters({
  q,
  status,
  statusOptions,
  onQChange,
  onStatusChange,
  searchLabel = "Search",
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
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder={searchLabel}
        aria-label={searchLabel}
      />
      <select
        className={fieldControlClass}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Status filter"
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

export function InfraCountCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-4)]">
      <div className="type-xs text-[var(--text-muted)]">{label}</div>
      <div className="type-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

export function InfraLoading() {
  return <EdgeLoadingState label="Loading infrastructure…" />;
}
export function InfraEmpty({ title = "No resources" }: { title?: string }) {
  return <EdgeEmptyState title={title} />;
}
export function InfraError({ message }: { message: string }) {
  return <EdgeErrorState message={message} />;
}
export function InfraForbidden() {
  return <EdgeForbiddenState />;
}

export function formatInfraDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
