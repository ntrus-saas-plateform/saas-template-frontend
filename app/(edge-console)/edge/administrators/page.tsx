"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export default function EdgeAdministratorsPage() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:read");
  const canInvite =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:invite");
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["edge", "administrators"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listAdministrators();
      return data ?? [];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      edgeApi.inviteAdministrator({
        email: email.trim(),
        displayName: displayName.trim(),
      }),
    onSuccess: async (res) => {
      setFormError(null);
      setEmail("");
      setDisplayName("");
      setInviteToken(res.data?.token ?? null);
      await qc.invalidateQueries({ queryKey: ["edge", "administrators"] });
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:administrators:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <div className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            Administrators
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            Invite, suspend, and govern Edge platform administrators.
          </p>
        </div>
      </header>

      {canInvite ? (
        <EdgePermissionGate permission="platform:administrators:invite">
          <form
            className="max-w-xl space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
          >
            <h2 className="type-md font-semibold">Invite administrator</h2>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Display name
              </span>
              <input
                className={fieldControlClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Email
              </span>
              <input
                type="email"
                className={fieldControlClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            {formError ? (
              <p role="alert" className="type-sm text-[var(--danger)]">
                {formError}
              </p>
            ) : null}
            {inviteToken ? (
              <p className="type-xs text-[var(--text-muted)]">
                Invitation created. One-time token (lab):{" "}
                <code className="font-mono text-[var(--text-primary)]">
                  {inviteToken}
                </code>
              </p>
            ) : null}
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </form>
        </EdgePermissionGate>
      ) : null}

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load administrators"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !query.data.length ? (
        <EdgeEmptyState
          title="No administrators"
          description="Invite the first Edge administrator to start governance."
        />
      ) : null}
      {query.isSuccess && query.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((admin) => (
            <li key={admin.id}>
              <Link
                href={`/edge/administrators/${admin.id}`}
                className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--surface-muted)]"
              >
                <span>
                  <span className="block font-medium text-[var(--text-primary)]">
                    {admin.displayName ?? admin.email ?? admin.id}
                  </span>
                  <span className="type-xs text-[var(--text-muted)]">
                    {[admin.email, admin.status].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="type-xs text-[var(--primary)]">Manage</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
