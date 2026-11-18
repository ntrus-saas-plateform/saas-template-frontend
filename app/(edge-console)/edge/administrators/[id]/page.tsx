"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import {
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export default function EdgeAdministratorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:read");
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [roleId, setRoleId] = useState("");

  const query = useQuery({
    queryKey: ["edge", "administrators", id],
    enabled: allowed && Boolean(id),
    queryFn: async () => {
      const { data } = await edgeApi.getAdministrator(id);
      return data;
    },
  });

  const membershipsQ = useQuery({
    queryKey: ["edge", "administrators", id, "memberships"],
    enabled: allowed && Boolean(id),
    queryFn: async () => {
      const { data } = await edgeApi.listAdministratorMemberships(id);
      return data ?? [];
    },
  });

  const permsQ = useQuery({
    queryKey: ["edge", "administrators", id, "effective-permissions"],
    enabled: allowed && Boolean(id),
    queryFn: async () => {
      const { data } = await edgeApi.getAdministratorEffectivePermissions(id);
      return data;
    },
  });

  const rolesQ = useQuery({
    queryKey: ["edge", "roles"],
    enabled: hasEdgePermission(permissions, "authorization:roles:read"),
    queryFn: async () => {
      const { data } = await edgeApi.listEdgeRoles();
      return Array.isArray(data) ? data : [];
    },
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["edge", "administrators", id] });
    await qc.invalidateQueries({
      queryKey: ["edge", "administrators", id, "memberships"],
    });
    await qc.invalidateQueries({
      queryKey: ["edge", "administrators", id, "effective-permissions"],
    });
  };

  const lifecycle = useMutation({
    mutationFn: async (action: "suspend" | "reinstate" | "deactivate") => {
      if (action === "suspend")
        return edgeApi.suspendAdministrator(id, reason || undefined);
      if (action === "reinstate") return edgeApi.reinstateAdministrator(id);
      return edgeApi.deactivateAdministrator(id, reason || undefined);
    },
    onSuccess: async (_r, action) => {
      setErr(null);
      setMsg(`Administrator ${action} succeeded.`);
      setReason("");
      await invalidate();
    },
    onError: (e) => {
      setMsg(null);
      setErr(errMessage(e));
    },
  });

  const assignRole = useMutation({
    mutationFn: async () =>
      edgeApi.assignEdgeRole({
        administratorId: id,
        roleId,
      }),
    onSuccess: async () => {
      setErr(null);
      setMsg("Role assigned.");
      setRoleId("");
      await invalidate();
    },
    onError: (e) => {
      setMsg(null);
      setErr(errMessage(e));
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:administrators:read." />
    );
  }

  const status = (query.data?.status ?? "").toUpperCase();

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href="/edge/administrators" />
      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load administrator"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.data ? (
        <>
          <header className="space-y-[var(--space-1)]">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="type-xl font-semibold text-[var(--text-primary)]">
                {query.data.displayName ?? query.data.email ?? query.data.id}
              </h1>
              <Badge>{query.data.status ?? "—"}</Badge>
            </div>
            <p className="type-sm text-[var(--text-secondary)]">
              {query.data.email}
            </p>
            <dl className="mt-[var(--space-4)] grid gap-[var(--space-3)] sm:grid-cols-2">
              <div>
                <dt className="type-xs text-[var(--text-muted)]">ID</dt>
                <dd className="type-sm font-mono text-[var(--text-primary)]">
                  {query.data.id}
                </dd>
              </div>
              {query.data.externalIdentityId ? (
                <div>
                  <dt className="type-xs text-[var(--text-muted)]">
                    External identity
                  </dt>
                  <dd className="type-sm font-mono text-[var(--text-primary)]">
                    {query.data.externalIdentityId}
                  </dd>
                </div>
              ) : null}
            </dl>
          </header>

          {msg ? (
            <p className="type-sm text-[var(--success)]">{msg}</p>
          ) : null}
          {err ? (
            <p role="alert" className="type-sm text-[var(--danger)]">
              {err}
            </p>
          ) : null}

          <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
            <h2 className="type-md font-semibold">Lifecycle</h2>
            <input
              className={fieldControlClass}
              placeholder="Reason (optional for suspend/deactivate)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {status === "ACTIVE" ? (
                <EdgePermissionGate permission="platform:administrators:suspend">
                  <Button
                    variant="outline"
                    disabled={lifecycle.isPending}
                    onClick={() => lifecycle.mutate("suspend")}
                  >
                    Suspend
                  </Button>
                </EdgePermissionGate>
              ) : null}
              {status === "SUSPENDED" ? (
                <EdgePermissionGate permission="platform:administrators:suspend">
                  <Button
                    variant="outline"
                    disabled={lifecycle.isPending}
                    onClick={() => lifecycle.mutate("reinstate")}
                  >
                    Reinstate
                  </Button>
                </EdgePermissionGate>
              ) : null}
              {status !== "DEACTIVATED" ? (
                <EdgePermissionGate permission="platform:administrators:deactivate">
                  <Button
                    variant="ghost"
                    disabled={lifecycle.isPending}
                    onClick={() => lifecycle.mutate("deactivate")}
                  >
                    Deactivate
                  </Button>
                </EdgePermissionGate>
              ) : null}
            </div>
          </section>

          <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
            <h2 className="type-md font-semibold">Memberships</h2>
            {membershipsQ.isLoading ? <EdgeLoadingState /> : null}
            <ul className="divide-y divide-[var(--border)]">
              {(membershipsQ.data ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between gap-3 py-2 type-sm"
                >
                  <span className="font-mono type-xs">{m.verticalId}</span>
                  <Badge>{m.status ?? "—"}</Badge>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
            <h2 className="type-md font-semibold">Effective permissions</h2>
            <pre className="max-h-48 overflow-auto rounded bg-[var(--surface-muted)] p-3 type-xs">
              {JSON.stringify(permsQ.data ?? {}, null, 2)}
            </pre>
          </section>

          <EdgePermissionGate permission="authorization:roles:assign">
            <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <h2 className="type-md font-semibold">Assign role</h2>
              <select
                className={fieldControlClass}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">Select role…</option>
                {(rolesQ.data ?? []).map((r) => {
                  const row = r as Record<string, unknown>;
                  const rid = String(row.id ?? "");
                  const label = String(row.name ?? row.code ?? rid);
                  return (
                    <option key={rid} value={rid}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <Button
                disabled={!roleId || assignRole.isPending}
                onClick={() => assignRole.mutate()}
              >
                Assign
              </Button>
            </section>
          </EdgePermissionGate>
        </>
      ) : null}
    </div>
  );
}
