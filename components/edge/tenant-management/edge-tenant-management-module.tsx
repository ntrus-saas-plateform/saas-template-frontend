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
  MigrationRequestRecord,
  ReconciliationFindingRecord,
  ReconciliationRunRecord,
  RecoveryRequestRecord,
  TenantBulkOperationRecord,
  TenantPortfolioMetrics,
  TenantRegistryRecord,
  TerminationRequestRecord,
} from "@/types/edge-tenant-management";
import {
  GovernanceQueueList,
  MetricCard,
  RejectReasonCard,
  formatWhen,
  newIdempotencyKey,
  statusTone,
} from "./tenant-management-shared";

type TabId =
  | "registry"
  | "lifecycle"
  | "exceptions"
  | "migrations"
  | "recoveries"
  | "terminations"
  | "reconciliation"
  | "bulk"
  | "analytics";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "registry", label: "Registry", permission: "platform:tenant_management:search" },
  {
    id: "lifecycle",
    label: "Lifecycle",
    permission: "platform:tenant_management:lifecycle:request",
  },
  {
    id: "exceptions",
    label: "Exceptions",
    permission: "platform:tenant_management:exception:request",
  },
  {
    id: "migrations",
    label: "Migrations",
    permission: "platform:tenant_management:migration:request",
  },
  {
    id: "recoveries",
    label: "Recoveries",
    permission: "platform:tenant_management:recovery:request",
  },
  {
    id: "terminations",
    label: "Terminations",
    permission: "platform:tenant_management:termination:request",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    permission: "platform:tenant_management:reconciliation:execute",
  },
  { id: "bulk", label: "Bulk", permission: "platform:tenant_management:bulk:execute" },
  {
    id: "analytics",
    label: "Analytics",
    permission: "platform:tenant_management:analytics:read",
  },
];

const READ_PERMS = TABS.map((t) => t.permission);

const PENDING_GOVERNANCE = ["WAITING_APPROVAL", "PENDING", "REQUESTED"];

export function EdgeTenantManagementModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("registry");

  const [searchQ, setSearchQ] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    admin: "",
    tech: "",
    productId: "",
    region: "",
    sortBy: "updatedAt",
    sortDir: "desc" as "asc" | "desc",
    limit: 50,
    offset: 0,
  });

  const [rejectCtx, setRejectCtx] = useState<{
    kind: string;
    id: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [reconDryRun, setReconDryRun] = useState(true);

  const [registerForm, setRegisterForm] = useState({
    productTenantId: "",
    tenantCode: "",
    displayName: "",
    productId: "",
    region: "",
  });

  const [exceptionForm, setExceptionForm] = useState({
    tenantRegistryId: "",
    exceptionType: "OPERATIONAL",
    description: "",
    businessJustification: "",
    startsAt: "",
    expiresAt: "",
  });

  const [migrationForm, setMigrationForm] = useState({
    tenantRegistryId: "",
    migrationType: "REGION",
    justification: "",
  });

  const [recoveryForm, setRecoveryForm] = useState({
    tenantRegistryId: "",
    recoveryType: "FULL_TENANT",
    justification: "",
    priority: "MEDIUM",
  });

  const [terminationForm, setTerminationForm] = useState({
    tenantRegistryId: "",
    justification: "",
  });

  const [bulkForm, setBulkForm] = useState({
    operationType: "TAG" as "TAG" | "ASSIGN" | "CLASSIFY",
    tagKey: "",
    tagValue: "",
    ownerId: "",
    classification: "STANDARD",
    filterProductId: "",
  });
  const [bulkPreviewId, setBulkPreviewId] = useState<string | null>(null);

  const canSearch = hasEdgePermission(permissions, "platform:tenant_management:search");
  const canAnalytics = hasEdgePermission(permissions, "platform:tenant_management:analytics:read");
  const canRegister = hasEdgePermission(permissions, "platform:tenant_management:register");
  const canExport = hasEdgePermission(permissions, "platform:tenant_management:export");
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
  const canMigrations = hasEdgePermission(
    permissions,
    "platform:tenant_management:migration:request",
  );
  const canMigrationApprove = hasEdgePermission(
    permissions,
    "platform:tenant_management:migration:approve",
  );
  const canRecoveries = hasEdgePermission(
    permissions,
    "platform:tenant_management:recovery:request",
  );
  const canRecoveryApprove = hasEdgePermission(
    permissions,
    "platform:tenant_management:recovery:approve",
  );
  const canTerminations = hasEdgePermission(
    permissions,
    "platform:tenant_management:termination:request",
  );
  const canTerminationApprove = hasEdgePermission(
    permissions,
    "platform:tenant_management:termination:approve",
  );
  const canReconciliation = hasEdgePermission(
    permissions,
    "platform:tenant_management:reconciliation:execute",
  );
  const canReconRemediate = hasEdgePermission(
    permissions,
    "platform:tenant_management:reconciliation:remediate",
  );
  const canBulk = hasEdgePermission(permissions, "platform:tenant_management:bulk:execute");

  const portfolioQ = useQuery({
    queryKey: ["tm", "portfolio"],
    queryFn: () => edgeApi.getTenantPortfolioAnalytics(),
    enabled: canAnalytics,
  });

  const tenantsQ = useQuery({
    queryKey: ["tm", "tenants", appliedFilters],
    queryFn: () =>
      edgeApi.listTenants({
        q: appliedFilters.q || undefined,
        administrativeStatus: appliedFilters.admin || undefined,
        technicalStatus: appliedFilters.tech || undefined,
        productId: appliedFilters.productId || undefined,
        region: appliedFilters.region || undefined,
        sortBy: appliedFilters.sortBy,
        sortDir: appliedFilters.sortDir,
        limit: appliedFilters.limit,
        offset: appliedFilters.offset,
      }),
    enabled: canSearch && tab === "registry",
  });

  const lifecycleQ = useQuery({
    queryKey: ["tm", "lifecycle-requests"],
    queryFn: () => edgeApi.listTenantLifecycleRequests({ limit: 50 }),
    enabled: canLifecycleList && tab === "lifecycle",
  });

  const exceptionsQ = useQuery({
    queryKey: ["tm", "exceptions"],
    queryFn: () => edgeApi.listTenantExceptions({ limit: 50 }),
    enabled: canExceptions && tab === "exceptions",
  });

  const migrationsQ = useQuery({
    queryKey: ["tm", "migrations"],
    queryFn: () => edgeApi.listTenantMigrations({ limit: 50 }),
    enabled: canMigrations && tab === "migrations",
  });

  const recoveriesQ = useQuery({
    queryKey: ["tm", "recoveries"],
    queryFn: () => edgeApi.listTenantRecoveries({ limit: 50 }),
    enabled: canRecoveries && tab === "recoveries",
  });

  const terminationsQ = useQuery({
    queryKey: ["tm", "terminations"],
    queryFn: () => edgeApi.listTenantTerminations({ limit: 50 }),
    enabled: canTerminations && tab === "terminations",
  });

  const findingsQ = useQuery({
    queryKey: ["tm", "findings"],
    queryFn: () => edgeApi.listTenantReconciliationFindings({ limit: 50 }),
    enabled: canReconciliation && tab === "reconciliation",
  });

  const reconRunsQ = useQuery({
    queryKey: ["tm", "recon-runs"],
    queryFn: () => edgeApi.listTenantReconciliationRuns({ limit: 20 }),
    enabled: canReconciliation && tab === "reconciliation",
  });

  const bulkOpsQ = useQuery({
    queryKey: ["tm", "bulk-ops"],
    queryFn: () => edgeApi.listBulkTenantOperations({ limit: 20 }),
    enabled: canBulk && tab === "bulk",
  });

  const tenants = unwrapInfraList<TenantRegistryRecord>(tenantsQ.data?.data);
  const lifecycle = unwrapInfraList<LifecycleRequestRecord>(lifecycleQ.data?.data);
  const exceptions = unwrapInfraList<ExceptionRecord>(exceptionsQ.data?.data);
  const migrations = unwrapInfraList<MigrationRequestRecord>(migrationsQ.data?.data);
  const recoveries = unwrapInfraList<RecoveryRequestRecord>(recoveriesQ.data?.data);
  const terminations = unwrapInfraList<TerminationRequestRecord>(terminationsQ.data?.data);
  const findings = unwrapInfraList<ReconciliationFindingRecord>(findingsQ.data?.data);
  const reconRuns = unwrapInfraList<ReconciliationRunRecord>(reconRunsQ.data?.data);
  const bulkOps = unwrapInfraList<TenantBulkOperationRecord>(bulkOpsQ.data?.data);

  const portfolio = portfolioQ.data?.data as TenantPortfolioMetrics | undefined;

  const invalidateTm = () => void qc.invalidateQueries({ queryKey: ["tm"] });

  const syncP7 = useMutation({
    mutationFn: () => edgeApi.syncTenantsFromP7(),
    onSuccess: invalidateTm,
  });

  const registerTenant = useMutation({
    mutationFn: () =>
      edgeApi.registerTenant({
        productTenantId: registerForm.productTenantId.trim(),
        tenantCode: registerForm.tenantCode.trim(),
        displayName: registerForm.displayName.trim(),
        productId: registerForm.productId.trim(),
        region: registerForm.region.trim() || undefined,
      }),
    onSuccess: () => {
      setRegisterForm({
        productTenantId: "",
        tenantCode: "",
        displayName: "",
        productId: "",
        region: "",
      });
      invalidateTm();
    },
  });

  const exportTenantsMut = useMutation({
    mutationFn: () =>
      edgeApi.exportTenants({
        q: appliedFilters.q || undefined,
        administrativeStatus: appliedFilters.admin || undefined,
        technicalStatus: appliedFilters.tech || undefined,
        productId: appliedFilters.productId || undefined,
        region: appliedFilters.region || undefined,
        sortBy: appliedFilters.sortBy,
        sortDir: appliedFilters.sortDir,
        format: "csv",
      }),
    onSuccess: (res) => {
      const blob = new Blob([res.data], {
        type: res.contentType ?? "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenants-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const approveLifecycle = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantLifecycleRequest(id),
    onSuccess: invalidateTm,
  });

  const rejectLifecycle = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.rejectTenantLifecycleRequest(id, { rejectedReason: reason }),
    onSuccess: () => {
      setRejectCtx(null);
      setRejectReason("");
      invalidateTm();
    },
  });

  const approveException = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantException(id),
    onSuccess: invalidateTm,
  });

  const requestException = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantException({
        tenantRegistryId: exceptionForm.tenantRegistryId.trim(),
        exceptionType: exceptionForm.exceptionType,
        description: exceptionForm.description.trim(),
        businessJustification: exceptionForm.businessJustification.trim(),
        startsAt: exceptionForm.startsAt,
        expiresAt: exceptionForm.expiresAt,
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      setExceptionForm((f) => ({
        ...f,
        description: "",
        businessJustification: "",
      }));
      invalidateTm();
    },
  });

  const revokeException = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.revokeTenantException(id, { revokeReason: reason }),
    onSuccess: invalidateTm,
  });

  const expireExceptions = useMutation({
    mutationFn: () => edgeApi.expireTenantExceptions(),
    onSuccess: invalidateTm,
  });

  const requestMigration = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantMigration({
        tenantRegistryId: migrationForm.tenantRegistryId.trim(),
        migrationType: migrationForm.migrationType,
        justification: migrationForm.justification.trim(),
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      setMigrationForm((f) => ({ ...f, justification: "" }));
      invalidateTm();
    },
  });

  const approveMigration = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantMigration(id),
    onSuccess: invalidateTm,
  });

  const rejectMigration = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.rejectTenantMigration(id, { rejectedReason: reason }),
    onSuccess: () => {
      setRejectCtx(null);
      setRejectReason("");
      invalidateTm();
    },
  });

  const requestRecovery = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantRecovery({
        tenantRegistryId: recoveryForm.tenantRegistryId.trim(),
        recoveryType: recoveryForm.recoveryType,
        justification: recoveryForm.justification.trim(),
        priority: recoveryForm.priority,
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      setRecoveryForm((f) => ({ ...f, justification: "" }));
      invalidateTm();
    },
  });

  const approveRecovery = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantRecovery(id),
    onSuccess: invalidateTm,
  });

  const rejectRecovery = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.rejectTenantRecovery(id, { rejectedReason: reason }),
    onSuccess: () => {
      setRejectCtx(null);
      setRejectReason("");
      invalidateTm();
    },
  });

  const requestTermination = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantTermination({
        tenantRegistryId: terminationForm.tenantRegistryId.trim(),
        justification: terminationForm.justification.trim(),
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      setTerminationForm({ tenantRegistryId: "", justification: "" });
      invalidateTm();
    },
  });

  const approveTermination = useMutation({
    mutationFn: (id: string) => edgeApi.approveTenantTermination(id),
    onSuccess: invalidateTm,
  });

  const rejectTermination = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.rejectTenantTermination(id, { rejectedReason: reason }),
    onSuccess: () => {
      setRejectCtx(null);
      setRejectReason("");
      invalidateTm();
    },
  });

  const runReconciliation = useMutation({
    mutationFn: () =>
      edgeApi.runTenantReconciliation({ dryRun: reconDryRun, mode: "FULL" }),
    onSuccess: invalidateTm,
  });

  const acknowledgeFinding = useMutation({
    mutationFn: (id: string) => edgeApi.acknowledgeTenantFinding(id),
    onSuccess: invalidateTm,
  });

  const previewBulk = useMutation({
    mutationFn: () => {
      const filter: Record<string, unknown> = {};
      if (bulkForm.filterProductId.trim()) {
        filter.productId = bulkForm.filterProductId.trim();
      }
      const payload: Record<string, unknown> = {};
      if (bulkForm.operationType === "TAG") {
        payload.tagKey = bulkForm.tagKey.trim();
        payload.tagValue = bulkForm.tagValue.trim();
      } else if (bulkForm.operationType === "ASSIGN") {
        payload.internalOwnerId = bulkForm.ownerId.trim();
      } else {
        payload.classification = bulkForm.classification;
      }
      return edgeApi.previewBulkTenantOperation({
        operationType: bulkForm.operationType,
        filter,
        payload,
        idempotencyKey: newIdempotencyKey(),
      });
    },
    onSuccess: (res) => {
      setBulkPreviewId(res.data?.id ?? null);
      invalidateTm();
    },
  });

  const executeBulk = useMutation({
    mutationFn: (id: string) => edgeApi.executeBulkTenantOperation(id),
    onSuccess: () => {
      setBulkPreviewId(null);
      invalidateTm();
    },
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
    setAppliedFilters({
      q: searchQ.trim(),
      admin: adminFilter.trim(),
      tech: techFilter.trim(),
      productId: productIdFilter.trim(),
      region: regionFilter.trim(),
      sortBy,
      sortDir,
      limit,
      offset,
    });
  }

  function confirmReject() {
    if (!rejectCtx || !rejectReason.trim()) return;
    const { kind, id } = rejectCtx;
    if (kind === "lifecycle") {
      rejectLifecycle.mutate({ id, reason: rejectReason.trim() });
    } else if (kind === "migration") {
      rejectMigration.mutate({ id, reason: rejectReason.trim() });
    } else if (kind === "recovery") {
      rejectRecovery.mutate({ id, reason: rejectReason.trim() });
    } else if (kind === "termination") {
      rejectTermination.mutate({ id, reason: rejectReason.trim() });
    }
  }

  const rejectPending =
    rejectLifecycle.isPending ||
    rejectMigration.isPending ||
    rejectRecovery.isPending ||
    rejectTermination.isPending;

  const actionError =
    syncP7.error ??
    registerTenant.error ??
    exportTenantsMut.error ??
    approveLifecycle.error ??
    rejectLifecycle.error ??
    approveException.error ??
    requestException.error ??
    revokeException.error ??
    expireExceptions.error ??
    requestMigration.error ??
    approveMigration.error ??
    rejectMigration.error ??
    requestRecovery.error ??
    approveRecovery.error ??
    rejectRecovery.error ??
    requestTermination.error ??
    approveTermination.error ??
    rejectTermination.error ??
    runReconciliation.error ??
    acknowledgeFinding.error ??
    previewBulk.error ??
    executeBulk.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="tm-module">
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
            <EdgeErrorState description={(portfolioQ.error as Error).message} />
          ) : portfolio ? (
            <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total tenants" value={portfolio.total} testId="tm-metric-total" />
              <MetricCard label="Active" value={portfolio.active} testId="tm-metric-active" />
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
              <MetricCard label="Degraded" value={portfolio.degraded} testId="tm-metric-degraded" />
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
              className="flex flex-col gap-[var(--space-3)]"
              data-testid="tm-registry-search"
            >
              <div className="grid gap-[var(--space-2)] md:grid-cols-2 lg:grid-cols-3">
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
                <input
                  className={fieldControlClass}
                  placeholder="Technical status"
                  value={techFilter}
                  onChange={(e) => setTechFilter(e.target.value)}
                  aria-label="Technical status filter"
                />
                <input
                  className={fieldControlClass}
                  placeholder="Product ID"
                  value={productIdFilter}
                  onChange={(e) => setProductIdFilter(e.target.value)}
                  aria-label="Product id filter"
                />
                <input
                  className={fieldControlClass}
                  placeholder="Region"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  aria-label="Region filter"
                />
                <select
                  className={fieldControlClass}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort by"
                >
                  <option value="updatedAt">updatedAt</option>
                  <option value="createdAt">createdAt</option>
                  <option value="displayName">displayName</option>
                  <option value="tenantCode">tenantCode</option>
                </select>
                <select
                  className={fieldControlClass}
                  value={sortDir}
                  onChange={(e) =>
                    setSortDir(e.target.value === "asc" ? "asc" : "desc")
                  }
                  aria-label="Sort direction"
                >
                  <option value="desc">desc</option>
                  <option value="asc">asc</option>
                </select>
                <input
                  className={fieldControlClass}
                  type="number"
                  min={1}
                  max={200}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 50)}
                  aria-label="Page limit"
                />
                <input
                  className={fieldControlClass}
                  type="number"
                  min={0}
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value) || 0)}
                  aria-label="Page offset"
                />
              </div>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                <Button type="submit">Search</Button>
                {canRegister ? (
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
                {canExport ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={exportTenantsMut.isPending}
                    onClick={() => exportTenantsMut.mutate()}
                    data-testid="tm-export-tenants"
                  >
                    {exportTenantsMut.isPending ? "Export…" : "Export CSV"}
                  </Button>
                ) : null}
              </div>
            </form>

            {canRegister ? (
              <Card data-testid="tm-register-form">
                <CardHeader title="Register tenant (manual)" />
                <CardBody>
                  <form
                    className="grid gap-[var(--space-2)] md:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      registerTenant.mutate();
                    }}
                  >
                    <input
                      className={fieldControlClass}
                      required
                      placeholder="productTenantId (UUID)"
                      value={registerForm.productTenantId}
                      onChange={(e) =>
                        setRegisterForm((f) => ({
                          ...f,
                          productTenantId: e.target.value,
                        }))
                      }
                      aria-label="Product tenant id"
                    />
                    <input
                      className={fieldControlClass}
                      required
                      placeholder="productId (UUID)"
                      value={registerForm.productId}
                      onChange={(e) =>
                        setRegisterForm((f) => ({ ...f, productId: e.target.value }))
                      }
                      aria-label="Product id"
                    />
                    <input
                      className={fieldControlClass}
                      required
                      placeholder="tenantCode"
                      value={registerForm.tenantCode}
                      onChange={(e) =>
                        setRegisterForm((f) => ({ ...f, tenantCode: e.target.value }))
                      }
                      aria-label="Tenant code"
                    />
                    <input
                      className={fieldControlClass}
                      required
                      placeholder="displayName"
                      value={registerForm.displayName}
                      onChange={(e) =>
                        setRegisterForm((f) => ({ ...f, displayName: e.target.value }))
                      }
                      aria-label="Display name"
                    />
                    <input
                      className={fieldControlClass}
                      placeholder="region"
                      value={registerForm.region}
                      onChange={(e) =>
                        setRegisterForm((f) => ({ ...f, region: e.target.value }))
                      }
                      aria-label="Region"
                    />
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={registerTenant.isPending}>
                        Register tenant
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            ) : null}

            {tenantsQ.isLoading ? (
              <EdgeLoadingState label="Loading tenant registry…" />
            ) : tenantsQ.isError ? (
              <EdgeErrorState description={(tenantsQ.error as Error).message} />
            ) : tenants.items.length === 0 ? (
              <EdgeEmptyState
                title="No tenants"
                description="Adjust filters or sync from P7 projections."
              />
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                <table
                  className="w-full min-w-[960px] text-left type-sm"
                  data-testid="tm-registry-table"
                >
                  <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="p-[var(--space-2)]">Tenant</th>
                      <th className="p-[var(--space-2)]">Product</th>
                      <th className="p-[var(--space-2)]">Account</th>
                      <th className="p-[var(--space-2)]">Class.</th>
                      <th className="p-[var(--space-2)]">Governance</th>
                      <th className="p-[var(--space-2)]">Risk</th>
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
                          <p className="type-xs text-[var(--text-muted)]">{t.tenantCode}</p>
                        </td>
                        <td className="p-[var(--space-2)]">
                          {t.productCode ?? t.productId.slice(0, 8)}
                        </td>
                        <td className="p-[var(--space-2)] type-xs">
                          {t.accountId ?? "—"}
                        </td>
                        <td className="p-[var(--space-2)]">{t.classification}</td>
                        <td className="p-[var(--space-2)]">
                          <Badge tone={statusTone(t.governanceStatus)}>
                            {t.governanceStatus}
                          </Badge>
                        </td>
                        <td className="p-[var(--space-2)]">
                          <Badge tone={statusTone(t.riskLevel)}>{t.riskLevel}</Badge>
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
                          <Badge tone={statusTone(t.healthStatus)}>{t.healthStatus}</Badge>
                        </td>
                        <td className="p-[var(--space-2)]">{t.region ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="type-xs text-[var(--text-muted)]">
              {tenants.total} tenant(s) · offset {appliedFilters.offset} limit{" "}
              {appliedFilters.limit} — health/status from API only.
            </p>
          </div>
        </EdgePermissionGate>
      )}

      {tab === "lifecycle" && (
        <EdgePermissionGate permission="platform:tenant_management:lifecycle:request">
          {lifecycleQ.isLoading ? (
            <EdgeLoadingState label="Loading lifecycle requests…" />
          ) : lifecycleQ.isError ? (
            <EdgeErrorState description={(lifecycleQ.error as Error).message} />
          ) : lifecycle.items.length === 0 ? (
            <EdgeEmptyState title="No lifecycle requests" />
          ) : (
            <GovernanceQueueList
              rows={lifecycle.items.map((r) => ({
                id: r.id,
                tenantRegistryId: r.tenantRegistryId,
                productTenantId: r.productTenantId,
                status: r.status,
                createdAt: r.createdAt,
                title: r.requestType,
                body: r.justification,
              }))}
              canApprove={canLifecycleApprove}
              pendingStatuses={PENDING_GOVERNANCE}
              onApprove={(id) => approveLifecycle.mutate(id)}
              onReject={(id) => setRejectCtx({ kind: "lifecycle", id })}
              approvePending={approveLifecycle.isPending}
              testIdPrefix="tm-lifecycle"
            />
          )}
          <RejectReasonCard
            title="Reject lifecycle request"
            rejectId={rejectCtx?.kind === "lifecycle" ? rejectCtx.id : ""}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onConfirm={confirmReject}
            onCancel={() => {
              setRejectCtx(null);
              setRejectReason("");
            }}
            pending={rejectPending}
            testId="tm-lifecycle-reject-form"
          />
        </EdgePermissionGate>
      )}

      {tab === "exceptions" && (
        <EdgePermissionGate permission="platform:tenant_management:exception:request">
          <Card>
            <CardHeader title="Request exception" />
            <CardBody>
              <form
                className="grid gap-[var(--space-2)] md:grid-cols-2"
                data-testid="tm-exception-request-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestException.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  required
                  placeholder="tenantRegistryId"
                  value={exceptionForm.tenantRegistryId}
                  onChange={(e) =>
                    setExceptionForm((f) => ({
                      ...f,
                      tenantRegistryId: e.target.value,
                    }))
                  }
                  aria-label="Tenant registry id"
                />
                <select
                  className={fieldControlClass}
                  value={exceptionForm.exceptionType}
                  onChange={(e) =>
                    setExceptionForm((f) => ({ ...f, exceptionType: e.target.value }))
                  }
                  aria-label="Exception type"
                >
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="POLICY">POLICY</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                </select>
                <input
                  className={fieldControlClass}
                  type="datetime-local"
                  required
                  value={exceptionForm.startsAt}
                  onChange={(e) =>
                    setExceptionForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                  aria-label="Starts at"
                />
                <input
                  className={fieldControlClass}
                  type="datetime-local"
                  required
                  value={exceptionForm.expiresAt}
                  onChange={(e) =>
                    setExceptionForm((f) => ({ ...f, expiresAt: e.target.value }))
                  }
                  aria-label="Expires at"
                />
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  required
                  rows={2}
                  placeholder="Description"
                  value={exceptionForm.description}
                  onChange={(e) =>
                    setExceptionForm((f) => ({ ...f, description: e.target.value }))
                  }
                  aria-label="Description"
                />
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  required
                  rows={2}
                  placeholder="Business justification"
                  value={exceptionForm.businessJustification}
                  onChange={(e) =>
                    setExceptionForm((f) => ({
                      ...f,
                      businessJustification: e.target.value,
                    }))
                  }
                  aria-label="Business justification"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={requestException.isPending}>
                    Submit exception request
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
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
            <EdgeErrorState description={(exceptionsQ.error as Error).message} />
          ) : exceptions.items.length === 0 ? (
            <EdgeEmptyState title="No exceptions" />
          ) : (
            <div className="flex flex-col gap-[var(--space-3)]" data-testid="tm-exceptions-list">
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
                    <div className="flex flex-wrap gap-[var(--space-2)]">
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
                      {canExceptionApprove && ex.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const reason = window.prompt("Revoke reason");
                            if (reason?.trim()) {
                              revokeException.mutate({
                                id: ex.id,
                                reason: reason.trim(),
                              });
                            }
                          }}
                          data-testid={`tm-exception-revoke-${ex.id}`}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "migrations" && (
        <EdgePermissionGate permission="platform:tenant_management:migration:request">
          <Card>
            <CardHeader title="Request migration" />
            <CardBody>
              <form
                className="grid gap-[var(--space-2)] md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestMigration.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  required
                  placeholder="tenantRegistryId"
                  value={migrationForm.tenantRegistryId}
                  onChange={(e) =>
                    setMigrationForm((f) => ({
                      ...f,
                      tenantRegistryId: e.target.value,
                    }))
                  }
                  aria-label="Tenant registry id"
                />
                <select
                  className={fieldControlClass}
                  value={migrationForm.migrationType}
                  onChange={(e) =>
                    setMigrationForm((f) => ({ ...f, migrationType: e.target.value }))
                  }
                  aria-label="Migration type"
                >
                  <option value="REGION">REGION</option>
                  <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                  <option value="DATABASE">DATABASE</option>
                </select>
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  required
                  rows={2}
                  placeholder="Justification"
                  value={migrationForm.justification}
                  onChange={(e) =>
                    setMigrationForm((f) => ({ ...f, justification: e.target.value }))
                  }
                  aria-label="Justification"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={requestMigration.isPending}>
                    Submit migration request
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          {migrationsQ.isLoading ? (
            <EdgeLoadingState label="Loading migrations…" />
          ) : migrations.items.length === 0 ? (
            <EdgeEmptyState title="No migration requests" />
          ) : (
            <GovernanceQueueList
              rows={migrations.items.map((r) => ({
                id: r.id,
                tenantRegistryId: r.tenantRegistryId,
                productTenantId: r.productTenantId,
                status: r.status,
                createdAt: r.createdAt,
                title: r.migrationType,
                body: r.justification,
              }))}
              canApprove={canMigrationApprove}
              pendingStatuses={PENDING_GOVERNANCE}
              onApprove={(id) => approveMigration.mutate(id)}
              onReject={(id) => setRejectCtx({ kind: "migration", id })}
              approvePending={approveMigration.isPending}
              testIdPrefix="tm-migrations"
            />
          )}
          <RejectReasonCard
            title="Reject migration request"
            rejectId={rejectCtx?.kind === "migration" ? rejectCtx.id : ""}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onConfirm={confirmReject}
            onCancel={() => {
              setRejectCtx(null);
              setRejectReason("");
            }}
            pending={rejectPending}
          />
        </EdgePermissionGate>
      )}

      {tab === "recoveries" && (
        <EdgePermissionGate permission="platform:tenant_management:recovery:request">
          <Card>
            <CardHeader title="Request recovery" />
            <CardBody>
              <form
                className="grid gap-[var(--space-2)] md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestRecovery.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  required
                  placeholder="tenantRegistryId"
                  value={recoveryForm.tenantRegistryId}
                  onChange={(e) =>
                    setRecoveryForm((f) => ({
                      ...f,
                      tenantRegistryId: e.target.value,
                    }))
                  }
                  aria-label="Tenant registry id"
                />
                <select
                  className={fieldControlClass}
                  value={recoveryForm.recoveryType}
                  onChange={(e) =>
                    setRecoveryForm((f) => ({ ...f, recoveryType: e.target.value }))
                  }
                  aria-label="Recovery type"
                >
                  <option value="FULL_TENANT">FULL_TENANT</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="DISASTER">DISASTER</option>
                </select>
                <select
                  className={fieldControlClass}
                  value={recoveryForm.priority}
                  onChange={(e) =>
                    setRecoveryForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  aria-label="Priority"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  required
                  rows={2}
                  placeholder="Justification"
                  value={recoveryForm.justification}
                  onChange={(e) =>
                    setRecoveryForm((f) => ({ ...f, justification: e.target.value }))
                  }
                  aria-label="Justification"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={requestRecovery.isPending}>
                    Submit recovery request
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          {recoveriesQ.isLoading ? (
            <EdgeLoadingState label="Loading recoveries…" />
          ) : recoveries.items.length === 0 ? (
            <EdgeEmptyState title="No recovery requests" />
          ) : (
            <GovernanceQueueList
              rows={recoveries.items.map((r) => ({
                id: r.id,
                tenantRegistryId: r.tenantRegistryId,
                productTenantId: r.productTenantId,
                status: r.status,
                createdAt: r.createdAt,
                title: r.recoveryType,
                subtitle: r.priority,
                body: r.justification,
              }))}
              canApprove={canRecoveryApprove}
              pendingStatuses={PENDING_GOVERNANCE}
              onApprove={(id) => approveRecovery.mutate(id)}
              onReject={(id) => setRejectCtx({ kind: "recovery", id })}
              approvePending={approveRecovery.isPending}
              testIdPrefix="tm-recoveries"
            />
          )}
          <RejectReasonCard
            title="Reject recovery request"
            rejectId={rejectCtx?.kind === "recovery" ? rejectCtx.id : ""}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onConfirm={confirmReject}
            onCancel={() => {
              setRejectCtx(null);
              setRejectReason("");
            }}
            pending={rejectPending}
          />
        </EdgePermissionGate>
      )}

      {tab === "terminations" && (
        <EdgePermissionGate permission="platform:tenant_management:termination:request">
          <Card>
            <CardHeader title="Request termination" />
            <CardBody>
              <form
                className="grid gap-[var(--space-2)] md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestTermination.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  required
                  placeholder="tenantRegistryId"
                  value={terminationForm.tenantRegistryId}
                  onChange={(e) =>
                    setTerminationForm((f) => ({
                      ...f,
                      tenantRegistryId: e.target.value,
                    }))
                  }
                  aria-label="Tenant registry id"
                />
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  required
                  rows={2}
                  placeholder="Justification"
                  value={terminationForm.justification}
                  onChange={(e) =>
                    setTerminationForm((f) => ({
                      ...f,
                      justification: e.target.value,
                    }))
                  }
                  aria-label="Justification"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={requestTermination.isPending}>
                    Submit termination request
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          {terminationsQ.isLoading ? (
            <EdgeLoadingState label="Loading terminations…" />
          ) : terminations.items.length === 0 ? (
            <EdgeEmptyState title="No termination requests" />
          ) : (
            <GovernanceQueueList
              rows={terminations.items.map((r) => ({
                id: r.id,
                tenantRegistryId: r.tenantRegistryId,
                productTenantId: r.productTenantId,
                status: r.status,
                createdAt: r.createdAt,
                title: "TERMINATION",
                body: r.justification,
              }))}
              canApprove={canTerminationApprove}
              pendingStatuses={PENDING_GOVERNANCE}
              onApprove={(id) => approveTermination.mutate(id)}
              onReject={(id) => setRejectCtx({ kind: "termination", id })}
              approvePending={approveTermination.isPending}
              testIdPrefix="tm-terminations"
            />
          )}
          <RejectReasonCard
            title="Reject termination request"
            rejectId={rejectCtx?.kind === "termination" ? rejectCtx.id : ""}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onConfirm={confirmReject}
            onCancel={() => {
              setRejectCtx(null);
              setRejectReason("");
            }}
            pending={rejectPending}
          />
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
          {reconRunsQ.isLoading ? (
            <EdgeLoadingState label="Loading reconciliation runs…" />
          ) : reconRuns.items.length === 0 ? (
            <EdgeEmptyState title="No reconciliation runs" />
          ) : (
            <div
              className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]"
              data-testid="tm-recon-runs-table"
            >
              <table className="w-full min-w-[640px] type-sm">
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-[var(--space-2)]">Mode</th>
                    <th className="p-[var(--space-2)]">Status</th>
                    <th className="p-[var(--space-2)]">Started</th>
                    <th className="p-[var(--space-2)]">Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {reconRuns.items.map((run) => (
                    <tr key={run.id} className="border-t border-[var(--border)]">
                      <td className="p-[var(--space-2)]">{run.mode}</td>
                      <td className="p-[var(--space-2)]">
                        <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                      </td>
                      <td className="p-[var(--space-2)]">{formatWhen(run.startedAt)}</td>
                      <td className="p-[var(--space-2)]">{formatWhen(run.finishedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {findingsQ.isLoading ? (
            <EdgeLoadingState label="Loading findings…" />
          ) : findingsQ.isError ? (
            <EdgeErrorState description={(findingsQ.error as Error).message} />
          ) : findings.items.length === 0 ? (
            <EdgeEmptyState title="No reconciliation findings" />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
              <table
                className="w-full min-w-[720px] type-sm"
                data-testid="tm-findings-table"
              >
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-[var(--space-2)]">Type</th>
                    <th className="p-[var(--space-2)]">Severity</th>
                    <th className="p-[var(--space-2)]">Status</th>
                    <th className="p-[var(--space-2)]">Description</th>
                    <th className="p-[var(--space-2)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.items.map((f) => (
                    <tr key={f.id} className="border-t border-[var(--border)]">
                      <td className="p-[var(--space-2)]">{f.findingType}</td>
                      <td className="p-[var(--space-2)]">
                        <Badge tone={statusTone(f.severity)}>{f.severity}</Badge>
                      </td>
                      <td className="p-[var(--space-2)]">{f.status}</td>
                      <td className="p-[var(--space-2)]">{f.description}</td>
                      <td className="p-[var(--space-2)]">
                        {canReconRemediate && f.status === "OPEN" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={acknowledgeFinding.isPending}
                            onClick={() => acknowledgeFinding.mutate(f.id)}
                            data-testid={`tm-finding-ack-${f.id}`}
                          >
                            Acknowledge
                          </Button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "bulk" && (
        <EdgePermissionGate permission="platform:tenant_management:bulk:execute">
          <Card data-testid="tm-bulk-form">
            <CardHeader title="Bulk operation (preview → execute)" />
            <CardBody className="grid gap-[var(--space-3)] md:grid-cols-2">
              <select
                className={fieldControlClass}
                value={bulkForm.operationType}
                onChange={(e) =>
                  setBulkForm((f) => ({
                    ...f,
                    operationType: e.target.value as "TAG" | "ASSIGN" | "CLASSIFY",
                  }))
                }
                aria-label="Bulk operation type"
              >
                <option value="TAG">TAG</option>
                <option value="ASSIGN">ASSIGN</option>
                <option value="CLASSIFY">CLASSIFY</option>
              </select>
              <input
                className={fieldControlClass}
                placeholder="Filter productId (optional)"
                value={bulkForm.filterProductId}
                onChange={(e) =>
                  setBulkForm((f) => ({ ...f, filterProductId: e.target.value }))
                }
                aria-label="Filter product id"
              />
              {bulkForm.operationType === "TAG" ? (
                <>
                  <input
                    className={fieldControlClass}
                    placeholder="tagKey"
                    value={bulkForm.tagKey}
                    onChange={(e) =>
                      setBulkForm((f) => ({ ...f, tagKey: e.target.value }))
                    }
                    aria-label="Tag key"
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="tagValue"
                    value={bulkForm.tagValue}
                    onChange={(e) =>
                      setBulkForm((f) => ({ ...f, tagValue: e.target.value }))
                    }
                    aria-label="Tag value"
                  />
                </>
              ) : null}
              {bulkForm.operationType === "ASSIGN" ? (
                <input
                  className={fieldControlClass}
                  placeholder="internalOwnerId"
                  value={bulkForm.ownerId}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, ownerId: e.target.value }))
                  }
                  aria-label="Owner id"
                />
              ) : null}
              {bulkForm.operationType === "CLASSIFY" ? (
                <input
                  className={fieldControlClass}
                  placeholder="classification"
                  value={bulkForm.classification}
                  onChange={(e) =>
                    setBulkForm((f) => ({ ...f, classification: e.target.value }))
                  }
                  aria-label="Classification"
                />
              ) : null}
              <div className="flex flex-wrap gap-[var(--space-2)] md:col-span-2">
                <Button
                  type="button"
                  disabled={previewBulk.isPending}
                  onClick={() => previewBulk.mutate()}
                >
                  {previewBulk.isPending ? "Preview…" : "Preview bulk"}
                </Button>
                {bulkPreviewId ? (
                  <Button
                    type="button"
                    disabled={executeBulk.isPending}
                    onClick={() => executeBulk.mutate(bulkPreviewId)}
                    data-testid="tm-bulk-execute"
                  >
                    Execute preview {bulkPreviewId.slice(0, 8)}
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>
          {bulkOpsQ.isLoading ? (
            <EdgeLoadingState label="Loading bulk operations…" />
          ) : bulkOps.items.length === 0 ? (
            <EdgeEmptyState title="No bulk operations" />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
              <table className="w-full type-sm" data-testid="tm-bulk-ops-table">
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-[var(--space-2)]">Type</th>
                    <th className="p-[var(--space-2)]">Status</th>
                    <th className="p-[var(--space-2)]">Preview count</th>
                    <th className="p-[var(--space-2)]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkOps.items.map((op) => (
                    <tr key={op.id} className="border-t border-[var(--border)]">
                      <td className="p-[var(--space-2)]">{op.operationType}</td>
                      <td className="p-[var(--space-2)]">{op.status}</td>
                      <td className="p-[var(--space-2)] tabular-nums">{op.previewCount}</td>
                      <td className="p-[var(--space-2)]">{formatWhen(op.createdAt)}</td>
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
            <EdgeErrorState description={(portfolioQ.error as Error).message} />
          ) : !portfolio ? (
            <EdgeEmptyState title="No analytics payload" />
          ) : (
            <div className="grid gap-[var(--space-4)] lg:grid-cols-2" data-testid="tm-analytics">
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
                      <li key={row.region || "unknown"} className="flex justify-between">
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