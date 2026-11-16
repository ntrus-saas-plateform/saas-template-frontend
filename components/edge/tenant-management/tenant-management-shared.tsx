"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { fieldControlClass } from "@/components/ui/field-control";

export function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "APPROVED" || s === "COMPLETED" || s === "FRESH") {
    return "success";
  }
  if (
    s === "FAILED" ||
    s === "REJECTED" ||
    s === "NON_COMPLIANT" ||
    s === "CRITICAL" ||
    s === "TERMINATED"
  ) {
    return "danger";
  }
  if (
    s === "STALE" ||
    s === "UNKNOWN" ||
    s === "WAITING_APPROVAL" ||
    s === "PENDING" ||
    s === "DEGRADED" ||
    s === "SUSPENDED" ||
    s === "REQUESTED"
  ) {
    return "warning";
  }
  return "info";
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}`;
}

export function ProjectionEmpty({ label }: { label: string }) {
  return (
    <p className="type-sm text-[var(--text-muted)]" data-testid="tm-projection-empty">
      {label} — UNAVAILABLE (no API projection)
    </p>
  );
}

type GovernanceRow = {
  id: string;
  tenantRegistryId: string;
  productTenantId: string;
  status: string;
  createdAt: string;
  title: string;
  subtitle?: string;
  body?: string;
};

export function GovernanceQueueList({
  rows,
  canApprove,
  pendingStatuses,
  onApprove,
  onReject,
  approvePending,
  testIdPrefix,
}: {
  rows: GovernanceRow[];
  canApprove: boolean;
  pendingStatuses: string[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approvePending: boolean;
  testIdPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]" data-testid={`${testIdPrefix}-list`}>
      {rows.map((r) => {
        const showActions =
          canApprove && pendingStatuses.includes(r.status.toUpperCase());
        return (
          <Card key={r.id}>
            <CardBody className="flex flex-col gap-[var(--space-2)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">
                  {r.title}{" "}
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </p>
                <p className="type-xs text-[var(--text-muted)]">
                  Tenant{" "}
                  <Link
                    href={`/edge/tenants/${r.tenantRegistryId}`}
                    className="text-[var(--primary)]"
                  >
                    {r.productTenantId}
                  </Link>
                  {r.subtitle ? ` · ${r.subtitle}` : null} · {formatWhen(r.createdAt)}
                </p>
                {r.body ? <p className="type-sm">{r.body}</p> : null}
              </div>
              {showActions ? (
                <div className="flex flex-wrap gap-[var(--space-2)]">
                  <Button
                    type="button"
                    size="sm"
                    disabled={approvePending}
                    onClick={() => onApprove(r.id)}
                    data-testid={`${testIdPrefix}-approve-${r.id}`}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onReject(r.id)}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

export function RejectReasonCard({
  title,
  rejectId,
  rejectReason,
  setRejectReason,
  onConfirm,
  onCancel,
  pending,
  testId,
}: {
  title: string;
  rejectId: string;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
  testId?: string;
}) {
  if (!rejectId) return null;
  return (
    <Card data-testid={testId}>
      <CardBody className="flex flex-col gap-[var(--space-2)]">
        <p className="font-medium">{title}</p>
        <input
          className={fieldControlClass}
          required
          placeholder="Rejected reason (SoD — different approver role)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          aria-label="Rejected reason"
        />
        <div className="flex gap-[var(--space-2)]">
          <Button
            type="button"
            disabled={pending || !rejectReason.trim()}
            onClick={onConfirm}
          >
            Confirm reject
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: number | string | undefined;
  testId: string;
}) {
  const display =
    value === undefined || value === null ? "—" : String(value);
  return (
    <Card>
      <CardBody className="p-[var(--space-3)]">
        <p className="type-xs text-[var(--text-muted)]">{label}</p>
        <p
          className="type-lg font-semibold tabular-nums"
          data-testid={testId}
        >
          {display}
        </p>
      </CardBody>
    </Card>
  );
}

export function SectionProjection({
  title,
  availability,
  children,
  testId,
}: {
  title: string;
  availability?: string;
  children: ReactNode;
  testId?: string;
}) {
  const avail = availability ?? "UNKNOWN";
  return (
    <Card data-testid={testId}>
      <CardBody className="space-y-[var(--space-2)]">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{title}</p>
          <Badge tone={statusTone(avail)}>{avail}</Badge>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}