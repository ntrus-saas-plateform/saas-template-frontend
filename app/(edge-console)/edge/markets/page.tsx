"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeMarketsPage() {
  const queryClient = useQueryClient();
  const { permissions, activeVerticalId } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:taxonomy:read");
  const canManage =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:taxonomy:manage");

  const [verticalId, setVerticalId] = useState(activeVerticalId ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!verticalId && activeVerticalId) setVerticalId(activeVerticalId);
  }, [activeVerticalId, verticalId]);

  const verticalsQuery = useQuery({
    queryKey: ["edge", "verticals", "markets"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listVerticals("page=1&limit=100");
      return data ?? [];
    },
  });

  const segmentsQuery = useQuery({
    queryKey: ["edge", "market-segments", verticalId],
    enabled: allowed && Boolean(verticalId),
    queryFn: async () => {
      const { data } = await edgeApi.listMarketSegments(verticalId);
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketSegment({
        code: code.trim(),
        name: name.trim(),
        verticalId,
      }),
    onSuccess: async () => {
      setCode("");
      setName("");
      setCreateError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "market-segments", verticalId],
      });
    },
    onError: (err) => {
      setCreateError(
        err instanceof EdgeApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create segment",
      );
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:taxonomy:read." />
    );
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!verticalId || !code.trim() || !name.trim()) {
      setCreateError("Vertical, code, and name are required.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Market segments
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Taxonomy segments scoped to a vertical.
        </p>
      </header>

      <label className="block max-w-md space-y-1">
        <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Vertical
        </span>
        <select
          className={fieldControlClass}
          value={verticalId}
          onChange={(e) => setVerticalId(e.target.value)}
          disabled={verticalsQuery.isLoading}
        >
          <option value="">Select vertical…</option>
          {(verticalsQuery.data ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name ?? v.code ?? v.id}
            </option>
          ))}
        </select>
      </label>

      {!verticalId ? (
        <EdgeEmptyState
          title="Choose a vertical"
          description="Market segments are listed per vertical."
        />
      ) : null}

      {verticalId && segmentsQuery.isLoading ? <EdgeLoadingState /> : null}
      {verticalId && segmentsQuery.isError ? (
        <EdgeErrorState
          description={
            segmentsQuery.error instanceof Error
              ? segmentsQuery.error.message
              : "Failed to load market segments"
          }
          onRetry={() => void segmentsQuery.refetch()}
        />
      ) : null}
      {verticalId && segmentsQuery.isSuccess && !segmentsQuery.data.length ? (
        <EdgeEmptyState
          title="No segments"
          description="Create a market segment for this vertical."
        />
      ) : null}
      {verticalId && segmentsQuery.isSuccess && segmentsQuery.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {segmentsQuery.data.map((segment) => (
            <li
              key={segment.id}
              className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <span>
                <span className="block font-medium text-[var(--text-primary)]">
                  {segment.name}
                </span>
                <span className="type-xs text-[var(--text-muted)]">
                  {[segment.code, segment.status].filter(Boolean).join(" · ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <EdgePermissionGate permission="platform:taxonomy:manage">
        {canManage && verticalId ? (
          <form
            onSubmit={onCreate}
            className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
          >
            <h2 className="type-sm font-semibold text-[var(--text-primary)]">
              Create segment
            </h2>
            <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Code
                </span>
                <input
                  className={fieldControlClass}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Name
                </span>
                <input
                  className={fieldControlClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            </div>
            {createError ? (
              <p className="type-sm text-[var(--danger)]">{createError}</p>
            ) : null}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Add segment"}
            </Button>
          </form>
        ) : null}
      </EdgePermissionGate>
    </div>
  );
}
