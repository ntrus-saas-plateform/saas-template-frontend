"use client";

/**
 * P8 — Tenant workspace (360 overview, profile, lifecycle, governance, activity).
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { hasEdgePermission } from "@/lib/edge/permissions";
import { unwrapInfraList } from "@/lib/edge/infrastructure";
import { edgeApi } from "@/lib/api/edge";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  ActivityEventRecord,
  ExceptionRecord,
  LifecycleRequestRecord,
  MigrationRequestRecord,
  ReconciliationFindingRecord,
  RecoveryRequestRecord,
  Tenant360Overview,
  TenantHealthSnapshotRecord,
  TenantRiskAssessmentRecord,
} from "@/types/edge-tenant-management";
import {
  ProjectionEmpty,
  SectionProjection,
  formatWhen,
  newIdempotencyKey,
  statusTone,
} from "./tenant-management-shared";

type WorkspaceTab =
  | "overview"
  | "profile"
  | "commercial"
  | "lifecycle"
  | "resources"
  | "applications"
  | "configuration"
  | "health"
  | "governance"
  | "risk"
  | "exceptions"
  | "migrations"
  | "recovery"
  | "reconciliation"
  | "activity";

export function EdgeTenantDetailModule({ tenantId }: { tenantId: string }) {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<WorkspaceTab>("overview");

  const canRead = hasEdgePermission(permissions, "platform:tenant_management:read");
  const canUpdate = hasEdgePermission(
    permissions,
    "platform:tenant_management:update_metadata",
  );
  const canLifecycle = hasEdgePermission(
    permissions,
    "platform:tenant_management:lifecycle:request",
  );
  const canTags = hasEdgePermission(
    permissions,
    "platform:tenant_management:manage_tags",
  );
  const canOwner = hasEdgePermission(
    permissions,
    "platform:tenant_management:assign_owner",
  );
  const canAudit = hasEdgePermission(
    permissions,
    "platform:tenant_management:audit:read",
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
  const canRecoveries = hasEdgePermission(
    permissions,
    "platform:tenant_management:recovery:request",
  );
  const canReconciliation = hasEdgePermission(
    permissions,
    "platform:tenant_management:reconciliation:execute",
  );
  const canReconRemediate = hasEdgePermission(
    permissions,
    "platform:tenant_management:reconciliation:remediate",
  );

  const overviewQ = useQuery({
    queryKey: ["tm", "360", tenantId],
    queryFn: () => edgeApi.getTenant360(tenantId),
    enabled: canRead && Boolean(tenantId),
  });

  const activityQ = useQuery({
    queryKey: ["tm", "activity", tenantId],
    queryFn: () => edgeApi.listTenantActivity(tenantId, { limit: 50 }),
    enabled: canAudit && tab === "activity" && Boolean(tenantId),
  });

  const lifecycleListQ = useQuery({
    queryKey: ["tm", "lifecycle", tenantId],
    queryFn: () =>
      edgeApi.listTenantLifecycleRequests({ tenantRegistryId: tenantId, limit: 50 }),
    enabled: canLifecycle && tab === "lifecycle",
  });

  const exceptionsQ = useQuery({
    queryKey: ["tm", "exceptions", tenantId],
    queryFn: () =>
      edgeApi.listTenantExceptions({ tenantRegistryId: tenantId, limit: 50 }),
    enabled: (canExceptions || canExceptionApprove) && tab === "exceptions",
  });

  const migrationsQ = useQuery({
    queryKey: ["tm", "migrations", tenantId],
    queryFn: () => edgeApi.listTenantMigrations({ tenantRegistryId: tenantId, limit: 50 }),
    enabled: canMigrations && tab === "migrations",
  });

  const recoveriesQ = useQuery({
    queryKey: ["tm", "recoveries", tenantId],
    queryFn: () => edgeApi.listTenantRecoveries({ tenantRegistryId: tenantId, limit: 50 }),
    enabled: canRecoveries && tab === "recovery",
  });

  const findingsQ = useQuery({
    queryKey: ["tm", "findings", tenantId],
    queryFn: () =>
      edgeApi.listTenantReconciliationFindings({
        tenantRegistryId: tenantId,
        limit: 50,
      }),
    enabled: canReconciliation && tab === "reconciliation",
  });

  const healthQ = useQuery({
    queryKey: ["tm", "health-snapshots", tenantId],
    queryFn: () => edgeApi.listTenantHealthSnapshots(tenantId, { limit: 50 }),
    enabled: canRead && tab === "health",
  });

  const riskQ = useQuery({
    queryKey: ["tm", "risk", tenantId],
    queryFn: () => edgeApi.listTenantRiskAssessments(tenantId, { limit: 50 }),
    enabled: canRead && tab === "risk",
  });

  const overview = overviewQ.data?.data as Tenant360Overview | null | undefined;
  const registry = overview?.registry;

  const activity = unwrapInfraList<ActivityEventRecord>(activityQ.data?.data);
  const lifecycleItems = unwrapInfraList<LifecycleRequestRecord>(lifecycleListQ.data?.data);
  const exceptions = unwrapInfraList<ExceptionRecord>(exceptionsQ.data?.data);
  const migrations = unwrapInfraList<MigrationRequestRecord>(migrationsQ.data?.data);
  const recoveries = unwrapInfraList<RecoveryRequestRecord>(recoveriesQ.data?.data);
  const findings = unwrapInfraList<ReconciliationFindingRecord>(findingsQ.data?.data);
  const healthSnapshots = unwrapInfraList<TenantHealthSnapshotRecord>(healthQ.data?.data);
  const riskAssessments = unwrapInfraList<TenantRiskAssessmentRecord>(riskQ.data?.data);

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    region: "",
    segment: "",
    classification: "",
    locale: "",
    timezone: "",
    deploymentProfile: "",
    supportClassification: "",
  });

  const [policiesForm, setPoliciesForm] = useState({
    legalHold: false,
    deletionProtection: true,
    dataResidencyRef: "",
    retentionPolicyRef: "",
    securityPolicyRef: "",
  });
  const [legalHoldConfirm, setLegalHoldConfirm] = useState(false);

  const [lifecycleForm, setLifecycleForm] = useState({
    requestType: "SUSPEND",
    justification: "",
    riskAssessment: "",
  });

  const [noteForm, setNoteForm] = useState({ body: "" });
  const [tagForm, setTagForm] = useState({ tagKey: "", tagValue: "" });
  const [ownerForm, setOwnerForm] = useState({
    internalOwnerId: "",
    operationalTeam: "",
  });

  const [exceptionForm, setExceptionForm] = useState({
    exceptionType: "OPERATIONAL",
    description: "",
    businessJustification: "",
    startsAt: "",
    expiresAt: "",
  });

  const [migrationForm, setMigrationForm] = useState({
    migrationType: "REGION",
    justification: "",
  });

  const [recoveryForm, setRecoveryForm] = useState({
    recoveryType: "FULL_TENANT",
    justification: "",
    priority: "MEDIUM",
  });

  const [healthForm, setHealthForm] = useState({
    overallStatus: "UNKNOWN",
    sourceSystem: "edge-console",
    observedAt: new Date().toISOString().slice(0, 16),
    staleAfter: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (registry) {
      setProfileForm({
        displayName: registry.displayName,
        region: registry.region ?? "",
        segment: registry.segment ?? "",
        classification: registry.classification,
        locale: registry.locale ?? "",
        timezone: registry.timezone ?? "",
        deploymentProfile: registry.deploymentProfile ?? "",
        supportClassification: registry.supportClassification ?? "",
      });
      setPoliciesForm({
        legalHold: registry.legalHold,
        deletionProtection: registry.deletionProtection,
        dataResidencyRef: registry.dataResidencyRef ?? "",
        retentionPolicyRef: registry.retentionPolicyRef ?? "",
        securityPolicyRef: registry.securityPolicyRef ?? "",
      });
      setOwnerForm({
        internalOwnerId: registry.internalOwnerId ?? "",
        operationalTeam: registry.operationalTeam ?? "",
      });
    }
  }, [registry]);

  const invalidate360 = () =>
    void qc.invalidateQueries({ queryKey: ["tm", "360", tenantId] });

  const updateMetadata = useMutation({
    mutationFn: () => {
      if (!registry) throw new Error("Missing registry");
      return edgeApi.updateTenantMetadata(tenantId, {
        expectedVersion: registry.version,
        displayName: profileForm.displayName,
        classification: profileForm.classification || undefined,
        segment: profileForm.segment || null,
        region: profileForm.region || null,
        locale: profileForm.locale || null,
        timezone: profileForm.timezone || null,
        supportClassification: profileForm.supportClassification || null,
        deploymentProfile: profileForm.deploymentProfile || null,
      });
    },
    onSuccess: invalidate360,
  });

  const updatePolicies = useMutation({
    mutationFn: () => {
      if (!registry) throw new Error("Missing registry");
      return edgeApi.updateTenantPolicies(tenantId, {
        expectedVersion: registry.version,
        legalHold: policiesForm.legalHold,
        deletionProtection: policiesForm.deletionProtection,
        dataResidencyRef: policiesForm.dataResidencyRef || null,
        retentionPolicyRef: policiesForm.retentionPolicyRef || null,
        securityPolicyRef: policiesForm.securityPolicyRef || null,
      });
    },
    onSuccess: () => {
      setLegalHoldConfirm(false);
      invalidate360();
    },
  });

  const requestLifecycle = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantLifecycle(tenantId, {
        requestType: lifecycleForm.requestType,
        justification: lifecycleForm.justification,
        idempotencyKey: newIdempotencyKey(),
        riskAssessment: lifecycleForm.riskAssessment || undefined,
      }),
    onSuccess: () => {
      setLifecycleForm((f) => ({ ...f, justification: "", riskAssessment: "" }));
      void qc.invalidateQueries({ queryKey: ["tm"] });
    },
  });

  const requestException = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantException({
        tenantRegistryId: tenantId,
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
      void qc.invalidateQueries({ queryKey: ["tm"] });
    },
  });

  const revokeException = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      edgeApi.revokeTenantException(id, { revokeReason: reason }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm"] }),
  });

  const requestMigration = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantMigration({
        tenantRegistryId: tenantId,
        migrationType: migrationForm.migrationType,
        justification: migrationForm.justification.trim(),
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      setMigrationForm((f) => ({ ...f, justification: "" }));
      void qc.invalidateQueries({ queryKey: ["tm"] });
    },
  });

  const requestRecovery = useMutation({
    mutationFn: () =>
      edgeApi.requestTenantRecovery({
        tenantRegistryId: tenantId,
        recoveryType: recoveryForm.recoveryType,
        justification: recoveryForm.justification.trim(),
        priority: recoveryForm.priority,
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: () => {
      setRecoveryForm((f) => ({ ...f, justification: "" }));
      void qc.invalidateQueries({ queryKey: ["tm"] });
    },
  });

  const recordHealth = useMutation({
    mutationFn: () =>
      edgeApi.recordTenantHealthSnapshot(tenantId, {
        overallStatus: healthForm.overallStatus,
        sourceSystem: healthForm.sourceSystem.trim(),
        observedAt: new Date(healthForm.observedAt).toISOString(),
        staleAfter: new Date(healthForm.staleAfter).toISOString(),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm", "health-snapshots", tenantId] }),
  });

  const evaluateRisk = useMutation({
    mutationFn: () => edgeApi.evaluateTenantRisk(tenantId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tm", "risk", tenantId] });
      invalidate360();
    },
  });

  const acknowledgeFinding = useMutation({
    mutationFn: (id: string) => edgeApi.acknowledgeTenantFinding(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm", "findings", tenantId] }),
  });

  const addNote = useMutation({
    mutationFn: () =>
      edgeApi.addTenantNote(tenantId, { body: noteForm.body, noteType: "GENERAL" }),
    onSuccess: () => {
      setNoteForm({ body: "" });
      invalidate360();
    },
  });

  const addTag = useMutation({
    mutationFn: () => edgeApi.addTenantTag(tenantId, tagForm),
    onSuccess: () => {
      setTagForm({ tagKey: "", tagValue: "" });
      invalidate360();
    },
  });

  const removeTag = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      edgeApi.removeTenantTag(tenantId, key, value),
    onSuccess: invalidate360,
  });

  const assignOwner = useMutation({
    mutationFn: () => {
      if (!registry) throw new Error("Missing registry");
      return edgeApi.assignTenantOwner(tenantId, {
        expectedVersion: registry.version,
        internalOwnerId: ownerForm.internalOwnerId || null,
        operationalTeam: ownerForm.operationalTeam || null,
      });
    },
    onSuccess: invalidate360,
  });

  const workspaceTabs = useMemo(
    () =>
      [
        { id: "overview", label: "Overview", show: canRead },
        { id: "profile", label: "Profile", show: canUpdate },
        { id: "commercial", label: "Commercial", show: canRead },
        { id: "lifecycle", label: "Lifecycle", show: canLifecycle },
        { id: "resources", label: "Resources", show: canRead },
        { id: "applications", label: "Applications", show: canRead },
        { id: "configuration", label: "Configuration", show: canRead },
        { id: "health", label: "Health", show: canRead },
        { id: "governance", label: "Governance", show: canRead },
        { id: "risk", label: "Risk", show: canRead },
        { id: "exceptions", label: "Exceptions", show: canExceptions || canExceptionApprove },
        { id: "migrations", label: "Migrations", show: canMigrations },
        { id: "recovery", label: "Recovery", show: canRecoveries },
        { id: "reconciliation", label: "Reconciliation", show: canReconciliation },
        { id: "activity", label: "Activity", show: canAudit },
      ].filter((t) => t.show),
    [
      canRead,
      canUpdate,
      canLifecycle,
      canExceptions,
      canExceptionApprove,
      canMigrations,
      canRecoveries,
      canReconciliation,
      canAudit,
    ],
  );

  if (!canRead) {
    return <EdgeForbiddenState />;
  }

  if (overviewQ.isLoading) {
    return <EdgeLoadingState label="Loading tenant 360…" />;
  }

  if (overviewQ.isError) {
    return <EdgeErrorState description={(overviewQ.error as Error).message} />;
  }

  if (!overview || !registry) {
    return (
      <EdgeEmptyState
        title="Tenant not found"
        description="Return to Tenant Management from the platform nav."
      />
    );
  }

  const healthStatus = overview.health.status;
  const healthFreshness = overview.health.freshness;

  const actionError =
    updateMetadata.error ??
    updatePolicies.error ??
    requestLifecycle.error ??
    requestException.error ??
    revokeException.error ??
    requestMigration.error ??
    requestRecovery.error ??
    recordHealth.error ??
    evaluateRisk.error ??
    acknowledgeFinding.error ??
    addNote.error ??
    addTag.error ??
    removeTag.error ??
    assignOwner.error;

  function renderProjectionItems(
    section: Tenant360Overview["resources"],
    label: string,
  ) {
    const availability = section?.availability ?? "UNKNOWN";
    if (!section || availability === "UNAVAILABLE" || availability === "UNKNOWN") {
      return <ProjectionEmpty label={label} />;
    }
    if (!section.items?.length) {
      return <p className="type-sm text-[var(--text-muted)]">No items in projection.</p>;
    }
    return (
      <ul className="space-y-1 type-sm">
        {section.items.map((item, idx) => (
          <li key={idx} className="rounded border border-[var(--border)] p-2">
            <pre className="type-xs whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="flex flex-col gap-[var(--space-6)]"
      data-testid="tm-detail-module"
    >
      {actionError ? (
        <Alert tone="error" title="Action refusée">
          {(actionError as Error).message}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-[var(--space-2)] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{registry.displayName}</h2>
          <p className="type-sm text-[var(--text-muted)]">
            {registry.tenantCode} · v{registry.version}
          </p>
        </div>
        <div className="flex flex-wrap gap-[var(--space-2)]">
          <Badge tone={statusTone(registry.administrativeStatus)}>
            {registry.administrativeStatus}
          </Badge>
          <Badge tone={statusTone(registry.technicalStatus)}>
            {registry.technicalStatus}
          </Badge>
          <Badge tone={statusTone(healthStatus)}>{healthStatus}</Badge>
        </div>
      </div>

      <Tabs
        tabs={workspaceTabs.map(({ id, label }) => ({ id, label }))}
        value={tab}
        onChange={(id) => setTab(id as WorkspaceTab)}
      />

      {tab === "overview" && (
        <div
          className="grid gap-[var(--space-4)] lg:grid-cols-2"
          data-testid="tm-detail-overview"
        >
          <Card>
            <CardHeader title="Technical projection" />
            <CardBody className="space-y-[var(--space-2)] type-sm">
              <p>
                Status:{" "}
                <Badge tone={statusTone(overview.technical.technicalStatus)}>
                  {overview.technical.technicalStatus}
                </Badge>
              </p>
              <p>
                Freshness:{" "}
                <Badge tone={statusTone(overview.technical.freshness)}>
                  {overview.technical.freshness}
                </Badge>
              </p>
              <p>Observed at: {formatWhen(overview.technical.observedAt)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Health summary" />
            <CardBody className="space-y-[var(--space-2)] type-sm">
              <p data-testid="tm-detail-health">
                Status:{" "}
                <Badge tone={statusTone(healthStatus)}>{healthStatus}</Badge>
              </p>
              <p data-testid="tm-health-freshness">
                Freshness:{" "}
                <Badge tone={statusTone(healthFreshness)}>{healthFreshness}</Badge>
              </p>
              <p>Observed at: {formatWhen(overview.health.observedAt)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Commercial linkage" />
            <CardBody className="space-y-[var(--space-2)] type-sm">
              <p>
                Availability:{" "}
                <Badge tone={statusTone(overview.commercial.availability)}>
                  {overview.commercial.availability}
                </Badge>
              </p>
              <p>Account: {overview.commercial.accountId ?? "—"}</p>
              <p>Subscription: {overview.commercial.subscriptionId ?? "—"}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Governance signals" />
            <CardBody className="grid grid-cols-3 gap-[var(--space-2)] type-sm">
              <GovernanceStat label="Exceptions" value={overview.openExceptions} />
              <GovernanceStat
                label="Lifecycle"
                value={overview.pendingLifecycleRequests}
              />
              <GovernanceStat label="Findings" value={overview.openFindings} />
            </CardBody>
          </Card>
          {overview.timeline?.length ? (
            <Card className="lg:col-span-2">
              <CardHeader title="Timeline" />
              <CardBody>
                <ul className="space-y-2 type-sm">
                  {overview.timeline.map((ev) => (
                    <li key={ev.id}>
                      {formatWhen(ev.occurredAt)} — {ev.label}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : (
            <Card className="lg:col-span-2">
              <CardBody>
                <ProjectionEmpty label="Timeline" />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === "commercial" && (
        <Card data-testid="tm-detail-commercial">
          <CardBody className="space-y-[var(--space-2)] type-sm">
            <p>
              Availability:{" "}
              <Badge tone={statusTone(overview.commercial.availability)}>
                {overview.commercial.availability}
              </Badge>
            </p>
            <p>Product: {overview.commercial.productId}</p>
            <p>Account: {overview.commercial.accountId ?? "—"}</p>
            <p>Subscription: {overview.commercial.subscriptionId ?? "—"}</p>
            <p>Synced: {formatWhen(overview.commercial.syncedAt)}</p>
            <p className="type-xs text-[var(--text-muted)]">
              Source: {overview.commercial.source}
            </p>
          </CardBody>
        </Card>
      )}

      {tab === "profile" && (
        <EdgePermissionGate permission="platform:tenant_management:update_metadata">
          <Card>
            <CardHeader title="Metadata" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMetadata.mutate();
                }}
                className="grid gap-[var(--space-3)] md:grid-cols-2"
                data-testid="tm-profile-form"
              >
                <input
                  className={fieldControlClass}
                  value={profileForm.displayName}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  aria-label="Display name"
                  required
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.classification}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, classification: e.target.value }))
                  }
                  aria-label="Classification"
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.region}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, region: e.target.value }))
                  }
                  aria-label="Region"
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.segment}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, segment: e.target.value }))
                  }
                  aria-label="Segment"
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.locale}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, locale: e.target.value }))
                  }
                  aria-label="Locale"
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.timezone}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, timezone: e.target.value }))
                  }
                  aria-label="Timezone"
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.deploymentProfile}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      deploymentProfile: e.target.value,
                    }))
                  }
                  aria-label="Deployment profile"
                />
                <input
                  className={fieldControlClass}
                  value={profileForm.supportClassification}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      supportClassification: e.target.value,
                    }))
                  }
                  aria-label="Support classification"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={updateMetadata.isPending}>
                    Save metadata
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card data-testid="tm-policies-form">
            <CardHeader title="Policies" />
            <CardBody>
              <form
                className="grid gap-[var(--space-3)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (policiesForm.legalHold && !legalHoldConfirm) return;
                  updatePolicies.mutate();
                }}
              >
                <label className="flex items-center gap-2 type-sm">
                  <input
                    type="checkbox"
                    checked={policiesForm.legalHold}
                    onChange={(e) => {
                      setPoliciesForm((f) => ({
                        ...f,
                        legalHold: e.target.checked,
                      }));
                      if (!e.target.checked) setLegalHoldConfirm(false);
                    }}
                  />
                  Legal hold
                </label>
                {policiesForm.legalHold ? (
                  <label className="flex items-center gap-2 type-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={legalHoldConfirm}
                      onChange={(e) => setLegalHoldConfirm(e.target.checked)}
                    />
                    Confirm legal hold activation
                  </label>
                ) : null}
                <label className="flex items-center gap-2 type-sm">
                  <input
                    type="checkbox"
                    checked={policiesForm.deletionProtection}
                    onChange={(e) =>
                      setPoliciesForm((f) => ({
                        ...f,
                        deletionProtection: e.target.checked,
                      }))
                    }
                  />
                  Deletion protection
                </label>
                <input
                  className={fieldControlClass}
                  placeholder="dataResidencyRef"
                  value={policiesForm.dataResidencyRef}
                  onChange={(e) =>
                    setPoliciesForm((f) => ({
                      ...f,
                      dataResidencyRef: e.target.value,
                    }))
                  }
                  aria-label="Data residency ref"
                />
                <input
                  className={fieldControlClass}
                  placeholder="retentionPolicyRef"
                  value={policiesForm.retentionPolicyRef}
                  onChange={(e) =>
                    setPoliciesForm((f) => ({
                      ...f,
                      retentionPolicyRef: e.target.value,
                    }))
                  }
                  aria-label="Retention policy ref"
                />
                <input
                  className={fieldControlClass}
                  placeholder="securityPolicyRef"
                  value={policiesForm.securityPolicyRef}
                  onChange={(e) =>
                    setPoliciesForm((f) => ({
                      ...f,
                      securityPolicyRef: e.target.value,
                    }))
                  }
                  aria-label="Security policy ref"
                />
                <Button
                  type="submit"
                  disabled={
                    updatePolicies.isPending ||
                    (policiesForm.legalHold && !legalHoldConfirm)
                  }
                >
                  Save policies
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteForm.body.trim()) return;
                  addNote.mutate();
                }}
                className="flex flex-col gap-[var(--space-2)]"
              >
                <textarea
                  className={fieldControlClass}
                  rows={3}
                  required
                  value={noteForm.body}
                  onChange={(e) => setNoteForm({ body: e.target.value })}
                  aria-label="Note body"
                  data-testid="tm-note-input"
                />
                <Button type="submit" disabled={addNote.isPending}>
                  Add note
                </Button>
              </form>
              {overview.notes.length > 0 ? (
                <ul className="mt-[var(--space-4)] space-y-[var(--space-2)] type-sm">
                  {overview.notes.map((n) => (
                    <li key={n.id} className="border-t border-[var(--border)] pt-2">
                      <p>{n.body}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {formatWhen(n.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardBody>
          </Card>
        </EdgePermissionGate>
      )}

      {tab === "lifecycle" && (
        <EdgePermissionGate permission="platform:tenant_management:lifecycle:request">
          <Card>
            <CardHeader title="Request lifecycle action" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!lifecycleForm.justification.trim()) return;
                  requestLifecycle.mutate();
                }}
                className="grid gap-[var(--space-3)] md:grid-cols-2"
                data-testid="tm-lifecycle-form"
              >
                <select
                  className={fieldControlClass}
                  value={lifecycleForm.requestType}
                  onChange={(e) =>
                    setLifecycleForm((f) => ({ ...f, requestType: e.target.value }))
                  }
                  aria-label="Request type"
                >
                  <option value="SUSPEND">SUSPEND</option>
                  <option value="RESUME">RESUME</option>
                  <option value="TERMINATE">TERMINATE</option>
                </select>
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  rows={2}
                  required
                  placeholder="Justification"
                  value={lifecycleForm.justification}
                  onChange={(e) =>
                    setLifecycleForm((f) => ({
                      ...f,
                      justification: e.target.value,
                    }))
                  }
                  aria-label="Justification"
                />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={requestLifecycle.isPending}>
                    Submit request
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          {lifecycleListQ.isLoading ? (
            <EdgeLoadingState label="Loading lifecycle requests…" />
          ) : lifecycleItems.items.length === 0 ? (
            <EdgeEmptyState title="No lifecycle requests for tenant" />
          ) : (
            <ul className="space-y-2 type-sm" data-testid="tm-lifecycle-list">
              {lifecycleItems.items.map((r) => (
                <li key={r.id} className="rounded border border-[var(--border)] p-2">
                  {r.requestType}{" "}
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge> ·{" "}
                  {formatWhen(r.createdAt)}
                </li>
              ))}
            </ul>
          )}
        </EdgePermissionGate>
      )}

      {tab === "resources" && (
        <SectionProjection
          title="Resources"
          availability={overview.resources?.availability}
          testId="tm-detail-resources"
        >
          {renderProjectionItems(overview.resources, "Resources")}
        </SectionProjection>
      )}

      {tab === "applications" && (
        <SectionProjection
          title="Applications"
          availability={overview.applications?.availability}
          testId="tm-detail-applications"
        >
          {renderProjectionItems(overview.applications, "Applications")}
        </SectionProjection>
      )}

      {tab === "configuration" && (
        <SectionProjection
          title="Configuration"
          availability={overview.configuration?.availability}
          testId="tm-detail-configuration"
        >
          {renderProjectionItems(overview.configuration, "Configuration")}
        </SectionProjection>
      )}

      {tab === "health" && (
        <div className="flex flex-col gap-[var(--space-4)]">
          <Card>
            <CardHeader title="Registry health signal" />
            <CardBody className="type-sm space-y-1">
              <p>
                Status: <Badge tone={statusTone(healthStatus)}>{healthStatus}</Badge>
              </p>
              <p>Observed: {formatWhen(overview.health.observedAt)}</p>
              {overview.latestHealthSnapshot ? (
                <p>
                  Latest snapshot:{" "}
                  <Badge tone={statusTone(overview.latestHealthSnapshot.overallStatus)}>
                    {overview.latestHealthSnapshot.overallStatus}
                  </Badge>
                </p>
              ) : (
                <ProjectionEmpty label="Latest health snapshot in 360" />
              )}
            </CardBody>
          </Card>
          {canUpdate ? (
            <Card data-testid="tm-health-record-form">
              <CardHeader title="Record health snapshot" />
              <CardBody>
                <form
                  className="grid gap-[var(--space-2)] md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    recordHealth.mutate();
                  }}
                >
                  <select
                    className={fieldControlClass}
                    value={healthForm.overallStatus}
                    onChange={(e) =>
                      setHealthForm((f) => ({ ...f, overallStatus: e.target.value }))
                    }
                    aria-label="Overall status"
                  >
                    <option value="UNKNOWN">UNKNOWN</option>
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="DEGRADED">DEGRADED</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                  <input
                    className={fieldControlClass}
                    required
                    value={healthForm.sourceSystem}
                    onChange={(e) =>
                      setHealthForm((f) => ({ ...f, sourceSystem: e.target.value }))
                    }
                    aria-label="Source system"
                  />
                  <input
                    className={fieldControlClass}
                    type="datetime-local"
                    required
                    value={healthForm.observedAt}
                    onChange={(e) =>
                      setHealthForm((f) => ({ ...f, observedAt: e.target.value }))
                    }
                    aria-label="Observed at"
                  />
                  <input
                    className={fieldControlClass}
                    type="datetime-local"
                    required
                    value={healthForm.staleAfter}
                    onChange={(e) =>
                      setHealthForm((f) => ({ ...f, staleAfter: e.target.value }))
                    }
                    aria-label="Stale after"
                  />
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={recordHealth.isPending}>
                      Record snapshot
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : null}
          {healthQ.isLoading ? (
            <EdgeLoadingState label="Loading health snapshots…" />
          ) : healthSnapshots.items.length === 0 ? (
            <EdgeEmptyState title="No health snapshots" />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
              <table className="w-full type-sm" data-testid="tm-health-snapshots-table">
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-2">Status</th>
                    <th className="p-2">Source</th>
                    <th className="p-2">Observed</th>
                  </tr>
                </thead>
                <tbody>
                  {healthSnapshots.items.map((s) => (
                    <tr key={s.id} className="border-t border-[var(--border)]">
                      <td className="p-2">
                        <Badge tone={statusTone(s.overallStatus)}>
                          {s.overallStatus}
                        </Badge>
                      </td>
                      <td className="p-2">{s.sourceSystem}</td>
                      <td className="p-2">{formatWhen(s.observedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "governance" && (
        <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
          <Card>
            <CardHeader title="Tags" />
            <CardBody className="space-y-[var(--space-3)]">
              <ul className="flex flex-wrap gap-[var(--space-2)] type-sm">
                {overview.tags.length === 0 ? (
                  <li className="text-[var(--text-muted)]">No tags</li>
                ) : (
                  overview.tags.map((t) => (
                    <li key={t.id}>
                      <Badge tone="default">
                        {t.tagKey}={t.tagValue}
                        {canTags ? (
                          <button
                            type="button"
                            className="ml-1"
                            onClick={() =>
                              removeTag.mutate({
                                key: t.tagKey,
                                value: t.tagValue,
                              })
                            }
                            aria-label={`Remove tag ${t.tagKey}`}
                          >
                            ×
                          </button>
                        ) : null}
                      </Badge>
                    </li>
                  ))
                )}
              </ul>
              {canTags ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!tagForm.tagKey.trim() || !tagForm.tagValue.trim()) return;
                    addTag.mutate();
                  }}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    className={fieldControlClass}
                    placeholder="tagKey"
                    value={tagForm.tagKey}
                    onChange={(e) =>
                      setTagForm((f) => ({ ...f, tagKey: e.target.value }))
                    }
                    aria-label="Tag key"
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="tagValue"
                    value={tagForm.tagValue}
                    onChange={(e) =>
                      setTagForm((f) => ({ ...f, tagValue: e.target.value }))
                    }
                    aria-label="Tag value"
                  />
                  <Button type="submit" disabled={addTag.isPending}>
                    Add tag
                  </Button>
                </form>
              ) : null}
            </CardBody>
          </Card>
          {canOwner ? (
            <Card>
              <CardHeader title="Owner assignment" />
              <CardBody>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    assignOwner.mutate();
                  }}
                  className="flex flex-col gap-2"
                >
                  <input
                    className={fieldControlClass}
                    value={ownerForm.internalOwnerId}
                    onChange={(e) =>
                      setOwnerForm((f) => ({
                        ...f,
                        internalOwnerId: e.target.value,
                      }))
                    }
                    aria-label="Internal owner id"
                  />
                  <input
                    className={fieldControlClass}
                    value={ownerForm.operationalTeam}
                    onChange={(e) =>
                      setOwnerForm((f) => ({
                        ...f,
                        operationalTeam: e.target.value,
                      }))
                    }
                    aria-label="Operational team"
                  />
                  <Button type="submit" disabled={assignOwner.isPending}>
                    Assign owner
                  </Button>
                </form>
              </CardBody>
            </Card>
          ) : null}
          <Card className="lg:col-span-2">
            <CardHeader title="Governance posture" />
            <CardBody className="flex flex-wrap gap-[var(--space-3)] type-sm">
              <Badge tone={statusTone(registry.governanceStatus)}>
                {registry.governanceStatus}
              </Badge>
              <Badge tone={statusTone(registry.riskLevel)}>
                Risk: {registry.riskLevel}
              </Badge>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "risk" && (
        <div className="flex flex-col gap-[var(--space-4)]">
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-2 type-sm">
              <p>
                Registry risk:{" "}
                <Badge tone={statusTone(registry.riskLevel)}>{registry.riskLevel}</Badge>
              </p>
              {overview.risk ? (
                <p>
                  360 risk projection: {overview.risk.level} (
                  {overview.risk.availability})
                </p>
              ) : (
                <ProjectionEmpty label="Risk projection in 360" />
              )}
              {canUpdate ? (
                <Button
                  type="button"
                  disabled={evaluateRisk.isPending}
                  onClick={() => evaluateRisk.mutate()}
                  data-testid="tm-evaluate-risk"
                >
                  Evaluate risk
                </Button>
              ) : null}
            </CardBody>
          </Card>
          {riskQ.isLoading ? (
            <EdgeLoadingState label="Loading risk assessments…" />
          ) : riskAssessments.items.length === 0 ? (
            <EdgeEmptyState title="No risk assessments" />
          ) : (
            <ul className="space-y-2 type-sm" data-testid="tm-risk-list">
              {riskAssessments.items.map((ra) => (
                <li key={ra.id} className="rounded border border-[var(--border)] p-2">
                  <Badge tone={statusTone(ra.riskLevel)}>{ra.riskLevel}</Badge> · rule{" "}
                  {ra.ruleVersion} · {formatWhen(ra.evaluatedAt)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "exceptions" && (
        <EdgePermissionGate permission="platform:tenant_management:exception:request">
          <Card>
            <CardHeader title="Request exception" />
            <CardBody>
              <form
                className="grid gap-2 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestException.mutate();
                }}
                data-testid="tm-detail-exception-form"
              >
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
                    Submit exception
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          {exceptions.items.map((ex) => (
            <Card key={ex.id}>
              <CardBody className="flex justify-between gap-2 type-sm">
                <span>
                  {ex.exceptionType}{" "}
                  <Badge tone={statusTone(ex.status)}>{ex.status}</Badge>
                </span>
                {canExceptionApprove && ex.status === "ACTIVE" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const reason = window.prompt("Revoke reason");
                      if (reason?.trim()) {
                        revokeException.mutate({ id: ex.id, reason: reason.trim() });
                      }
                    }}
                  >
                    Revoke
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </EdgePermissionGate>
      )}

      {tab === "migrations" && (
        <EdgePermissionGate permission="platform:tenant_management:migration:request">
          <Card>
            <CardHeader title="Request migration" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  requestMigration.mutate();
                }}
                className="grid gap-2"
              >
                <select
                  className={fieldControlClass}
                  value={migrationForm.migrationType}
                  onChange={(e) =>
                    setMigrationForm((f) => ({ ...f, migrationType: e.target.value }))
                  }
                  aria-label="Migration type"
                >
                  <option value="REGION">REGION</option>
                  <option value="DATABASE">DATABASE</option>
                </select>
                <textarea
                  className={fieldControlClass}
                  required
                  rows={2}
                  value={migrationForm.justification}
                  onChange={(e) =>
                    setMigrationForm((f) => ({ ...f, justification: e.target.value }))
                  }
                  aria-label="Justification"
                />
                <Button type="submit" disabled={requestMigration.isPending}>
                  Submit migration
                </Button>
              </form>
            </CardBody>
          </Card>
          {migrations.items.map((m) => (
            <Card key={m.id}>
              <CardBody className="type-sm">
                {m.migrationType}{" "}
                <Badge tone={statusTone(m.status)}>{m.status}</Badge>
              </CardBody>
            </Card>
          ))}
        </EdgePermissionGate>
      )}

      {tab === "recovery" && (
        <EdgePermissionGate permission="platform:tenant_management:recovery:request">
          <Card>
            <CardHeader title="Request recovery" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  requestRecovery.mutate();
                }}
                className="grid gap-2"
              >
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
                </select>
                <textarea
                  className={fieldControlClass}
                  required
                  rows={2}
                  value={recoveryForm.justification}
                  onChange={(e) =>
                    setRecoveryForm((f) => ({ ...f, justification: e.target.value }))
                  }
                  aria-label="Justification"
                />
                <Button type="submit" disabled={requestRecovery.isPending}>
                  Submit recovery
                </Button>
              </form>
            </CardBody>
          </Card>
          {recoveries.items.map((r) => (
            <Card key={r.id}>
              <CardBody className="type-sm">
                {r.recoveryType}{" "}
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </CardBody>
            </Card>
          ))}
        </EdgePermissionGate>
      )}

      {tab === "reconciliation" && (
        <EdgePermissionGate permission="platform:tenant_management:reconciliation:execute">
          {findingsQ.isLoading ? (
            <EdgeLoadingState label="Loading findings…" />
          ) : findings.items.length === 0 ? (
            <EdgeEmptyState title="No reconciliation findings for tenant" />
          ) : (
            <div
              className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]"
              data-testid="tm-detail-findings-table"
            >
              <table className="w-full type-sm">
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-2">Type</th>
                    <th className="p-2">Severity</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.items.map((f) => (
                    <tr key={f.id} className="border-t border-[var(--border)]">
                      <td className="p-2">{f.findingType}</td>
                      <td className="p-2">{f.severity}</td>
                      <td className="p-2">{f.status}</td>
                      <td className="p-2">
                        {canReconRemediate && f.status === "OPEN" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => acknowledgeFinding.mutate(f.id)}
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

      {tab === "activity" && (
        <EdgePermissionGate permission="platform:tenant_management:audit:read">
          {activityQ.isLoading ? (
            <EdgeLoadingState label="Loading activity…" />
          ) : activity.items.length === 0 ? (
            <EdgeEmptyState title="No activity events" />
          ) : (
            <motionTable activity={activity.items} />
          )}
        </EdgePermissionGate>
      )}
    </div>
  );
}

function GovernanceStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="type-xs text-[var(--text-muted)]">{label}</p>
      <p className="type-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function motionTable({ activity }: { activity: ActivityEventRecord[] }) {
  return (
    <div
      className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]"
      data-testid="tm-activity-table"
    >
      <table className="w-full min-w-[640px] type-sm">
        <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="p-2">When</th>
            <th className="p-2">Action</th>
            <th className="p-2">Outcome</th>
            <th className="p-2">Actor</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((ev) => (
            <tr key={ev.id} className="border-t border-[var(--border)]">
              <td className="p-2">{formatWhen(ev.createdAt)}</td>
              <td className="p-2">{ev.action}</td>
              <td className="p-2">{ev.outcome}</td>
              <td className="p-2">{ev.actorId ?? ev.actorType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}