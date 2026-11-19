"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function asAuditRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data as Record<string, unknown>[];
}

function exportAuditCsv(rows: Record<string, unknown>[]) {
  const headers = ["id", "eventType", "type", "createdAt", "actorId"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) =>
          escape(
            h === "eventType"
              ? (row.eventType ?? row.type ?? "")
              : row[h],
          ),
        )
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edge-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EdgeAuditPage() {
  const { permissions, activeVerticalId } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown || hasEdgePermission(permissions, "audit:read");

  const query = useQuery({
    queryKey: ["edge", "audit", "events", activeVerticalId ?? "all"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listAuditEvents({
        verticalId: activeVerticalId ?? undefined,
      });
      return Array.isArray(data) ? data : [];
    },
  });

  const rows = useMemo(() => asAuditRows(query.data), [query.data]);

  if (!allowed) {
    return <EdgeForbiddenState description="Requires audit:read." />;
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            Audit
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            Security and administration events from the Edge control plane.
          </p>
        </div>
        {query.isSuccess && rows.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => exportAuditCsv(rows)}
          >
            Export CSV
          </Button>
        ) : null}
      </header>

      {query.isLoading ? <EdgeLoadingState label="Loading audit events…" /> : null}
      {query.isError ? (
        <EdgeErrorState
          title="Audit unavailable"
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load audit events"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && rows.length === 0 ? (
        <EdgeEmptyState
          title="No audit events"
          description="Edge audit events will show up as administrators take actions. Nothing is invented client-side."
        />
      ) : null}
      {query.isSuccess && rows.length > 0 ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {rows.map((item, index) => {
            const id =
              typeof item.id === "string" ? item.id : `event-${index}`;
            const type =
              typeof item.eventType === "string"
                ? item.eventType
                : typeof item.type === "string"
                  ? item.type
                  : "event";
            const when =
              typeof item.createdAt === "string" ? item.createdAt : null;
            return (
              <li
                key={id}
                className="px-[var(--space-4)] py-[var(--space-3)] type-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {type}
                </span>
                <span className="ml-2 type-xs text-[var(--text-muted)]">
                  {id}
                </span>
                {when ? (
                  <span className="ml-2 type-xs text-[var(--text-muted)]">
                    {when}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
