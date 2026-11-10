"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  registryStatusTone,
  type RegistryTransitionKind,
  nextRegistryStatuses,
  registryTransitionNeedsReason,
} from "@/lib/edge/registry";

export function RegistryPagination({
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

export function RegistryStatusBadge({ status }: { status: string }) {
  return <Badge tone={registryStatusTone(status)}>{status}</Badge>;
}

export function RegistryTableShell({
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

export function RegistryFilters({
  q,
  status,
  statusOptions,
  onQChange,
  onStatusChange,
  extra,
}: {
  q: string;
  status: string;
  statusOptions: readonly string[];
  onQChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-3)] lg:flex-row lg:flex-wrap">
      <input
        className={fieldControlClass}
        placeholder="Search…"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        aria-label="Search registry"
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

export function RegistryInfoCard({
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

export function RegistryRow({
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

export function RegistryTransitionForm({
  kind,
  currentStatus,
  toStatus,
  reason,
  busy,
  error,
  onToStatusChange,
  onReasonChange,
  onSubmit,
  managePermissionGate,
}: {
  kind: RegistryTransitionKind;
  currentStatus: string;
  toStatus: string;
  reason: string;
  busy?: boolean;
  error?: string | null;
  onToStatusChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  managePermissionGate?: ReactNode;
}) {
  const next = nextRegistryStatuses(kind, currentStatus);
  const needsReason = registryTransitionNeedsReason(kind, toStatus);
  if (next.length === 0) {
    return (
      <p className="type-sm text-[var(--text-muted)]">
        No further lifecycle transitions from {currentStatus}.
      </p>
    );
  }
  return (
    <div className="space-y-[var(--space-3)]">
      {managePermissionGate}
      <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:flex-wrap">
        <select
          className={fieldControlClass}
          value={toStatus}
          onChange={(e) => onToStatusChange(e.target.value)}
          aria-label="Target status"
        >
          <option value="">Select target status…</option>
          {next.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          className={fieldControlClass}
          placeholder={needsReason ? "Reason (required)" : "Reason (optional)"}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
        />
        <Button
          type="button"
          disabled={
            busy || !toStatus || (needsReason && !reason.trim())
          }
          onClick={onSubmit}
        >
          {busy ? "Transitioning…" : "Apply transition"}
        </Button>
      </div>
      {error ? (
        <p className="type-sm text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}

export function formatRegistryDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}
