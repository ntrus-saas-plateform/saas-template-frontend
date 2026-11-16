"use client";

/**
 * P8 — Tenant workspace (360 overview, profile, lifecycle, governance, activity).
 */
import { useEffect, useState, type FormEvent } from "react";
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
  Tenant360Overview,
} from "@/types/edge-tenant-management";

type WorkspaceTab =
  | "overview"
  | "profile"
  | "lifecycle"
  | "governance"
  | "activity";

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "FRESH" || s === "AVAILABLE" || s === "ACTIVE") return "success";
  if (s === "STALE" || s === "UNKNOWN" || s === "PARTIAL") return "warning";
  if (s === "UNAVAILABLE" || s === "FAILED" || s === "CRITICAL") return "danger";
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

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}`;
}

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

  const overview = overviewQ.data?.data as Tenant360Overview | null | undefined;
  const registry = overview?.registry;

  const activity = unwrapInfraList<ActivityEventRecord>(activityQ.data?.data);

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    region: "",
    segment: "",
  });

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

  useEffect(() => {
    if (registry) {
      setProfileForm({
        displayName: registry.displayName,
        region: registry.region ?? "",
        segment: registry.segment ?? "",
      });
      setOwnerForm({
        internalOwnerId: registry.internalOwnerId ?? "",
        operationalTeam: registry.operationalTeam ?? "",
      });
    }
  }, [registry]);

  const updateMetadata = useMutation({
    mutationFn: () => {
      if (!registry) throw new Error("Missing registry");
      return edgeApi.updateTenantMetadata(tenantId, {
        expectedVersion: registry.version,
        displayName: profileForm.displayName,
        region: profileForm.region || null,
        segment: profileForm.segment || null,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm", "360", tenantId] }),
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

  const addNote = useMutation({
    mutationFn: () =>
      edgeApi.addTenantNote(tenantId, { body: noteForm.body, noteType: "GENERAL" }),
    onSuccess: () => {
      setNoteForm({ body: "" });
      void qc.invalidateQueries({ queryKey: ["tm", "360", tenantId] });
    },
  });

  const addTag = useMutation({
    mutationFn: () => edgeApi.addTenantTag(tenantId, tagForm),
    onSuccess: () => {
      setTagForm({ tagKey: "", tagValue: "" });
      void qc.invalidateQueries({ queryKey: ["tm", "360", tenantId] });
    },
  });

  const removeTag = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      edgeApi.removeTenantTag(tenantId, key, value),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["tm", "360", tenantId] }),
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
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tm", "360", tenantId] }),
  });

  if (!canRead) {
    return <EdgeForbiddenState />;
  }

  if (overviewQ.isLoading) {
    return <EdgeLoadingState label="Loading tenant 360…" />;
  }

  if (overviewQ.isError) {
    return (
      <EdgeErrorState description={(overviewQ.error as Error).message} />
    );
  }

  if (!overview || !registry) {
    return (
      <EdgeEmptyState
        title="Tenant not found"
        description="Return to Tenant Management from the platform nav."
      />
    );
  }

  const actionError =
    updateMetadata.error ??
    requestLifecycle.error ??
    addNote.error ??
    addTag.error ??
    removeTag.error ??
    assignOwner.error;

  function onProfileSubmit(e: FormEvent) {
    e.preventDefault();
    updateMetadata.mutate();
  }

  function onLifecycleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!lifecycleForm.justification.trim()) return;
    requestLifecycle.mutate();
  }

  function onNoteSubmit(e: FormEvent) {
    e.preventDefault();
    if (!noteForm.body.trim()) return;
    addNote.mutate();
  }

  const workspaceTabs = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "lifecycle", label: "Lifecycle" },
    { id: "governance", label: "Governance" },
    { id: "activity", label: "Activity" },
  ];

  const healthStatus = overview.health.status;
  const healthFreshness = overview.health.freshness;

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
          <Badge tone={statusTone(healthStatus)} data-testid="tm-detail-health">
            {healthStatus}
          </Badge>
        </div>
      </div>

      <Tabs
        tabs={workspaceTabs}
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
              <p className="type-xs text-[var(--text-muted)]">
                Source: {overview.technical.source}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Health" />
            <CardBody className="space-y-[var(--space-2)] type-sm">
              <p data-testid="tm-health-freshness">
                Freshness:{" "}
                <Badge tone={statusTone(healthFreshness)}>
                  {healthFreshness}
                </Badge>
              </p>
              <p>Observed at: {formatWhen(overview.health.observedAt)}</p>
              <p className="type-xs text-[var(--text-muted)]">
                UNKNOWN/STALE shown as reported — never assumed healthy.
              </p>
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
              <p>Synced: {formatWhen(overview.commercial.syncedAt)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Open governance signals" />
            <CardBody className="grid grid-cols-3 gap-[var(--space-2)] type-sm">
              <GovernanceStat label="Exceptions" value={overview.openExceptions} />
              <GovernanceStat
                label="Lifecycle"
                value={overview.pendingLifecycleRequests}
              />
              <GovernanceStat label="Findings" value={overview.openFindings} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "profile" && (
        <EdgePermissionGate permission="platform:tenant_management:update_metadata">
          <Card>
            <CardHeader title="Metadata" />
            <CardBody>
              <form
                onSubmit={onProfileSubmit}
                className="grid gap-[var(--space-3)] md:grid-cols-2"
                data-testid="tm-profile-form"
              >
                <input
                  className={fieldControlClass}
                  value={profileForm.displayName}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      displayName: e.target.value,
                    }))
                  }
                  aria-label="Display name"
                  required
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
                {canUpdate ? (
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={updateMetadata.isPending}>
                      {updateMetadata.isPending ? "Saving…" : "Save metadata"}
                    </Button>
                  </div>
                ) : null}
              </form>
            </CardBody>
          </Card>
          {canUpdate ? (
            <Card>
              <CardHeader title="Add note (with justification)" />
              <CardBody>
                <form onSubmit={onNoteSubmit} className="flex flex-col gap-[var(--space-2)]">
                  <textarea
                    className={fieldControlClass}
                    rows={3}
                    required
                    placeholder="Note body"
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
                          {n.noteType} · {formatWhen(n.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </EdgePermissionGate>
      )}

      {tab === "lifecycle" && (
        <EdgePermissionGate permission="platform:tenant_management:lifecycle:request">
          <Card>
            <CardHeader title="Request lifecycle action" />
            <CardBody>
              <form
                onSubmit={onLifecycleSubmit}
                className="grid gap-[var(--space-3)] md:grid-cols-2"
                data-testid="tm-lifecycle-form"
              >
                <select
                  className={fieldControlClass}
                  value={lifecycleForm.requestType}
                  onChange={(e) =>
                    setLifecycleForm((f) => ({
                      ...f,
                      requestType: e.target.value,
                    }))
                  }
                  aria-label="Request type"
                >
                  <option value="SUSPEND">SUSPEND</option>
                  <option value="RESUME">RESUME</option>
                  <option value="RESTRICT">RESTRICT</option>
                  <option value="DEACTIVATE">DEACTIVATE</option>
                  <option value="TERMINATE">TERMINATE</option>
                </select>
                <input
                  className={fieldControlClass}
                  placeholder="Risk assessment (optional)"
                  value={lifecycleForm.riskAssessment}
                  onChange={(e) =>
                    setLifecycleForm((f) => ({
                      ...f,
                      riskAssessment: e.target.value,
                    }))
                  }
                  aria-label="Risk assessment"
                />
                <textarea
                  className={`${fieldControlClass} md:col-span-2`}
                  rows={3}
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
                  <Button
                    type="submit"
                    disabled={requestLifecycle.isPending || !canLifecycle}
                  >
                    Submit request
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </EdgePermissionGate>
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
                            className="ml-1 text-[var(--text-muted)]"
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
                  className="flex flex-col gap-[var(--space-2)] sm:flex-row"
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
                  className="flex flex-col gap-[var(--space-2)]"
                >
                  <input
                    className={fieldControlClass}
                    placeholder="internalOwnerId"
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
                    placeholder="operationalTeam"
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
              <span>Legal hold: {registry.legalHold ? "yes" : "no"}</span>
              <span>
                Deletion protection: {registry.deletionProtection ? "yes" : "no"}
              </span>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "activity" && (
        <EdgePermissionGate permission="platform:tenant_management:audit:read">
          {activityQ.isLoading ? (
            <EdgeLoadingState label="Loading activity…" />
          ) : activityQ.isError ? (
            <EdgeErrorState
              description={(activityQ.error as Error).message}
            />
          ) : activity.items.length === 0 ? (
            <EdgeEmptyState title="No activity events" />
          ) : (
            <div
              className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]"
              data-testid="tm-activity-table"
            >
              <table className="w-full min-w-[640px] type-sm">
                <thead className="bg-[var(--surface-muted)] type-xs uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="p-[var(--space-2)]">When</th>
                    <th className="p-[var(--space-2)]">Action</th>
                    <th className="p-[var(--space-2)]">Outcome</th>
                    <th className="p-[var(--space-2)]">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.items.map((ev) => (
                    <tr
                      key={ev.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="p-[var(--space-2)]">
                        {formatWhen(ev.createdAt)}
                      </td>
                      <td className="p-[var(--space-2)]">{ev.action}</td>
                      <td className="p-[var(--space-2)]">{ev.outcome}</td>
                      <td className="p-[var(--space-2)]">
                        {ev.actorId ?? ev.actorType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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