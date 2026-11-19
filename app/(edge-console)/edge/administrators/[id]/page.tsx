"use client";

import { Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeStudioShell,
  useStudioSectionParam,
  type StudioSectionGroup,
} from "@/components/edge/studio";
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

type TabId = "profile" | "lifecycle" | "memberships" | "permissions" | "roles";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "memberships", label: "Memberships" },
  { id: "permissions", label: "Permissions" },
  { id: "roles", label: "Roles" },
];

const ADMIN_DETAIL_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const ADMIN_DETAIL_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "Identity", itemIds: ["profile"] },
  { title: "Governance", itemIds: ["lifecycle", "memberships"] },
  { title: "Authorization", itemIds: ["permissions", "roles"] },
];

export default function EdgeAdministratorDetailPage() {
  return (
    <Suspense
      fallback={<EdgeLoadingState label="Loading administrator studio…" />}
    >
      <EdgeAdministratorDetailStudio />
    </Suspense>
  );
}

function EdgeAdministratorDetailStudio() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:read");
  const qc = useQueryClient();
  const [tab, setTab] = useStudioSectionParam<TabId>(
    "profile",
    ADMIN_DETAIL_SECTION_IDS,
  );
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

  const studioGroups: StudioSectionGroup[] = useMemo(
    () =>
      ADMIN_DETAIL_GROUPS.map((g) => ({
        title: g.title,
        items: g.itemIds.map((sid) => {
          const t = TABS.find((x) => x.id === sid)!;
          return { id: t.id, label: t.label };
        }),
      })),
    [],
  );

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
        <EdgeStudioShell
          title={
            query.data.displayName ?? query.data.email ?? query.data.id
          }
          description={query.data.email ?? undefined}
          groups={studioGroups}
          section={tab}
          onSectionChange={(next) => setTab(next as TabId)}
          testId="edge-administrator-detail-studio"
          actions={<Badge>{query.data.status ?? "—"}</Badge>}
        >
          {msg ? (
            <p className="type-sm text-[var(--success)]">{msg}</p>
          ) : null}
          {err ? (
            <p role="alert" className="type-sm text-[var(--danger)]">
              {err}
            </p>
          ) : null}

          {tab === "profile" ? (
            <section className="space-y-[var(--space-3)]">
              <dl className="grid gap-[var(--space-3)] sm:grid-cols-2">
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
            </section>
          ) : null}

          {tab === "lifecycle" ? (
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
          ) : null}

          {tab === "memberships" ? (
            <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <h2 className="type-md font-semibold">Memberships</h2>
              {membershipsQ.isLoading ? <EdgeLoadingState /> : null}
              {membershipsQ.isError ? (
                <EdgeErrorState description={errMessage(membershipsQ.error)} />
              ) : null}
              {membershipsQ.isSuccess && !(membershipsQ.data ?? []).length ? (
                <EdgeEmptyState
                  title="No memberships"
                  description="Vertical memberships for this administrator."
                />
              ) : null}
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
          ) : null}

          {tab === "permissions" ? (
            <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <h2 className="type-md font-semibold">Effective permissions</h2>
              {permsQ.isLoading ? <EdgeLoadingState /> : null}
              {permsQ.isError ? (
                <EdgeErrorState description={errMessage(permsQ.error)} />
              ) : null}
              {permsQ.isSuccess ? (
                <pre className="max-h-48 overflow-auto rounded bg-[var(--surface-muted)] p-3 type-xs">
                  {JSON.stringify(permsQ.data ?? {}, null, 2)}
                </pre>
              ) : null}
            </section>
          ) : null}

          {tab === "roles" ? (
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
          ) : null}
        </EdgeStudioShell>
      ) : null}
    </div>
  );
}
