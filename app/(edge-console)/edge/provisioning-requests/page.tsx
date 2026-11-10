"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type ProvisioningRequestRow = {
  id: string;
  requestNumber: string;
  accountId: string;
  productId: string;
  subscriptionId: string;
  operation: string;
  environmentSlot: string;
  authorizationVersion: number;
  requestStatus: string;
  receivedAt: string;
  lastTransitionAt: string;
};

function unwrap<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function statusTone(
  status: string,
): "default" | "danger" | "success" | "warning" | "info" {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "REJECTED":
    case "FAILED":
      return "danger";
    case "CANCELLED":
      return "warning";
    default:
      return "info";
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed";
}

export default function ProvisioningRequestsPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const canRead = hasEdgePermission(
    permissions,
    "platform:provisioning_requests:read",
  );
  const [status, setStatus] = useState("");
  const [accountId, setAccountId] = useState("");
  const [productId, setProductId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [environmentSlot, setEnvironmentSlot] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const statsQuery = useQuery({
    queryKey: ["edge", "provisioning-requests", "stats"],
    queryFn: () => edgeApi.getProvisioningRequestStats(),
    enabled: canRead,
  });

  const listQuery = useQuery({
    queryKey: [
      "edge",
      "provisioning-requests",
      { status, accountId, productId, subscriptionId, environmentSlot, offset },
    ],
    queryFn: () =>
      edgeApi.listProvisioningRequests({
        status: status || undefined,
        accountId: accountId || undefined,
        productId: productId || undefined,
        subscriptionId: subscriptionId || undefined,
        environmentSlot: environmentSlot || undefined,
        limit,
        offset,
      }),
    enabled: canRead,
  });

  const stats = unwrap<{
    total: number;
    requested: number;
    accepted: number;
    rejected: number;
    cancelled: number;
    failed: number;
  }>(statsQuery.data);

  const list = useMemo(() => {
    const raw = unwrap<{ items: ProvisioningRequestRow[]; total: number }>(
      listQuery.data,
    );
    if (raw && Array.isArray(raw.items)) return raw;
    const asUnknown = listQuery.data as unknown;
    if (
      asUnknown &&
      typeof asUnknown === "object" &&
      Array.isArray((asUnknown as { items?: unknown }).items)
    ) {
      return asUnknown as { items: ProvisioningRequestRow[]; total: number };
    }
    return { items: [] as ProvisioningRequestRow[], total: 0 };
  }, [listQuery.data]);

  if (platformLoading) return <EdgeLoadingState />;
  if (!canRead) {
    return (
      <EdgeForbiddenState
        description="Provisioning requests require platform:provisioning_requests:read"
      />
    );
  }

  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-4)] md:p-[var(--space-6)]">
      <header className="space-y-[var(--space-2)]">
        <p className="type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Ecosystem Management · Provisioning Operations
        </p>
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Provisioning Requests
        </h1>
        <p className="type-sm text-[var(--text-secondary)] max-w-3xl">
          Durable P7 authorization requests only. ACCEPTED is not a technical
          ACTIVE tenant. No infrastructure or Keycloak actions from this
          console.
        </p>
      </header>

      <EdgePermissionGate permission="platform:provisioning_requests:read">
        {statsQuery.isLoading ? (
          <EdgeLoadingState label="Loading stats…" />
        ) : statsQuery.isError ? (
          <EdgeErrorState
            description={errMessage(statsQuery.error)}
            onRetry={() => void statsQuery.refetch()}
          />
        ) : (
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              ["Total", stats?.total ?? 0],
              ["Requested", stats?.requested ?? 0],
              ["Accepted", stats?.accepted ?? 0],
              ["Rejected", stats?.rejected ?? 0],
              ["Cancelled", stats?.cancelled ?? 0],
              ["Failed", stats?.failed ?? 0],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-4)]"
              >
                <p className="type-xs text-[var(--text-muted)]">{label}</p>
                <p className="type-lg font-semibold text-[var(--text-primary)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </EdgePermissionGate>

      <section className="space-y-[var(--space-3)]">
        <div className="flex flex-col gap-[var(--space-3)] lg:flex-row lg:flex-wrap">
          <select
            className={fieldControlClass}
            value={status}
            onChange={(e) => {
              setOffset(0);
              setStatus(e.target.value);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="FAILED">FAILED</option>
          </select>
          <input
            className={fieldControlClass}
            placeholder="Account ID"
            value={accountId}
            onChange={(e) => {
              setOffset(0);
              setAccountId(e.target.value.trim());
            }}
          />
          <input
            className={fieldControlClass}
            placeholder="Product ID"
            value={productId}
            onChange={(e) => {
              setOffset(0);
              setProductId(e.target.value.trim());
            }}
          />
          <input
            className={fieldControlClass}
            placeholder="Subscription ID"
            value={subscriptionId}
            onChange={(e) => {
              setOffset(0);
              setSubscriptionId(e.target.value.trim());
            }}
          />
          <select
            className={fieldControlClass}
            value={environmentSlot}
            onChange={(e) => {
              setOffset(0);
              setEnvironmentSlot(e.target.value);
            }}
            aria-label="Environment slot"
          >
            <option value="">All slots</option>
            <option value="PROD">PROD</option>
            <option value="STAGING">STAGING</option>
            <option value="DR">DR</option>
            <option value="TEMP_TEST">TEMP_TEST</option>
          </select>
        </div>

        {listQuery.isLoading ? (
          <EdgeLoadingState label="Loading requests…" />
        ) : listQuery.isError ? (
          <EdgeErrorState
            description={errMessage(listQuery.error)}
            onRetry={() => void listQuery.refetch()}
          />
        ) : list.items.length === 0 ? (
          <EdgeEmptyState
            title="No provisioning requests"
            description="Requests appear after a verified P5 authorization is accepted by P7."
          />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
            <table className="min-w-full text-left type-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Request</th>
                  <th className="px-3 py-2 font-medium">Account</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Subscription</th>
                  <th className="px-3 py-2 font-medium">Operation</th>
                  <th className="px-3 py-2 font-medium">Slot</th>
                  <th className="px-3 py-2 font-medium">Auth ver.</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/edge/provisioning-requests/${row.id}`}
                        className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                      >
                        {row.requestNumber || row.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono type-xs">
                      {row.accountId?.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 font-mono type-xs">
                      {row.productId?.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 font-mono type-xs">
                      {row.subscriptionId?.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">{row.operation}</td>
                    <td className="px-3 py-2">{row.environmentSlot}</td>
                    <td className="px-3 py-2">{row.authorizationVersion}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(row.requestStatus)}>
                        {row.requestStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                      {row.receivedAt
                        ? new Date(row.receivedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-[var(--space-2)]">
          <Button
            type="button"
            variant="outline"
            disabled={offset <= 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <span className="type-xs text-[var(--text-muted)]">
            {offset + 1}–{Math.min(offset + limit, list.total)} of {list.total}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={offset + limit >= list.total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
