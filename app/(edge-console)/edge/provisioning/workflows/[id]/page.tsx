"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  WorkflowDependencyGraph,
  WorkflowEmpty,
  WorkflowError,
  WorkflowForbidden,
  WorkflowInfoCard,
  WorkflowLoading,
  WorkflowRow,
  WorkflowStatusBadge,
  WorkflowTableShell,
  formatWorkflowDate,
  shortId,
} from "@/components/edge/workflow/shared";
import {
  redactWorkflowMetadata,
  unwrapEdgeData,
  unwrapWorkflowList,
  workflowApi,
  workflowErrMessage,
} from "@/lib/edge/workflow";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  WorkflowAttemptRecord,
  WorkflowCheckpointRecord,
  WorkflowCompensationRecord,
  WorkflowHistoryEntry,
  WorkflowInstanceRecord,
  WorkflowStepRecord,
} from "@/types/edge-workflow";

function unwrapArrayOrList<T>(payload: unknown): T[] {
  const raw = unwrapEdgeData<T[] | { items?: T[] }>(payload);
  if (Array.isArray(raw)) return raw;
  return raw?.items ?? [];
}

export default function WorkflowInstanceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const canRead = hasEdgePermission(permissions, "platform:workflow:read");
  const canManage = hasEdgePermission(permissions, "platform:workflow:manage");
  const canPause = hasEdgePermission(permissions, "platform:workflow:pause");
  const canResume = hasEdgePermission(permissions, "platform:workflow:resume");
  const canCancel = hasEdgePermission(permissions, "platform:workflow:cancel");
  const canRetry = hasEdgePermission(permissions, "platform:workflow:retry");
  const canReconcile = hasEdgePermission(
    permissions,
    "platform:workflow:reconcile",
  );

  const instanceQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", id],
    queryFn: () => workflowApi.getInstance(id),
    enabled: Boolean(id) && canRead,
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", id, "history"],
    queryFn: () => workflowApi.listHistory(id, { limit: 50, offset: 0 }),
    enabled: Boolean(id) && canRead,
  });

  const stepsQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", id, "steps"],
    queryFn: () => workflowApi.listSteps(id),
    enabled: Boolean(id) && canRead,
  });

  const attemptsQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", id, "attempts"],
    queryFn: () => workflowApi.listAttempts(id),
    enabled: Boolean(id) && canRead,
  });

  const checkpointsQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", id, "checkpoints"],
    queryFn: () => workflowApi.listCheckpoints(id),
    enabled: Boolean(id) && canRead,
    retry: false,
  });

  const compensationsQuery = useQuery({
    queryKey: ["edge", "workflows", "instances", id, "compensations"],
    queryFn: () => workflowApi.listCompensations(id),
    enabled: Boolean(id) && canRead,
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["edge", "workflows"],
    });
  };

  const pause = useMutation({
    mutationFn: () =>
      workflowApi.pause(id, { reason: reason.trim() || "Paused from console" }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const resume = useMutation({
    mutationFn: () => workflowApi.resume(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const cancel = useMutation({
    mutationFn: () =>
      workflowApi.cancel(id, {
        reason: reason.trim() || "Cancelled from console",
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const retry = useMutation({
    mutationFn: () => workflowApi.retry(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const reconcile = useMutation({
    mutationFn: () => workflowApi.reconcile(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const start = useMutation({
    mutationFn: () => workflowApi.start(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const instance = unwrapEdgeData<WorkflowInstanceRecord>(instanceQuery.data);
  const history = unwrapWorkflowList<WorkflowHistoryEntry>(historyQuery.data);
  const steps = unwrapArrayOrList<WorkflowStepRecord>(stepsQuery.data);
  const attempts = unwrapArrayOrList<WorkflowAttemptRecord>(attemptsQuery.data);
  const checkpoints = checkpointsQuery.isError
    ? []
    : unwrapArrayOrList<WorkflowCheckpointRecord>(checkpointsQuery.data);
  const compensations = compensationsQuery.isError
    ? []
    : unwrapArrayOrList<WorkflowCompensationRecord>(compensationsQuery.data);

  const defSteps = useMemo(
    () => instance?.definitionSnapshot?.steps ?? [],
    [instance],
  );

  if (platformLoading) return <WorkflowLoading />;
  if (!canRead) {
    return (
      <WorkflowForbidden description="Workflow instance detail requires platform:workflow:read." />
    );
  }
  if (instanceQuery.isLoading) {
    return <WorkflowLoading label="Loading workflow instance…" />;
  }
  if (instanceQuery.isError) {
    return (
      <WorkflowError
        description={workflowErrMessage(instanceQuery.error)}
        onRetry={() => void instanceQuery.refetch()}
      />
    );
  }
  if (!instance) {
    return (
      <WorkflowEmpty
        title="Instance not found"
        description="This workflow id returned no record."
      />
    );
  }

  const safeFailure = redactWorkflowMetadata(instance.failureDetails);
  const safeInput = redactWorkflowMetadata(instance.inputSnapshot);

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="type-xs text-[var(--text-muted)]">
            <Link
              href="/edge/provisioning/workflows"
              className="text-[var(--primary)] underline"
            >
              Workflow Operations
            </Link>
          </p>
          <h1 className="mt-1 type-lg font-semibold text-[var(--text-primary)]">
            Workflow instance
          </h1>
          <p className="mt-1 font-mono type-xs text-[var(--text-secondary)]">
            {instance.id}
          </p>
        </div>
        <WorkflowStatusBadge status={instance.state} />
      </div>

      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <WorkflowInfoCard title="Identity">
          <WorkflowRow label="Type" value={instance.workflowType} />
          <WorkflowRow
            label="Definition"
            value={
              <Link
                href={`/edge/provisioning/workflows/definitions/${instance.definitionId}`}
                className="text-[var(--primary)] underline"
              >
                {shortId(instance.definitionId)} · v
                {instance.definitionVersion}
              </Link>
            }
          />
          <WorkflowRow
            label="Current step"
            value={instance.currentStepKey ?? "—"}
          />
          <WorkflowRow
            label="Correlation"
            value={instance.correlationId}
            mono
          />
          <WorkflowRow
            label="Causation"
            value={instance.causationId ?? "—"}
            mono
          />
          <WorkflowRow
            label="Idempotency"
            value={instance.idempotencyKey}
            mono
          />
          <WorkflowRow
            label="Started"
            value={formatWorkflowDate(instance.startedAt)}
          />
          <WorkflowRow
            label="Completed"
            value={formatWorkflowDate(instance.completedAt)}
          />
          <WorkflowRow
            label="Deadline"
            value={formatWorkflowDate(instance.deadlineAt)}
          />
        </WorkflowInfoCard>

        <WorkflowInfoCard title="P7.1 / P7.3 references">
          <WorkflowRow
            label="Provisioning request"
            value={
              instance.provisioningRequestId ? (
                <Link
                  href={`/edge/provisioning-requests/${instance.provisioningRequestId}`}
                  className="text-[var(--primary)] underline"
                >
                  {instance.provisioningRequestId}
                </Link>
              ) : (
                "—"
              )
            }
            mono
          />
          <WorkflowRow
            label="Placement decision"
            value={
              instance.placementDecisionId ? (
                <Link
                  href={`/edge/provisioning/capacity/decisions/${instance.placementDecisionId}`}
                  className="text-[var(--primary)] underline"
                >
                  {instance.placementDecisionId}
                </Link>
              ) : (
                "—"
              )
            }
            mono
          />
          <WorkflowRow
            label="Authorization"
            value={
              instance.authorizationId
                ? `${instance.authorizationId} (v${instance.authorizationVersion ?? "—"})`
                : "—"
            }
            mono
          />
          <WorkflowRow
            label="Business ref"
            value={instance.businessReference ?? "—"}
          />
        </WorkflowInfoCard>
      </div>

      <section className="space-y-[var(--space-3)]" aria-label="Operator actions">
        <h2 className="type-md font-semibold">Recovery & intervention</h2>
        <textarea
          className={fieldControlClass}
          rows={2}
          placeholder="Reason for pause / cancel (recommended)"
          aria-label="Action reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {canManage &&
          (instance.state === "CREATED" || instance.state === "READY") ? (
            <Button
              type="button"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              Start
            </Button>
          ) : null}
          {canPause && instance.state === "RUNNING" ? (
            <Button
              type="button"
              variant="outline"
              disabled={pause.isPending}
              onClick={() => pause.mutate()}
            >
              Pause
            </Button>
          ) : null}
          {canResume && instance.state === "PAUSED" ? (
            <Button
              type="button"
              disabled={resume.isPending}
              onClick={() => resume.mutate()}
            >
              Resume
            </Button>
          ) : null}
          {canCancel &&
          !["SUCCEEDED", "CANCELLED", "COMPENSATED"].includes(
            instance.state,
          ) ? (
            <Button
              type="button"
              variant="outline"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel
            </Button>
          ) : null}
          {canRetry ? (
            <Button
              type="button"
              variant="outline"
              disabled={retry.isPending}
              onClick={() => retry.mutate()}
            >
              Retry
            </Button>
          ) : null}
          {canReconcile ? (
            <Button
              type="button"
              variant="outline"
              disabled={reconcile.isPending}
              onClick={() => reconcile.mutate()}
            >
              Reconcile
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Definition graph</h2>
        <WorkflowDependencyGraph steps={defSteps} />
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Execution timeline</h2>
        {historyQuery.isLoading ? (
          <WorkflowLoading label="Loading history…" />
        ) : history.items.length === 0 ? (
          <WorkflowEmpty
            title="No history yet"
            description="Timeline entries appear as the instance transitions."
          />
        ) : (
          <WorkflowTableShell
            headers={["When", "Action", "From → To", "Resource", "Actor", "Reason"]}
          >
            {history.items.map((h) => (
              <tr key={h.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2">
                  {formatWorkflowDate(h.createdAt)}
                </td>
                <td className="px-3 py-2">{h.action}</td>
                <td className="px-3 py-2">
                  {h.fromStatus ?? "—"} → {h.toStatus ?? "—"}
                </td>
                <td className="px-3 py-2 type-xs">
                  {h.resourceType} · {shortId(h.resourceId)}
                </td>
                <td className="px-3 py-2">{h.actorId}</td>
                <td className="px-3 py-2">{h.reason ?? "—"}</td>
              </tr>
            ))}
          </WorkflowTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Steps</h2>
        {stepsQuery.isLoading ? (
          <WorkflowLoading label="Loading steps…" />
        ) : steps.length === 0 ? (
          <WorkflowEmpty
            title="No steps"
            description="Steps are created when the instance is prepared for execution."
          />
        ) : (
          <WorkflowTableShell
            headers={[
              "Key",
              "Status",
              "Attempts",
              "Worker",
              "Lease",
              "Error",
              "Retry at",
            ]}
          >
            {steps.map((s) => (
              <tr key={s.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2">
                  <div className="font-medium">{s.stepKey}</div>
                  <div className="font-mono type-xs text-[var(--text-muted)]">
                    {s.handlerKey}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <WorkflowStatusBadge status={s.status} />
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {s.attemptCount}/{s.maxAttempts}
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {s.ownerWorkerId ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {formatWorkflowDate(s.leaseExpiresAt)}
                </td>
                <td className="px-3 py-2">{s.errorClass ?? "—"}</td>
                <td className="px-3 py-2">
                  {formatWorkflowDate(s.nextRetryAt)}
                </td>
              </tr>
            ))}
          </WorkflowTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Attempts</h2>
        {attemptsQuery.isLoading ? (
          <WorkflowLoading label="Loading attempts…" />
        ) : attempts.length === 0 ? (
          <WorkflowEmpty
            title="No attempts"
            description="Attempt records appear when workers execute steps."
          />
        ) : (
          <WorkflowTableShell
            headers={[
              "#",
              "Step",
              "Worker",
              "Result",
              "Error",
              "Duration",
              "Started",
            ]}
          >
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 tabular-nums">{a.attemptNumber}</td>
                <td className="px-3 py-2 font-mono type-xs">
                  {shortId(a.stepId)}
                </td>
                <td className="px-3 py-2 font-mono type-xs">{a.workerId}</td>
                <td className="px-3 py-2">{a.result ?? "—"}</td>
                <td className="px-3 py-2">{a.errorClass ?? "—"}</td>
                <td className="px-3 py-2">
                  {a.durationMs != null ? `${a.durationMs} ms` : "—"}
                </td>
                <td className="px-3 py-2">
                  {formatWorkflowDate(a.startedAt)}
                </td>
              </tr>
            ))}
          </WorkflowTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Checkpoints</h2>
        {checkpointsQuery.isLoading ? (
          <WorkflowLoading label="Loading checkpoints…" />
        ) : checkpoints.length === 0 ? (
          <WorkflowEmpty
            title="No checkpoints"
            description="Checkpoints are recorded when handlers emit durable recovery points."
          />
        ) : (
          <WorkflowTableShell
            headers={["Seq", "Step", "Def version", "Integrity", "Created"]}
          >
            {checkpoints.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 tabular-nums">{c.sequence}</td>
                <td className="px-3 py-2 font-mono type-xs">
                  {shortId(c.stepId)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {c.definitionVersion}
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {c.integrityHash ? shortId(c.integrityHash) : "—"}
                </td>
                <td className="px-3 py-2">
                  {formatWorkflowDate(c.createdAt)}
                </td>
              </tr>
            ))}
          </WorkflowTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Compensation</h2>
        {compensationsQuery.isLoading ? (
          <WorkflowLoading label="Loading compensation…" />
        ) : compensations.length === 0 ? (
          <WorkflowEmpty
            title="No compensation records"
            description="Compensation history appears when saga rollback runs."
          />
        ) : (
          <WorkflowTableShell
            headers={[
              "Handler",
              "Status",
              "Attempts",
              "Order",
              "Updated",
              "Failure",
            ]}
          >
            {compensations.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 font-mono type-xs">{c.handlerKey}</td>
                <td className="px-3 py-2">
                  <WorkflowStatusBadge status={c.status} />
                </td>
                <td className="px-3 py-2 tabular-nums">{c.attempts}</td>
                <td className="px-3 py-2 tabular-nums">{c.executionOrder}</td>
                <td className="px-3 py-2">
                  {formatWorkflowDate(c.updatedAt)}
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {Object.keys(c.failureDetails ?? {}).length
                    ? JSON.stringify(
                        redactWorkflowMetadata(c.failureDetails),
                      )
                    : "—"}
                </td>
              </tr>
            ))}
          </WorkflowTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Diagnostics</h2>
        <WorkflowInfoCard title="Safe failure details">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
            {JSON.stringify(safeFailure, null, 2)}
          </pre>
        </WorkflowInfoCard>
        <WorkflowInfoCard title="Input snapshot (redacted)">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
            {JSON.stringify(safeInput, null, 2)}
          </pre>
        </WorkflowInfoCard>
        {instance.cancellationReason ? (
          <p className="type-sm text-[var(--text-secondary)]">
            Cancellation reason: {instance.cancellationReason}
          </p>
        ) : null}
      </section>
    </div>
  );
}
