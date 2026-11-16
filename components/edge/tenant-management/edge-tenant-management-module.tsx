"use client";

/**
 * P8 — Edge Admin Console: Tenant Management Center.
 * Portfolio metrics, registry search, governance queues — API state only.
 */
import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { unwrapInfraList } from "@/lib/edge/infrastructure";
import { edgeApi } from "@/lib/api/edge";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  ExceptionRecord,
  LifecycleRequestRecord,
  ReconciliationFindingRecord,
  TenantPortfolioMetrics,
  TenantRegistryRecord,
} from "@/types/edge-tenant-management";

type TabId =
  | "registry"
  | "lifecycle-requests"
  | "exceptions"
  | "reconciliation"
  | "analytics";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "registry", label: "Registry", permission: "platform:tenant_management:search" },
  {
    id: "lifecycle-requests",
    label: "Lifecycle requests",
    permission: "platform:tenant_management:lifecycle:request",
  },
  {
    id: "exceptions",
    label: "Exceptions",
    permission: "platform:tenant_management:exception:request",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    permission: "platform:tenant_management:reconciliation:execute",
  },
  {
    id: "analytics",
    label: "Analytics",
    permission: "platform:tenant_management:analytics:read",
  },
];

const READ_PERMS = [
  "platform:tenant_management:search",
  "platform:tenant_management:read",
  "platform:tenant_management:analytics:read",
  "platform:tenant_management:lifecycle:request",
  "platform:tenant_management:exception:request",
  "platform:tenant_management:reconciliation:execute",
];

function statusTone(
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

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function MetricCard({
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

export function EdgeTenantManagementModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("registry");

  const [searchQ, setSearchQ] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedAdmin, setAppliedAdmin] = useState("");

  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [reconDryRun, setReconDryRun] = useState(true);

  const canSearch = hasEdgePermission(
    permissions,
    "platform:tenant_management:search",
  );
  const canAnalytics = hasEdgePermission(
    permissions,
    "platform:tenant_management:analytics:read",
  );
  const canSync = hasEdgePermission(
    permissions,
    "platform:tenant_management:register",
  );
  const canLifecycleList = hasEdgePermission(
    permissions,
    "platform:tenant_management:lifecycle:request",
  );
  const canLifecycleApprove = hasEdgePermission(
    permissions,
    "platform:tenant_management:lifecycle:approve",
  );
  const canExceptions = hasEdgePermission(
    permissions,
    "platform:tenant_management:exception:request",
  );
  const canExceptionApprove = hasEdgePermission(
    permissions,
    "platform:tenant_management:exception:approve",
  );
  const canReconciliation = hasEdgePermission(
    permissions,
    "platform:tenant_management:reconciliation:execute",
  );

  const portfolioQ = useQuery({
    queryKey: ["tm", "portfolio"],
    queryFn: () => edgeApi.getTenantPortfolioAnalytics(),
    enabled: canAnalytics,
  });

  const tenantsQ = useQuery({
    queryKey: ["tm", "tenants", appliedQ, appliedAdmin],
    queryFn: () =>
      edgeApi.listTenants({
        q: appliedQ || undefined,
        administrativeStatus: appliedAdmin || undefined,
        limit: 50,
      }),
    enabled: canSearch && tab === "registry",
  });

  const lifecycleQ = useQuery({
    queryKey: ["tm", "lifecycle-requests"],
    queryFn: () => edgeApi.listTenantLifecycleRequests({ limit: 50 }),
    enabled: canLifecycleList && tab === "lifecycle-requests",
  });

  const exceptionsQ = useQuery({
    queryKey: ["tm", "exceptions"],
    queryFn: () => edgeApi.listTenantExceptions({ limit: 50 }),
    enabled: canExceptions && tab === "exceptions",
  });

  const findingsQ = useQuery({
    queryKey: ["tm", "findings"],
    queryFn: () => edgeApi.listTenantReconciliationFindings({ limit: 50 }),
    enabled: canReconciliation && tab === "reconciliation",
  });

  const tenants = unwrapInfraList<TenantRegistryRecord>(tenantsQ.data?.data);
  const lifecycle = unwrapInfraList<LifecycleRequestRecord>(
    lifecycleQ.data?.data,
  );
  const exceptions = unwrapInfraList<ExceptionRecord>(exceptionsQ.data?.data);
  const findings = unwrapInfraList<ReconciliationFindingRecord>(
    findingsQ.data?.data,
  );

  const portfolio = portfolioQ.data?.data as TenantPortfolioMetrics | undefined;

  const syncP7 = useMutation({
    mutationFn: () => edgeApi.syncTenantsFromP7(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tm"] });
    },
  });

  const approveLifecycle = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantLifecycleRequest(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm"] }),
  });

  const rejectLifecycle = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.rejectTenantLifecycleRequest(id, { rejectedReason: reason }),
    onSuccess: () => {
      setRejectId("");
      setRejectReason("");
      void qc.invalidateQueries({ queryKey: ["tm"] });
    },
  });

  const approveException = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantException(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm"] }),
  });

  const expireExceptions = useMutation({
    mutationFn: () => edgeApi.expireTenantExceptions(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm"] }),
  });

  const runReconciliation = useMutation({
    mutationFn: () =>
      edgeApi.runTenantReconciliation({ dryRun: reconDryRun, mode: "FULL" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm"] }),
  });

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasEdgePermission(permissions, t.permission)),
    [permissions],
  );

  if (!hasAnyEdgePermission(permissions, READ_PERMS)) {
    return <EdgeForbiddenState />;
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setAppliedQ(searchQ.trim());
    setAppliedAdmin(adminFilter.trim());
  }

  const actionError =
    syncP7.error ??
    approveLifecycle.error ??
    rejectLifecycle.error ??
    approveException.error ??
    expireExceptions.error ??
    runReconciliation.error;

  return (
    <div
      className="flex flex-col gap-[var(--space-6)]"
      data-testid="tm-module"
    >
      {actionError ? (
        <Alert tone="error" title="Action refusée">
          {(actionError as Error).message}
        </Alert>
      ) : null}

      {canAnalytics ? (
        <section data-testid="tm-portfolio-metrics">
          {portfolioQ.isLoading ? (
            <EdgeLoadingState label="Loading portfolio metrics…" />
          ) : portfolioQ.isError ? (
            <EdgeErrorState
              description={(portfolioQ.error as Error).message}
            />
          ) : portfolio ? (
            <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total tenants"
                value={portfolio.total}
                testId="tm-metric-total"
              />
              <MetricCard
                label="Active"
                value={portfolio.active}
                testId="tm-metric-active"
              />
              <MetricCard
                label="Provisioning"
                value={portfolio.provisioning}
                testId="tm-metric-provisioning"
              />
              <MetricCard
                label="Suspended"
                value={portfolio.suspended}
                testId="tm-metric-suspended"
              />
              <MetricCard
                label="Degraded"
                value={portfolio.degraded}
                testId="tm-metric-degraded"
              />
              <MetricCard
                label="Pending review"
                value={portfolio.pendingReview}
                testId="tm-metric-pending-review"
              />
              <MetricCard
                label="Active exceptions"
                value={portfolio.exceptionsActive}
                testId="tm-metric-exceptions"
              />
              <MetricCard
                label="Open reconciliation"
                value={portfolio.reconciliationOpen}
                testId="tm-metric-reconciliation"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <Tabs
        tabs={visibleTabs.map((t) => ({ id: t.id, label: t.label }))}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "registry" && (
        <EdgePermissionGate permission="platform:tenant_management:search">
          <div className="flex flex-col gap-[var(--space-4)]">
            <form
              onSubmit={onSearch}
              className="flex flex-col gap-[var(--space-3)] md:flex-row md:items-end"
              data-testid="tm-registry-search"
            >
              <input
                className={fieldControlClass}
                placeholder="Search code, name, tenant id…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                aria-label="Tenant search"
              />
              <input
                className={fieldControlClass}
                placeholder="Administrative status"
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                aria-label="Administrative status filter"
              />
              <Button type="submit">Search</Button>
              {canSync ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={syncP7.isPending}
                  onClick={() => syncP7.mutate()}
                  data-testid="tm-sync-p7"
                >
                  {syncP7.isPending ? "Syncing…" : "Sync from P7"}
                </Button>
              ) : null}
            </form>

            {tenantsQ.isLoading ? (
              <EdgeLoadingState label="Loading tenant registry…" />
            ) : tenantsQ.isError ? (
              <EdgeErrorState
                description={(tenantsQ.error as Error).message}
              />
            ) : tenants.items.length === 0 ? (
              <EdgeEmptyState
                title="No tenants"
                description="Adjust filters or sync from P7 projections."
              />
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                <table
                  className="w-full min-w-[720px] text-left type-sm"
                  data-testid="tm-registry-table"
                >
                  <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="p-[var(--space-2)]">Tenant</th>
                      <th className="p-[var(--space-2)]">Product</th>
                      <th className="p-[var(--space-2)]">Admin</th>
                      <th className="p-[var(--space-2)]">Technical</th>
                      <th className="p-[var(--space-2)]">Health</th>
                      <th className="p-[var(--space-2)]">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.items.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
                      >
                        <td className="p-[var(--space-2)]">
                          <Link
                            href={`/edge/tenants/${t.id}`}
                            className="font-medium text-[var(--primary)] hover:underline"
                            data-testid={`tm-tenant-link-${t.id}`}
                          >
                            {t.displayName}
                          </Link>
                          <p className="type-xs text-[var(--text-muted)]">
                            {t.tenantCode}
                          </p>
                        </td>
                        <td className="p-[var(--space-2)]">
                          {t.productCode ?? t.productId.slice(0, 8)}
                        </td>
                        <td className="p-[var(--space-2)]">
                          <Badge tone={statusTone(t.administrativeStatus)}>
                            {t.administrativeStatus}
                          </Badge>
                        </td>
                        <td className="p-[var(--space-2)]">
                          <Badge tone={statusTone(t.technicalStatus)}>
                            {t.technicalStatus}
                          </Badge>
                        </td>
                        <td className="p-[var(--space-2)]">
                          <Badge tone={statusTone(t.healthStatus)}>
                            {t.healthStatus}
                          </Badge>
                        </td>
                        <td className="p-[var(--space-2)]">
                          {t.region ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="type-xs text-[var(--text-muted)]">
              {tenants.total} tenant(s) — health/status from API only.
            </p>
          </div>
        </EdgePermissionGate>
      )}

      {tab === "lifecycle-requests" && (
        <EdgePermissionGate permission="platform:tenant_management:lifecycle:request">
          {lifecycleQ.isLoading ? (
            <EdgeLoadingState label="Loading lifecycle requests…" />
          ) : lifecycleQ.isError ? (
            <EdgeErrorState
              description={(lifecycleQ.error as Error).message}
            />
          ) : lifecycle.items.length === 0 ? (
            <EdgeEmptyState title="No lifecycle requests" />
          ) : (
            <div
              className="flex flex-col gap-[var(--space-3)]"
              data-testid="tm-lifecycle-list"
            >
              {lifecycle.items.map((r) => (
                <Card key={r.id}>
                  <CardBody className="flex flex-col gap-[var(--space-2)] md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {r.requestType}{" "}
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      </p>
                      <p className="type-xs text-[var(--text-muted)]">
                        Tenant{" "}
                        <Link
                          href={`/edge/tenants/${r.tenantRegistryId}`}
                          className="text-[var(--primary)]"
                        >
                          {r.productTenantId}
                        </Link>{" "}
                        · {formatWhen(r.createdAt)}
                      </p>
                      <p className="type-sm">{r.justification}</p>
                    </div>
                    {canLifecycleApprove &&
                    (r.status === "WAITING_APPROVAL" ||
                      r.status === "PENDING") ? (
                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        <Button
                          type="button"
                          size="sm"
                          disabled={approveLifecycle.isPending}
                          onClick={() => approveLifecycle.mutate(r.id)}
                          data-testid={`tm-lifecycle-approve-${r.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setRejectId(r.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
          {rejectId && canLifecycleApprove ? (
            <Card data-testid="tm-lifecycle-reject-form">
              <CardHeader title="Reject lifecycle request" />
              <CardBody>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!rejectReason.trim()) return;
                    rejectLifecycle.mutate({
                      id: rejectId,
                      reason: rejectReason.trim(),
                    });
                  }}
                  className="flex flex-col gap-[var(--space-2)]"
                >
                  <input
                    className={fieldControlClass}
                    required
                    placeholder="Rejected reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    aria-label="Rejected reason"
                  />
                  <div className="flex gap-[var(--space-2)]">
                    <Button type="submit" disabled={rejectLifecycle.isPending}>
                      Confirm reject
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setRejectId("");
                        setRejectReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : null}
        </EdgePermissionGate>
      )}

      {tab === "exceptions" && (
        <EdgePermissionGate permission="platform:tenant_management:exception:request">
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {canExceptionApprove ? (
              <Button
                type="button"
                variant="secondary"
                disabled={expireExceptions.isPending}
                onClick={() => expireExceptions.mutate()}
                data-testid="tm-expire-exceptions"
              >
                Expire due exceptions
              </Button>
            ) : null}
          </div>
          {exceptionsQ.isLoading ? (
            <EdgeLoadingState label="Loading exceptions…" />
          ) : exceptionsQ.isError ? (
            <EdgeErrorState
              description={(exceptionsQ.error as Error).message}
            />
          ) : exceptions.items.length === 0 ? (
            <EdgeEmptyState title="No exceptions" />
          ) : (
            <div
              className="flex flex-col gap-[var(--space-3)]"
              data-testid="tm-exceptions-list"
            >
              {exceptions.items.map((ex) => (
                <Card key={ex.id}>
                  <CardBody className="flex flex-col gap-[var(--space-2)] md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {ex.exceptionType}{" "}
                        <Badge tone={statusTone(ex.status)}>{ex.status}</Badge>
                      </p>
                      <p className="type-xs text-[var(--text-muted)]">
                        <Link
                          href={`/edge/tenants/${ex.tenantRegistryId}`}
                          className="text-[var(--primary)]"
                        >
                          {ex.productTenantId}
                        </Link>{" "}
                        · until {formatWhen(ex.expiresAt)}
                      </p>
                      <p className="type-sm">{ex.description}</p>
                    </div>
                    {canExceptionApprove && ex.status === "REQUESTED" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={approveException.isPending}
                        onClick={() => approveException.mutate(ex.id)}
                        data-testid={`tm-exception-approve-${ex.id}`}
                      >
                        Approve
                      </Button>
                    ) : null}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "reconciliation" && (
        <EdgePermissionGate permission="platform:tenant_management:reconciliation:execute">
          <Card>
            <CardHeader title="Run reconciliation" />
            <CardBody className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center">
              <label className="flex items-center gap-[var(--space-2)] type-sm">
                <input
                  type="checkbox"
                  checked={reconDryRun}
                  onChange={(e) => setReconDryRun(e.target.checked)}
                />
                Dry run
              </label>
              <Button
                type="button"
                disabled={runReconciliation.isPending}
                onClick={() => runReconciliation.mutate()}
                data-testid="tm-reconciliation-run"
              >
                {runReconciliation.isPending ? "Running…" : "Run reconciliation"}
              </Button>
            </CardBody>
          </Card>
          {findingsQ.isLoading ? (
            <EdgeLoadingState label="Loading findings…" />
          ) : findingsQ.isError ? (
            <EdgeErrorState
              description={(findingsQ.error as Error).message}
            />
          ) : findings.items.length === 0 ? (
            <EdgeEmptyState title="No reconciliation findings" />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
              <table
                className="w-full min-w-[640px] type-sm"
                data-testid="tm-findings-table"
              >
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-[var(--space-2)]">Type</th>
                    <th className="p-[var(--space-2)]">Severity</th>
                    <th className="p-[var(--space-2)]">Status</th>
                    <th className="p-[var(--space-2)]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.items.map((f) => (
                    <tr
                      key={f.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="p-[var(--space-2)]">{f.findingType}</td>
                      <td className="p-[var(--space-2)]">
                        <Badge tone={statusTone(f.severity)}>{f.severity}</Badge>
                      </td>
                      <td className="p-[var(--space-2)]">{f.status}</td>
                      <td className="p-[var(--space-2)]">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "analytics" && (
        <EdgePermissionGate permission="platform:tenant_management:analytics:read">
          {portfolioQ.isLoading ? (
            <EdgeLoadingState label="Loading analytics…" />
          ) : portfolioQ.isError ? (
            <EdgeErrorState
              description={(portfolioQ.error as Error).message}
            />
          ) : !portfolio ? (
            <EdgeEmptyState title="No analytics payload" />
          ) : (
            <div
              className="grid gap-[var(--space-4)] lg:grid-cols-2"
              data-testid="tm-analytics"
            >
              <Card>
                <CardHeader title="By product" />
                <CardBody>
                  <ul className="space-y-1 type-sm">
                    {portfolio.byProduct.map((row) => (
                      <li key={row.productId} className="flex justify-between">
                        <span>{row.productCode ?? row.productId}</span>
                        <span className="tabular-nums">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="By region" />
                <CardBody>
                  <ul className="space-y-1 type-sm">
                    {portfolio.byRegion.map((row) => (
                      <li
                        key={row.region || "unknown"}
                        className="flex justify-between"
                      >
                        <span>{row.region || "—"}</span>
                        <span className="tabular-nums">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="By classification" />
                <CardBody>
                  <ul className="space-y-1 type-sm">
                    {portfolio.byClassification.map((row) => (
                      <li key={row.classification} className="flex justify-between">
                        <span>{row.classification}</span>
                        <span className="tabular-nums">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="By administrative status" />
                <CardBody>
                  <ul className="space-y-1 type-sm">
                    {portfolio.byAdministrativeStatus.map((row) => (
                      <li key={row.status} className="flex justify-between">
                        <span>{row.status}</span>
                        <span className="tabular-nums">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
              <p className="type-xs text-[var(--text-muted)] lg:col-span-2">
                Computed at {formatWhen(portfolio.computedAt)}
              </p>
            </div>
          )}
        </EdgePermissionGate>
      )}
    </div>
  );
}