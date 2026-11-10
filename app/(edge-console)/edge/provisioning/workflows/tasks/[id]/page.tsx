"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  WorkflowEmpty,
  WorkflowError,
  WorkflowForbidden,
  WorkflowInfoCard,
  WorkflowLoading,
  WorkflowRow,
  WorkflowStatusBadge,
  formatWorkflowDate,
} from "@/components/edge/workflow/shared";
import {
  canApproveRejectTask,
  redactWorkflowMetadata,
  unwrapEdgeData,
  workflowApi,
  workflowErrMessage,
} from "@/lib/edge/workflow";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { WorkflowHumanTaskRecord } from "@/types/edge-workflow";

export default function WorkflowTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [assignee, setAssignee] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const canRead = hasEdgePermission(
    permissions,
    "platform:workflow_task:read",
  );
  const canAssign = hasEdgePermission(
    permissions,
    "platform:workflow_task:assign",
  );
  const canApprove = hasEdgePermission(
    permissions,
    "platform:workflow_task:approve",
  );
  const canReject = hasEdgePermission(
    permissions,
    "platform:workflow_task:reject",
  );

  const taskQuery = useQuery({
    queryKey: ["edge", "workflows", "tasks", id],
    queryFn: () => workflowApi.getTask(id),
    enabled: Boolean(id) && canRead,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["edge", "workflows"] });
  };

  const assign = useMutation({
    mutationFn: () => workflowApi.assignTask(id, { assignee: assignee.trim() }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const approve = useMutation({
    mutationFn: () =>
      workflowApi.approveTask(id, {
        reason: reason.trim() || undefined,
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const reject = useMutation({
    mutationFn: () => workflowApi.rejectTask(id, { reason: reason.trim() }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  if (platformLoading) return <WorkflowLoading />;
  if (!canRead) {
    return (
      <WorkflowForbidden description="Task detail requires platform:workflow_task:read." />
    );
  }
  if (taskQuery.isLoading) {
    return <WorkflowLoading label="Loading task…" />;
  }
  if (taskQuery.isError) {
    return (
      <WorkflowError
        description={workflowErrMessage(taskQuery.error)}
        onRetry={() => void taskQuery.refetch()}
      />
    );
  }

  const task = unwrapEdgeData<WorkflowHumanTaskRecord>(taskQuery.data);
  if (!task) {
    return (
      <WorkflowEmpty
        title="Task not found"
        description="This task id returned no record."
      />
    );
  }

  const actionable = canApproveRejectTask(task.status);
  const safeContext = redactWorkflowMetadata(task.contextSnapshot);

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <p className="type-xs text-[var(--text-muted)]">
          <Link
            href="/edge/provisioning/workflows"
            className="text-[var(--primary)] underline"
          >
            Workflow Operations
          </Link>
        </p>
        <h1 className="mt-1 type-lg font-semibold">Human task</h1>
        <p className="mt-1 font-mono type-xs text-[var(--text-secondary)]">
          {task.id}
        </p>
      </div>

      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      <WorkflowInfoCard title="Task">
        <WorkflowRow
          label="Status"
          value={<WorkflowStatusBadge status={task.status} />}
        />
        <WorkflowRow label="Type" value={task.taskType} />
        <WorkflowRow label="Assignee" value={task.assignee ?? "—"} />
        <WorkflowRow label="Due" value={formatWorkflowDate(task.dueAt)} />
        <WorkflowRow
          label="Workflow"
          value={
            <Link
              href={`/edge/provisioning/workflows/${task.workflowId}`}
              className="text-[var(--primary)] underline"
            >
              {task.workflowId}
            </Link>
          }
          mono
        />
        <WorkflowRow
          label="Required permission"
          value={task.requiredPermission}
        />
        <WorkflowRow label="Instructions" value={task.instructions ?? "—"} />
        <WorkflowRow label="Decision" value={task.decision ?? "—"} />
        <WorkflowRow label="Decision reason" value={task.decisionReason ?? "—"} />
      </WorkflowInfoCard>

      <WorkflowInfoCard title="Context (redacted)">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
          {JSON.stringify(safeContext, null, 2)}
        </pre>
      </WorkflowInfoCard>

      {actionable ? (
        <section className="space-y-[var(--space-3)]" aria-label="Task actions">
          {canAssign ? (
            <div className="flex flex-wrap gap-2">
              <input
                className={fieldControlClass}
                placeholder="Assignee"
                aria-label="Assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={assign.isPending || !assignee.trim()}
                onClick={() => assign.mutate()}
              >
                Assign
              </Button>
            </div>
          ) : null}
          <textarea
            className={fieldControlClass}
            rows={3}
            placeholder="Decision reason (required to reject)"
            aria-label="Decision reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {canApprove ? (
              <Button
                type="button"
                disabled={approve.isPending}
                onClick={() => approve.mutate()}
              >
                Approve
              </Button>
            ) : null}
            {canReject ? (
              <Button
                type="button"
                variant="outline"
                disabled={reject.isPending || !reason.trim()}
                onClick={() => {
                  if (!reason.trim()) {
                    setActionError("Reject requires a non-empty reason.");
                    return;
                  }
                  reject.mutate();
                }}
              >
                Reject
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
