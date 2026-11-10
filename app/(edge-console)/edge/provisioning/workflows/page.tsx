"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  WorkflowCountCard,
  WorkflowDependencyGraph,
  WorkflowEmpty,
  WorkflowError,
  WorkflowFilters,
  WorkflowForbidden,
  WorkflowLoading,
  WorkflowPagination,
  WorkflowStatusBadge,
  WorkflowTableShell,
  formatWorkflowDate,
  shortId,
} from "@/components/edge/workflow/shared";
import {
  WORKFLOW_DEFINITION_STATUS_OPTIONS,
  WORKFLOW_INSTANCE_STATUS_OPTIONS,
  WORKFLOW_TASK_STATUS_OPTIONS,
  WORKER_STATUS_OPTIONS,
  aggregateDashboardCounts,
  canApproveRejectTask,
  defaultDraftSnapshot,
  emptyDashboardCounts,
  isPublishedImmutable,
  redactWorkflowMetadata,
  unwrapEdgeData,
  unwrapWorkflowList,
  workflowApi,
  workflowErrMessage,
} from "@/lib/edge/workflow";
import {
  hasAnyEdgePermission,
  hasEdgePermission,
} from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  WorkflowDefinitionRecord,
  WorkflowHistoryEntry,
  WorkflowHumanTaskRecord,
  WorkflowInstanceRecord,
  WorkflowStepRecord,
  WorkflowWorkerRecord,
} from "@/types/edge-workflow";

type TabId =
  | "dashboard"
  | "definitions"
  | "instances"
  | "tasks"
  | "workers";

const TABS: { id: TabId; label: string; permissions: string[] }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    permissions: ["platform:workflow:read"],
  },
  {
    id: "definitions",
    label: "Definitions",
    permissions: ["platform:workflow_definition:read"],
  },
  {
    id: "instances",
    label: "Instances",
    permissions: ["platform:workflow:read"],
  },
  {
    id: "tasks",
    label: "Tasks",
    permissions: ["platform:workflow_task:read"],
  },
  {
    id: "workers",
    label: "Workers",
    permissions: ["platform:workflow:read"],
  },
];

const LIMIT = 20;

function unwrapArrayOrList<T>(payload: unknown): T[] {
  const raw = unwrapEdgeData<T[] | { items?: T[] }>(payload);
  if (Array.isArray(raw)) return raw;
  return raw?.items ?? [];
}

export default function WorkflowOperationsPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();

  const canReadAny = useMemo(
    () => TABS.some((t) => hasAnyEdgePermission(permissions, t.permissions)),
    [permissions],
  );

  const [tab, setTab] = useState<TabId>("dashboard");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [taskReason, setTaskReason] = useState<Record<string, string>>({});
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});

  const [defForm, setDefForm] = useState({
    code: "",
    name: "",
    description: "",
    domain: "provisioning",
  });

  useEffect(() => {
    const allowed = TABS.find((t) =>
      hasAnyEdgePermission(permissions, t.permissions),
    )?.id;
    if (
      allowed &&
      !hasAnyEdgePermission(
        permissions,
        TABS.find((t) => t.id === tab)?.permissions ?? [],
      )
    ) {
      setTab(allowed);
    }
  }, [permissions, tab]);

  const canPublishDef = hasEdgePermission(
    permissions,
    "platform:workflow_definition:publish",
  );
  const canAssignTask = hasEdgePermission(
    permissions,
    "platform:workflow_task:assign",
  );
  const canApproveTask = hasEdgePermission(
    permissions,
    "platform:workflow_task:approve",
  );
  const canRejectTask = hasEdgePermission(
    permissions,
    "platform:workflow_task:reject",
  );

  const resetOffset = () => setOffset(0);

  const instancesDashQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", "dashboard"],
    queryFn: () => workflowApi.listInstances({ limit: 100, offset: 0 }),
    enabled:
      canReadAny &&
      tab === "dashboard" &&
      hasEdgePermission(permissions, "platform:workflow:read"),
  });

  const deadLettersQuery = useQuery({
    queryKey: ["edge", "workflows", "dead-letters"],
    queryFn: () => workflowApi.listDeadLetters({ limit: 1, offset: 0 }),
    enabled:
      canReadAny &&
      tab === "dashboard" &&
      hasEdgePermission(permissions, "platform:workflow:read"),
    retry: false,
  });

  const recentActivityQuery = useQuery({
    queryKey: ["edge", "workflows", "recent-activity"],
    queryFn: async () => {
      const list = unwrapWorkflowList<WorkflowInstanceRecord>(
        instancesDashQuery.data,
      );
      const first = list.items[0];
      if (!first) return { items: [] as WorkflowHistoryEntry[], total: 0 };
      const hist = await workflowApi.listHistory(first.id, {
        limit: 10,
        offset: 0,
      });
      return unwrapWorkflowList<WorkflowHistoryEntry>(hist);
    },
    enabled:
      canReadAny &&
      tab === "dashboard" &&
      Boolean(instancesDashQuery.data) &&
      hasEdgePermission(permissions, "platform:workflow:read"),
  });

  const definitionsQuery = useQuery({
    queryKey: ["edge", "workflows", "definitions", { q, status, offset }],
    queryFn: () =>
      workflowApi.listDefinitions({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "definitions" &&
      hasEdgePermission(permissions, "platform:workflow_definition:read"),
  });

  const instancesQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", { q, status, offset }],
    queryFn: () =>
      workflowApi.listInstances({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "instances" &&
      hasEdgePermission(permissions, "platform:workflow:read"),
  });

  const tasksQuery = useQuery({
    queryKey: ["edge", "workflows", "tasks", { status, offset }],
    queryFn: () =>
      workflowApi.listTasks({
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "tasks" &&
      hasEdgePermission(permissions, "platform:workflow_task:read"),
  });

  const workersQuery = useQuery({
    queryKey: ["edge", "workflows", "workers", { status, offset }],
    queryFn: () =>
      workflowApi.listWorkers({
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "workers" &&
      hasEdgePermission(permissions, "platform:workflow:read"),
    retry: false,
  });

  const workerLeasesQuery = useQuery({
    queryKey: ["edge", "workflows", "worker-leases"],
    queryFn: async () => {
      const list = unwrapWorkflowList<WorkflowInstanceRecord>(
        await workflowApi.listInstances({
          status: "RUNNING",
          limit: 20,
          offset: 0,
        }),
      );
      const leases: Array<{
        workerId: string;
        stepId: string;
        stepKey: string;
        workflowId: string;
        leaseExpiresAt: string | null;
        status: string;
      }> = [];
      for (const wf of list.items) {
        const steps = unwrapArrayOrList<WorkflowStepRecord>(
          await workflowApi.listSteps(wf.id),
        );
        for (const step of steps) {
          if (step.ownerWorkerId) {
            leases.push({
              workerId: step.ownerWorkerId,
              stepId: step.id,
              stepKey: step.stepKey,
              workflowId: wf.id,
              leaseExpiresAt: step.leaseExpiresAt,
              status: step.status,
            });
          }
        }
      }
      return leases;
    },
    enabled:
      canReadAny &&
      tab === "workers" &&
      hasEdgePermission(permissions, "platform:workflow:read"),
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["edge", "workflows"] });
  };

  const createDefinition = useMutation({
    mutationFn: () =>
      workflowApi.createDefinition({
        code: defForm.code.trim(),
        name: defForm.name.trim(),
        description: defForm.description.trim() || undefined,
        domain: defForm.domain.trim() || "provisioning",
        snapshot: defaultDraftSnapshot(),
      }),
    onSuccess: async () => {
      setFormError(null);
      setDefForm({
        code: "",
        name: "",
        description: "",
        domain: "provisioning",
      });
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  const validateDefinition = useMutation({
    mutationFn: (id: string) => workflowApi.validateDefinition(id),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  const publishDefinition = useMutation({
    mutationFn: (id: string) => workflowApi.publishDefinition(id),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  const deprecateDefinition = useMutation({
    mutationFn: (id: string) =>
      workflowApi.deprecateDefinition(id, {
        reason: "Deprecated from console",
      }),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  const assignTask = useMutation({
    mutationFn: ({ id, assignee }: { id: string; assignee: string }) =>
      workflowApi.assignTask(id, { assignee }),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  const approveTask = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      workflowApi.approveTask(id, { reason }),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  const rejectTask = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      workflowApi.rejectTask(id, { reason }),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(workflowErrMessage(err)),
  });

  if (platformLoading) return <WorkflowLoading />;
  if (!canReadAny) {
    return (
      <WorkflowForbidden description="Workflow Operations requires platform:workflow:read, platform:workflow_definition:read, or platform:workflow_task:read." />
    );
  }

  const dashInstances = unwrapWorkflowList<WorkflowInstanceRecord>(
    instancesDashQuery.data,
  );
  const deadLetterTotal = deadLettersQuery.isError
    ? 0
    : unwrapWorkflowList(deadLettersQuery.data).total;
  const dashCounts =
    tab === "dashboard"
      ? aggregateDashboardCounts(dashInstances.items, deadLetterTotal)
      : emptyDashboardCounts();

  const onCreateDefinition = (e: FormEvent) => {
    e.preventDefault();
    if (!defForm.code.trim() || !defForm.name.trim()) {
      setFormError("Code and name are required.");
      return;
    }
    createDefinition.mutate();
  };

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h1 className="type-lg font-semibold text-[var(--text-primary)]">
          Workflow Operations
        </h1>
        <p className="mt-1 type-sm text-[var(--text-secondary)]">
          Durable orchestration — definitions, instances, human tasks and
          workers. No live P7.5+ provisioning side effects.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        aria-label="Workflow sections"
      >
        {TABS.filter((t) =>
          hasAnyEdgePermission(permissions, t.permissions),
        ).map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={tab === t.id ? "primary" : "outline"}
            onClick={() => {
              setTab(t.id);
              setQ("");
              setStatus("");
              resetOffset();
              setFormError(null);
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {formError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {formError}
        </p>
      ) : null}

      {tab === "dashboard" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Dashboard">
          {instancesDashQuery.isLoading ? (
            <WorkflowLoading label="Loading dashboard…" />
          ) : instancesDashQuery.isError ? (
            <WorkflowError
              description={workflowErrMessage(instancesDashQuery.error)}
              onRetry={() => void instancesDashQuery.refetch()}
            />
          ) : (
            <>
              <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
                <WorkflowCountCard label="Active" count={dashCounts.active} />
                <WorkflowCountCard label="Running" count={dashCounts.running} />
                <WorkflowCountCard
                  label="Waiting approval"
                  count={dashCounts.waitingApproval}
                />
                <WorkflowCountCard
                  label="Retry pending"
                  count={dashCounts.retryPending}
                />
                <WorkflowCountCard label="Failed" count={dashCounts.failed} />
                <WorkflowCountCard
                  label="Compensation"
                  count={dashCounts.compensating}
                />
                <WorkflowCountCard
                  label="Dead letter"
                  count={dashCounts.deadLetter}
                />
                <WorkflowCountCard
                  label="Timed out"
                  count={dashCounts.timedOut}
                />
              </div>

              <div className="space-y-[var(--space-3)]">
                <h2 className="type-md font-semibold">Recent activity</h2>
                {recentActivityQuery.isLoading ? (
                  <WorkflowLoading label="Loading activity…" />
                ) : (recentActivityQuery.data?.items.length ?? 0) === 0 &&
                  dashInstances.items.length === 0 ? (
                  <WorkflowEmpty
                    title="No workflow activity"
                    description="No instances or history yet. Create a published definition and start an instance when ready."
                  />
                ) : (
                  <WorkflowTableShell
                    headers={["When", "Action", "From → To", "Workflow", "Actor"]}
                  >
                    {(recentActivityQuery.data?.items ?? []).map((h) => (
                      <tr
                        key={h.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="px-3 py-2">
                          {formatWorkflowDate(h.createdAt)}
                        </td>
                        <td className="px-3 py-2">{h.action}</td>
                        <td className="px-3 py-2">
                          {h.fromStatus ?? "—"} → {h.toStatus ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-mono type-xs">
                          {h.workflowId ? (
                            <Link
                              href={`/edge/provisioning/workflows/${h.workflowId}`}
                              className="text-[var(--primary)] underline"
                            >
                              {shortId(h.workflowId)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{h.actorId}</td>
                      </tr>
                    ))}
                    {dashInstances.items.slice(0, 5).map((wf) => (
                      <tr
                        key={`wf-${wf.id}`}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="px-3 py-2">
                          {formatWorkflowDate(wf.updatedAt)}
                        </td>
                        <td className="px-3 py-2">INSTANCE</td>
                        <td className="px-3 py-2">
                          <WorkflowStatusBadge status={wf.state} />
                        </td>
                        <td className="px-3 py-2 font-mono type-xs">
                          <Link
                            href={`/edge/provisioning/workflows/${wf.id}`}
                            className="text-[var(--primary)] underline"
                          >
                            {shortId(wf.id)}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          {wf.initiatingActor ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </WorkflowTableShell>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "definitions" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Definitions">
          <WorkflowFilters
            q={q}
            status={status}
            statusOptions={WORKFLOW_DEFINITION_STATUS_OPTIONS}
            onQChange={(v) => {
              setQ(v);
              resetOffset();
            }}
            onStatusChange={(v) => {
              setStatus(v);
              resetOffset();
            }}
            searchLabel="Search definitions"
          />

          <EdgePermissionGate
            permission="platform:workflow_definition:manage"
            fallback={null}
          >
            <form
              className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]"
              onSubmit={onCreateDefinition}
              aria-label="Create draft definition"
            >
              <h2 className="type-sm font-semibold">Create draft definition</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Uses noop:checkpoint → noop:approve only (no P7.5+ handlers).
              </p>
              <div className="grid gap-[var(--space-3)] md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="Code"
                  value={defForm.code}
                  onChange={(e) =>
                    setDefForm((f) => ({ ...f, code: e.target.value }))
                  }
                  aria-label="Definition code"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Name"
                  value={defForm.name}
                  onChange={(e) =>
                    setDefForm((f) => ({ ...f, name: e.target.value }))
                  }
                  aria-label="Definition name"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Description"
                  value={defForm.description}
                  onChange={(e) =>
                    setDefForm((f) => ({ ...f, description: e.target.value }))
                  }
                  aria-label="Definition description"
                />
                <input
                  className={fieldControlClass}
                  placeholder="Domain"
                  value={defForm.domain}
                  onChange={(e) =>
                    setDefForm((f) => ({ ...f, domain: e.target.value }))
                  }
                  aria-label="Definition domain"
                />
              </div>
              <WorkflowDependencyGraph
                steps={defaultDraftSnapshot().steps}
                label="Draft dependency graph"
              />
              <Button
                type="submit"
                disabled={createDefinition.isPending}
              >
                Create draft
              </Button>
            </form>
          </EdgePermissionGate>

          {definitionsQuery.isLoading ? (
            <WorkflowLoading label="Loading definitions…" />
          ) : definitionsQuery.isError ? (
            <WorkflowError
              description={workflowErrMessage(definitionsQuery.error)}
              onRetry={() => void definitionsQuery.refetch()}
            />
          ) : (
            (() => {
              const list =
                unwrapWorkflowList<WorkflowDefinitionRecord>(
                  definitionsQuery.data,
                );
              if (list.items.length === 0) {
                return (
                  <WorkflowEmpty
                    title="No definitions"
                    description="Create a draft definition to get started."
                  />
                );
              }
              return (
                <>
                  <WorkflowTableShell
                    headers={[
                      "Code",
                      "Name",
                      "Status",
                      "Version",
                      "Updated",
                      "Actions",
                    ]}
                  >
                    {list.items.map((def) => {
                      const immutable = isPublishedImmutable(
                        def.definitionStatus,
                      );
                      return (
                        <tr
                          key={def.id}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="px-3 py-2">
                            <Link
                              href={`/edge/provisioning/workflows/definitions/${def.id}`}
                              className="font-medium text-[var(--primary)] underline"
                            >
                              {def.code}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{def.name}</td>
                          <td className="px-3 py-2">
                            <WorkflowStatusBadge
                              status={def.definitionStatus}
                            />
                            {immutable ? (
                              <span className="ml-2 type-xs text-[var(--text-muted)]">
                                read-only
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {def.version}
                          </td>
                          <td className="px-3 py-2">
                            {formatWorkflowDate(def.updatedAt)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {!immutable && canPublishDef ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={validateDefinition.isPending}
                                    onClick={() =>
                                      validateDefinition.mutate(def.id)
                                    }
                                  >
                                    Validate
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={publishDefinition.isPending}
                                    onClick={() =>
                                      publishDefinition.mutate(def.id)
                                    }
                                  >
                                    Publish
                                  </Button>
                                </>
                              ) : null}
                              {def.definitionStatus === "PUBLISHED" &&
                              canPublishDef ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={deprecateDefinition.isPending}
                                  onClick={() =>
                                    deprecateDefinition.mutate(def.id)
                                  }
                                >
                                  Deprecate
                                </Button>
                              ) : null}
                              {immutable &&
                              def.definitionStatus !== "PUBLISHED" ? (
                                <span className="type-xs text-[var(--text-muted)]">
                                  Immutable
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </WorkflowTableShell>
                  <WorkflowPagination
                    offset={offset}
                    limit={LIMIT}
                    total={list.total}
                    onOffsetChange={setOffset}
                  />
                </>
              );
            })()
          )}
        </section>
      ) : null}

      {tab === "instances" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Instances">
          <WorkflowFilters
            q={q}
            status={status}
            statusOptions={WORKFLOW_INSTANCE_STATUS_OPTIONS}
            onQChange={(v) => {
              setQ(v);
              resetOffset();
            }}
            onStatusChange={(v) => {
              setStatus(v);
              resetOffset();
            }}
            searchLabel="Search instances"
          />
          {instancesQuery.isLoading ? (
            <WorkflowLoading label="Loading instances…" />
          ) : instancesQuery.isError ? (
            <WorkflowError
              description={workflowErrMessage(instancesQuery.error)}
              onRetry={() => void instancesQuery.refetch()}
            />
          ) : (
            (() => {
              const list = unwrapWorkflowList<WorkflowInstanceRecord>(
                instancesQuery.data,
              );
              if (list.items.length === 0) {
                return (
                  <WorkflowEmpty
                    title="No instances"
                    description="No workflow instances match the current filters."
                  />
                );
              }
              return (
                <>
                  <WorkflowTableShell
                    headers={[
                      "ID",
                      "Type",
                      "State",
                      "Def version",
                      "P7.1",
                      "P7.3",
                      "Updated",
                    ]}
                  >
                    {list.items.map((wf) => (
                      <tr
                        key={wf.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="px-3 py-2 font-mono type-xs">
                          <Link
                            href={`/edge/provisioning/workflows/${wf.id}`}
                            className="text-[var(--primary)] underline"
                          >
                            {shortId(wf.id)}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{wf.workflowType}</td>
                        <td className="px-3 py-2">
                          <WorkflowStatusBadge status={wf.state} />
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {wf.definitionVersion}
                        </td>
                        <td className="px-3 py-2 font-mono type-xs">
                          {wf.provisioningRequestId ? (
                            <Link
                              href={`/edge/provisioning-requests/${wf.provisioningRequestId}`}
                              className="text-[var(--primary)] underline"
                            >
                              {shortId(wf.provisioningRequestId)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono type-xs">
                          {wf.placementDecisionId ? (
                            <Link
                              href={`/edge/provisioning/capacity/decisions/${wf.placementDecisionId}`}
                              className="text-[var(--primary)] underline"
                            >
                              {shortId(wf.placementDecisionId)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {formatWorkflowDate(wf.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </WorkflowTableShell>
                  <WorkflowPagination
                    offset={offset}
                    limit={LIMIT}
                    total={list.total}
                    onOffsetChange={setOffset}
                  />
                </>
              );
            })()
          )}
        </section>
      ) : null}

      {tab === "tasks" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Tasks">
          <WorkflowFilters
            q={q}
            status={status}
            statusOptions={WORKFLOW_TASK_STATUS_OPTIONS}
            onQChange={(v) => {
              setQ(v);
              resetOffset();
            }}
            onStatusChange={(v) => {
              setStatus(v);
              resetOffset();
            }}
            searchLabel="Search tasks"
          />
          {tasksQuery.isLoading ? (
            <WorkflowLoading label="Loading tasks…" />
          ) : tasksQuery.isError ? (
            <WorkflowError
              description={workflowErrMessage(tasksQuery.error)}
              onRetry={() => void tasksQuery.refetch()}
            />
          ) : (
            (() => {
              const list = unwrapWorkflowList<WorkflowHumanTaskRecord>(
                tasksQuery.data,
              );
              if (list.items.length === 0) {
                return (
                  <WorkflowEmpty
                    title="No pending tasks"
                    description="No human tasks match the current filters."
                  />
                );
              }
              return (
                <>
                  <WorkflowTableShell
                    headers={[
                      "Task",
                      "Type",
                      "Status",
                      "Assignee",
                      "Due",
                      "Workflow",
                      "Actions",
                    ]}
                  >
                    {list.items.map((task) => {
                      const actionable = canApproveRejectTask(task.status);
                      const reason = taskReason[task.id] ?? "";
                      return (
                        <tr
                          key={task.id}
                          className="border-t border-[var(--border)] align-top"
                        >
                          <td className="px-3 py-2 font-mono type-xs">
                            <Link
                              href={`/edge/provisioning/workflows/tasks/${task.id}`}
                              className="text-[var(--primary)] underline"
                            >
                              {shortId(task.id)}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{task.taskType}</td>
                          <td className="px-3 py-2">
                            <WorkflowStatusBadge status={task.status} />
                          </td>
                          <td className="px-3 py-2">
                            {task.assignee ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            {formatWorkflowDate(task.dueAt)}
                          </td>
                          <td className="px-3 py-2 font-mono type-xs">
                            <Link
                              href={`/edge/provisioning/workflows/${task.workflowId}`}
                              className="text-[var(--primary)] underline"
                            >
                              {shortId(task.workflowId)}
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            {actionable ? (
                              <div className="flex min-w-[14rem] flex-col gap-2">
                                {canAssignTask ? (
                                  <div className="flex gap-1">
                                    <input
                                      className={fieldControlClass}
                                      placeholder="Assignee"
                                      aria-label={`Assignee for ${task.id}`}
                                      value={assignTo[task.id] ?? ""}
                                      onChange={(e) =>
                                        setAssignTo((m) => ({
                                          ...m,
                                          [task.id]: e.target.value,
                                        }))
                                      }
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={
                                        assignTask.isPending ||
                                        !(assignTo[task.id] ?? "").trim()
                                      }
                                      onClick={() =>
                                        assignTask.mutate({
                                          id: task.id,
                                          assignee: (assignTo[task.id] ?? "").trim(),
                                        })
                                      }
                                    >
                                      Assign
                                    </Button>
                                  </div>
                                ) : null}
                                <textarea
                                  className={fieldControlClass}
                                  rows={2}
                                  placeholder="Decision reason (required to reject)"
                                  aria-label={`Reason for ${task.id}`}
                                  value={reason}
                                  onChange={(e) =>
                                    setTaskReason((m) => ({
                                      ...m,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                />
                                <div className="flex flex-wrap gap-1">
                                  {canApproveTask ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={approveTask.isPending}
                                      onClick={() =>
                                        approveTask.mutate({
                                          id: task.id,
                                          reason: reason.trim() || undefined,
                                        })
                                      }
                                    >
                                      Approve
                                    </Button>
                                  ) : null}
                                  {canRejectTask ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={
                                        rejectTask.isPending || !reason.trim()
                                      }
                                      onClick={() => {
                                        if (!reason.trim()) {
                                          setFormError(
                                            "Reject requires a non-empty reason.",
                                          );
                                          return;
                                        }
                                        rejectTask.mutate({
                                          id: task.id,
                                          reason: reason.trim(),
                                        });
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <span className="type-xs text-[var(--text-muted)]">
                                {task.decisionReason ?? "No action"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </WorkflowTableShell>
                  <WorkflowPagination
                    offset={offset}
                    limit={LIMIT}
                    total={list.total}
                    onOffsetChange={setOffset}
                  />
                </>
              );
            })()
          )}
        </section>
      ) : null}

      {tab === "workers" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Workers">
          <WorkflowFilters
            q={q}
            status={status}
            statusOptions={WORKER_STATUS_OPTIONS}
            onQChange={(v) => {
              setQ(v);
              resetOffset();
            }}
            onStatusChange={(v) => {
              setStatus(v);
              resetOffset();
            }}
            searchLabel="Search workers"
          />
          {workersQuery.isLoading ? (
            <WorkflowLoading label="Loading workers…" />
          ) : workersQuery.isError ? (
            <WorkflowEmpty
              title="Worker registry unavailable"
              description="Worker list endpoint is not available. Lease ownership from running steps is shown below when present."
            />
          ) : (
            (() => {
              const list = unwrapWorkflowList<WorkflowWorkerRecord>(
                workersQuery.data,
              );
              if (list.items.length === 0) {
                return (
                  <WorkflowEmpty
                    title="No workers registered"
                    description="No worker identities with heartbeats yet. Active step leases still appear below when claimed."
                  />
                );
              }
              return (
                <>
                  <WorkflowTableShell
                    headers={[
                      "Worker ID",
                      "Identity",
                      "Status",
                      "Version",
                      "Last heartbeat",
                      "Metadata",
                    ]}
                  >
                    {list.items.map((w) => {
                      const safeMeta = redactWorkflowMetadata(w.metadata);
                      return (
                        <tr
                          key={w.id}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="px-3 py-2 font-mono type-xs">
                            {w.workerId}
                          </td>
                          <td className="px-3 py-2">{w.identity}</td>
                          <td className="px-3 py-2">
                            <WorkflowStatusBadge status={w.status} />
                          </td>
                          <td className="px-3 py-2">{w.workerVersion}</td>
                          <td className="px-3 py-2">
                            {formatWorkflowDate(w.lastHeartbeatAt)}
                          </td>
                          <td className="px-3 py-2 font-mono type-xs">
                            {JSON.stringify(safeMeta)}
                          </td>
                        </tr>
                      );
                    })}
                  </WorkflowTableShell>
                  <WorkflowPagination
                    offset={offset}
                    limit={LIMIT}
                    total={list.total}
                    onOffsetChange={setOffset}
                  />
                </>
              );
            })()
          )}

          <div className="space-y-[var(--space-2)]">
            <h2 className="type-md font-semibold">Current leases</h2>
            {workerLeasesQuery.isLoading ? (
              <WorkflowLoading label="Loading leases…" />
            ) : (workerLeasesQuery.data?.length ?? 0) === 0 ? (
              <WorkflowEmpty
                title="No active leases"
                description="No claimed steps with owner workers among recent RUNNING instances."
              />
            ) : (
              <WorkflowTableShell
                headers={[
                  "Worker",
                  "Step",
                  "Workflow",
                  "Status",
                  "Lease expires",
                ]}
              >
                {(workerLeasesQuery.data ?? []).map((lease) => (
                  <tr
                    key={`${lease.stepId}-${lease.workerId}`}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-3 py-2 font-mono type-xs">
                      {lease.workerId}
                    </td>
                    <td className="px-3 py-2">
                      {lease.stepKey}{" "}
                      <span className="font-mono type-xs text-[var(--text-muted)]">
                        ({shortId(lease.stepId)})
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono type-xs">
                      <Link
                        href={`/edge/provisioning/workflows/${lease.workflowId}`}
                        className="text-[var(--primary)] underline"
                      >
                        {shortId(lease.workflowId)}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <WorkflowStatusBadge status={lease.status} />
                    </td>
                    <td className="px-3 py-2">
                      {formatWorkflowDate(lease.leaseExpiresAt)}
                    </td>
                  </tr>
                ))}
              </WorkflowTableShell>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
