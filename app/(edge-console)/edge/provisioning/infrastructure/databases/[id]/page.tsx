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
import {
  infrastructureErrMessage,
  redactSecretRef,
} from "@/lib/edge/infrastructure";

export default function DatabaseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["infra", "database", id],
    queryFn: () => edgeApi.getDatabaseResource(id),
  });
  const historyQ = useQuery({
    queryKey: ["infra", "history", id],
    queryFn: () => edgeApi.listResourceHistory(id, { limit: 50 }),
  });
  const rotate = useMutation({
    mutationFn: () => edgeApi.rotateDatabaseCredentials(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["infra", "database", id] }),
  });
  const verify = useMutation({
    mutationFn: () => edgeApi.verifyDatabaseResource(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["infra", "database", id] }),
  });

  if (q.isLoading) return <InfraLoading />;
  if (q.isError || !q.data) {
    return <InfraError message={infrastructureErrMessage(q.error)} />;
  }
  const d = q.data;

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)]">
      <header>
        <h1 className="type-xl font-semibold">Database resource</h1>
        <p className="type-sm text-[var(--text-muted)] mt-1">{d.databaseName}</p>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2 type-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Status</dt>
          <dd>
            <InfraStatusBadge status={d.status} />
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Engine</dt>
          <dd>
            {d.databaseEngine} {d.engineVersion ?? ""}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Tenant</dt>
          <dd>{d.tenantId}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Product</dt>
          <dd>{d.productId}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Connectivity</dt>
          <dd>{d.connectivityVerified ? "Verified" : "Not verified"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Isolation</dt>
          <dd>{d.isolationVerified ? "Verified" : "Not verified"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Least privilege</dt>
          <dd>{d.leastPrivilegeVerified ? "Verified" : "Not verified"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">TLS required</dt>
          <dd>{d.tlsRequired ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Public endpoint</dt>
          <dd>{d.publicEndpoint ? "Yes" : "No (default)"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Credential ref</dt>
          <dd>{redactSecretRef(d.credentialRef)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Updated</dt>
          <dd>{formatInfraDate(d.updatedAt)}</dd>
        </div>
      </dl>
      <div className="flex gap-2">
        <EdgePermissionGate permission="platform:database:verify">
          <Button type="button" onClick={() => verify.mutate()} disabled={verify.isPending}>
            Verify
          </Button>
        </EdgePermissionGate>
        <EdgePermissionGate permission="platform:database:credentials:rotate">
          <Button
            type="button"
            variant="outline"
            onClick={() => rotate.mutate()}
            disabled={rotate.isPending}
          >
            Rotate credentials
          </Button>
        </EdgePermissionGate>
      </div>
      {(verify.isError || rotate.isError) && (
        <InfraError
          message={infrastructureErrMessage(verify.error ?? rotate.error)}
        />
      )}
      <section>
        <h2 className="type-md font-semibold mb-2">History</h2>
        {historyQ.isLoading ? (
          <InfraLoading />
        ) : (
          <ul className="type-sm space-y-1">
            {(historyQ.data?.items ?? []).map((h) => (
              <li key={h.id}>
                {formatInfraDate(h.createdAt)} — {h.action} {h.fromStatus}→{h.toStatus}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
