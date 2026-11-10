"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  WorkflowDependencyGraph,
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
  defaultDraftSnapshot,
  isPublishedImmutable,
  unwrapEdgeData,
  workflowApi,
  workflowErrMessage,
} from "@/lib/edge/workflow";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { WorkflowDefinitionRecord } from "@/types/edge-workflow";

export default function WorkflowDefinitionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const canRead = hasEdgePermission(
    permissions,
    "platform:workflow_definition:read",
  );
  const canPublish = hasEdgePermission(
    permissions,
    "platform:workflow_definition:publish",
  );

  const defQuery = useQuery({
    queryKey: ["edge", "workflows", "definitions", id],
    queryFn: () => workflowApi.getDefinition(id),
    enabled: Boolean(id) && canRead,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["edge", "workflows"] });
  };

  const validate = useMutation({
    mutationFn: () => workflowApi.validateDefinition(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const publish = useMutation({
    mutationFn: () => workflowApi.publishDefinition(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  const deprecate = useMutation({
    mutationFn: () =>
      workflowApi.deprecateDefinition(id, { reason: "Deprecated from detail" }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(workflowErrMessage(err)),
  });

  if (platformLoading) return <WorkflowLoading />;
  if (!canRead) {
    return (
      <WorkflowForbidden description="Definition detail requires platform:workflow_definition:read." />
    );
  }
  if (defQuery.isLoading) {
    return <WorkflowLoading label="Loading definition…" />;
  }
  if (defQuery.isError) {
    return (
      <WorkflowError
        description={workflowErrMessage(defQuery.error)}
        onRetry={() => void defQuery.refetch()}
      />
    );
  }

  const def = unwrapEdgeData<WorkflowDefinitionRecord>(defQuery.data);
  if (!def) {
    return (
      <WorkflowEmpty
        title="Definition not found"
        description="This definition id returned no record."
      />
    );
  }

  const immutable = isPublishedImmutable(def.definitionStatus);

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
        <h1 className="mt-1 type-lg font-semibold">{def.name}</h1>
        <p className="mt-1 font-mono type-xs text-[var(--text-secondary)]">
          {def.code} · {def.id}
        </p>
      </div>

      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      <WorkflowInfoCard title="Definition">
        <WorkflowRow
          label="Status"
          value={
            <span className="inline-flex items-center gap-2">
              <WorkflowStatusBadge status={def.definitionStatus} />
              {immutable ? (
                <span className="type-xs text-[var(--text-muted)]">
                  read-only / immutable
                </span>
              ) : null}
            </span>
          }
        />
        <WorkflowRow label="Domain" value={def.domain} />
        <WorkflowRow label="Version" value={String(def.version)} />
        <WorkflowRow
          label="Published"
          value={formatWorkflowDate(def.publishedAt)}
        />
        <WorkflowRow label="Created by" value={def.createdBy ?? "—"} />
        <WorkflowRow label="Approved by" value={def.approvedBy ?? "—"} />
        <WorkflowRow label="Description" value={def.description ?? "—"} />
      </WorkflowInfoCard>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Graph (draft template)</h2>
        <p className="type-xs text-[var(--text-muted)]">
          Snapshot detail is pinned on published instances. Console draft
          template uses noop handlers only.
        </p>
        <WorkflowDependencyGraph steps={defaultDraftSnapshot().steps} />
      </section>

      {canPublish ? (
        <div className="flex flex-wrap gap-2">
          {!immutable ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={validate.isPending}
                onClick={() => validate.mutate()}
              >
                Validate
              </Button>
              <Button
                type="button"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
              >
                Publish
              </Button>
            </>
          ) : null}
          {def.definitionStatus === "PUBLISHED" ? (
            <Button
              type="button"
              variant="outline"
              disabled={deprecate.isPending}
              onClick={() => deprecate.mutate()}
            >
              Deprecate
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
