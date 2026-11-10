"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  InfraError,
  InfraLoading,
  InfraStatusBadge,
  formatInfraDate,
} from "@/components/edge/infrastructure/shared";
import { edgeApi } from "@/lib/api/edge";
import { infrastructureErrMessage } from "@/lib/edge/infrastructure";

export default function InfrastructureResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["infra", "resource", id],
    queryFn: () => edgeApi.getInfrastructureResource(id),
  });
  const backupsQ = useQuery({
    queryKey: ["infra", "backups", id],
    queryFn: () => edgeApi.listResourceBackups(id),
  });
  const historyQ = useQuery({
    queryKey: ["infra", "resource-history", id],
    queryFn: () => edgeApi.listResourceHistory(id, { limit: 50 }),
  });
  const reconcile = useMutation({
    mutationFn: () => edgeApi.reconcileInfrastructureResource(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["infra"] }),
  });

  if (q.isLoading) return <InfraLoading />;
  if (q.isError || !q.data) {
    return <InfraError message={infrastructureErrMessage(q.error)} />;
  }
  const r = q.data;

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)]">
      <header>
        <h1 className="type-xl font-semibold">Infrastructure resource</h1>
        <p className="type-sm text-[var(--text-muted)] mt-1">
          {r.resourceType} · {r.region}
        </p>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2 type-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Status</dt>
          <dd>
            <InfraStatusBadge status={r.status} />
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Health</dt>
          <dd>{r.healthStatus}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Drift</dt>
          <dd>{r.driftStatus}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Deletion protection</dt>
          <dd>{r.deletionProtection ? "Enabled" : "Disabled"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Provider resource</dt>
          <dd>{r.providerResourceId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Last reconciliation</dt>
          <dd>{formatInfraDate(r.lastReconciledAt)}</dd>
        </div>
      </dl>
      <EdgePermissionGate permission="platform:infrastructure:reconcile">
        <Button type="button" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
          Reconcile
        </Button>
      </EdgePermissionGate>
      <section>
        <h2 className="type-md font-semibold mb-2">Backups</h2>
        {(backupsQ.data?.items ?? []).length === 0 ? (
          <p className="type-sm text-[var(--text-muted)]">No backups</p>
        ) : (
          <ul className="type-sm space-y-1">
            {(backupsQ.data?.items ?? []).map((b) => (
              <li key={b.id}>
                {b.status} · integrity={String(b.integrityVerified)} ·{" "}
                {formatInfraDate(b.startedAt)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="type-md font-semibold mb-2">History</h2>
        <ul className="type-sm space-y-1">
          {(historyQ.data?.items ?? []).map((h) => (
            <li key={h.id}>
              {formatInfraDate(h.createdAt)} — {h.action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
