"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

type TabId = "sessions" | "mfa" | "emergency" | "delegations" | "audit";

const TABS: { id: TabId; label: string; permission?: string }[] = [
  { id: "sessions", label: "Sessions", permission: "security:sessions:read" },
  { id: "mfa", label: "MFA", permission: "security:policies:read" },
  {
    id: "emergency",
    label: "Emergency",
    permission: "emergency-access:request",
  },
  { id: "delegations", label: "Delegations", permission: "delegation:read" },
  { id: "audit", label: "Audit link" },
];

const SECURITY_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const SECURITY_STUDIO_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "Sessions", itemIds: ["sessions"] },
  { title: "Posture", itemIds: ["mfa"] },
  { title: "Access", itemIds: ["emergency", "delegations"] },
  { title: "Evidence", itemIds: ["audit"] },
];

export default function EdgeSecurityPage() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading security studio…" />}>
      <EdgeSecurityStudio />
    </Suspense>
  );
}

function EdgeSecurityStudio() {
  const { permissions, me } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasAnyEdgePermission(permissions, [
      "security:sessions:read",
      "audit:read",
      "security:policies:read",
    ]);
  const qc = useQueryClient();
  const [tab, setTab] = useStudioSectionParam<TabId>(
    "sessions",
    SECURITY_SECTION_IDS,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

  const sessionsQ = useQuery({
    queryKey: ["edge", "security", "sessions"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listSecuritySessions();
      return Array.isArray(data) ? data : [];
    },
  });

  const mfaQ = useQuery({
    queryKey: ["edge", "security", "mfa"],
    enabled:
      allowed &&
      (!permissionKnown ||
        hasEdgePermission(permissions, "security:policies:read")),
    queryFn: async () => {
      const { data } = await edgeApi.getSecurityMfaState();
      return data;
    },
  });

  const delegationsQ = useQuery({
    queryKey: ["edge", "security", "delegations"],
    enabled:
      allowed &&
      (!permissionKnown || hasEdgePermission(permissions, "delegation:read")),
    queryFn: async () => {
      const { data } = await edgeApi.listSecurityDelegations();
      return Array.isArray(data) ? data : [];
    },
  });

  const revokeOne = useMutation({
    mutationFn: (sessionId: string) =>
      edgeApi.revokeSecuritySession(sessionId, "console"),
    onSuccess: async () => {
      setErr(null);
      setMsg("Session revoked.");
      await qc.invalidateQueries({ queryKey: ["edge", "security", "sessions"] });
    },
    onError: (e) => {
      setMsg(null);
      setErr(errMessage(e));
    },
  });

  const revokeAll = useMutation({
    mutationFn: () =>
      edgeApi.revokeAllSecuritySessions({
        administratorId: me?.id,
        reason: "console-revoke-all",
      }),
    onSuccess: async () => {
      setErr(null);
      setMsg("All sessions revoked.");
      await qc.invalidateQueries({ queryKey: ["edge", "security", "sessions"] });
    },
    onError: (e) => {
      setMsg(null);
      setErr(errMessage(e));
    },
  });

  const emergency = useMutation({
    mutationFn: () =>
      edgeApi.requestEmergencyAccess({
        justification: justification.trim(),
        scope: { source: "edge-console" },
      }),
    onSuccess: () => {
      setErr(null);
      setMsg("Emergency access requested.");
      setJustification("");
    },
    onError: (e) => {
      setMsg(null);
      setErr(errMessage(e));
    },
  });

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    return SECURITY_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .filter((id) => {
          const t = TABS.find((x) => x.id === id);
          if (!t?.permission) return true;
          return (
            !permissionKnown || hasEdgePermission(permissions, t.permission)
          );
        })
        .map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return { id: t.id, label: t.label };
        }),
    })).filter((g) => g.items.length > 0);
  }, [permissionKnown, permissions]);

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires security:sessions:read." />
    );
  }

  return (
    <EdgeStudioShell
      title="Security studio"
      description="Sessions, MFA posture, delegations, and break-glass controls."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => setTab(id as TabId)}
      testId="edge-security-studio"
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/edge/administrators">Administrators →</Link>
          </Button>
          <EdgePermissionGate permission="security:sessions:revoke">
            <Button
              variant="outline"
              size="sm"
              disabled={revokeAll.isPending}
              onClick={() => revokeAll.mutate()}
            >
              Revoke all sessions
            </Button>
          </EdgePermissionGate>
        </>
      }
    >
      {msg ? <p className="type-sm text-[var(--success)]">{msg}</p> : null}
      {err ? (
        <p role="alert" className="type-sm text-[var(--danger)]">
          {err}
        </p>
      ) : null}

      {tab === "sessions" ? (
        <section className="space-y-[var(--space-3)]">
          <h2 className="type-md font-semibold">Active sessions</h2>
          {sessionsQ.isLoading ? <EdgeLoadingState /> : null}
          {sessionsQ.isError ? (
            <EdgeErrorState
              description={
                sessionsQ.error instanceof Error
                  ? sessionsQ.error.message
                  : "Failed to load security sessions"
              }
              onRetry={() => void sessionsQ.refetch()}
            />
          ) : null}
          {sessionsQ.isSuccess && !sessionsQ.data.length ? (
            <EdgeEmptyState
              title="No sessions listed"
              description="Active Edge security sessions will appear here when available."
            />
          ) : null}
          {sessionsQ.isSuccess && sessionsQ.data.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
              {sessionsQ.data.map((row, index) => {
                const item = row as Record<string, unknown>;
                const sid =
                  typeof item.id === "string" ? item.id : `session-${index}`;
                return (
                  <li
                    key={sid}
                    className="flex flex-wrap items-center justify-between gap-3 px-[var(--space-4)] py-[var(--space-3)] type-sm"
                  >
                    <span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {sid}
                      </span>
                      {typeof item.status === "string"
                        ? ` · ${item.status}`
                        : null}
                    </span>
                    <EdgePermissionGate permission="security:sessions:revoke">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={revokeOne.isPending}
                        onClick={() => revokeOne.mutate(sid)}
                      >
                        Revoke
                      </Button>
                    </EdgePermissionGate>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tab === "mfa" ? (
        <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
          <h2 className="type-md font-semibold">MFA posture</h2>
          {mfaQ.isLoading ? <EdgeLoadingState /> : null}
          {mfaQ.isError ? (
            <EdgeErrorState
              description={errMessage(mfaQ.error)}
              onRetry={() => void mfaQ.refetch()}
            />
          ) : null}
          {mfaQ.isSuccess ? (
            <pre className="max-h-40 overflow-auto rounded bg-[var(--surface-muted)] p-3 type-xs">
              {JSON.stringify(mfaQ.data ?? { status: "unavailable" }, null, 2)}
            </pre>
          ) : null}
        </section>
      ) : null}

      {tab === "emergency" ? (
        <EdgePermissionGate permission="emergency-access:request">
          <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
            <h2 className="type-md font-semibold">Emergency access</h2>
            <textarea
              className={fieldControlClass}
              rows={3}
              placeholder="Justification (required)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <Button
              disabled={justification.trim().length < 8 || emergency.isPending}
              onClick={() => emergency.mutate()}
            >
              Request break-glass
            </Button>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "delegations" ? (
        <section className="space-y-[var(--space-3)]">
          <h2 className="type-md font-semibold">Delegations</h2>
          {delegationsQ.isLoading ? <EdgeLoadingState /> : null}
          {delegationsQ.isError ? (
            <EdgeErrorState
              description={errMessage(delegationsQ.error)}
              onRetry={() => void delegationsQ.refetch()}
            />
          ) : null}
          {delegationsQ.isSuccess && !delegationsQ.data.length ? (
            <EdgeEmptyState
              title="No delegations"
              description="Delegated operations for your administrator identity."
            />
          ) : null}
          {delegationsQ.isSuccess && delegationsQ.data.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
              {delegationsQ.data.map((row, i) => {
                const item = row as Record<string, unknown>;
                const did = typeof item.id === "string" ? item.id : `d-${i}`;
                return (
                  <li
                    key={did}
                    className="flex items-center justify-between gap-3 px-4 py-3 type-sm"
                  >
                    <span className="font-mono">{did}</span>
                    <EdgePermissionGate permission="delegation:revoke">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void edgeApi
                            .revokeSecurityDelegation(did)
                            .then(() =>
                              qc.invalidateQueries({
                                queryKey: ["edge", "security", "delegations"],
                              }),
                            )
                            .catch((e) => setErr(errMessage(e)));
                        }}
                      >
                        Revoke
                      </Button>
                    </EdgePermissionGate>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tab === "audit" ? (
        <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
          <h2 className="type-md font-semibold">Audit trail</h2>
          <p className="type-sm text-[var(--text-secondary)]">
            Security and administration events live on the dedicated Audit
            console (empty / error / export CSV).
          </p>
          <Button asChild>
            <Link href="/edge/audit">Open audit →</Link>
          </Button>
        </section>
      ) : null}
    </EdgeStudioShell>
  );
}
