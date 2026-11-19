"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
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
import {
  EdgeStudioShell,
  useStudioSectionParam,
  type StudioSectionGroup,
} from "@/components/edge/studio";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

type TabId = "directory" | "invite";

const TABS: { id: TabId; label: string }[] = [
  { id: "directory", label: "Directory" },
  { id: "invite", label: "Invite" },
];

const ADMIN_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const ADMIN_STUDIO_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "People", itemIds: ["directory"] },
  { title: "Onboarding", itemIds: ["invite"] },
];

export default function EdgeAdministratorsPage() {
  return (
    <Suspense
      fallback={<EdgeLoadingState label="Loading administrators studio…" />}
    >
      <EdgeAdministratorsStudio />
    </Suspense>
  );
}

function EdgeAdministratorsStudio() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:read");
  const canInvite =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:invite");
  const qc = useQueryClient();
  const [tab, setTab] = useStudioSectionParam<TabId>(
    "directory",
    ADMIN_SECTION_IDS,
  );
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
      setTab("directory");
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    return ADMIN_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .filter((id) => id !== "invite" || canInvite)
        .map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return { id: t.id, label: t.label };
        }),
    })).filter((g) => g.items.length > 0);
  }, [canInvite]);

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:administrators:read." />
    );
  }

  return (
    <EdgeStudioShell
      title="Administrators studio"
      description="Invite, suspend, and govern Edge platform administrators."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => setTab(id as TabId)}
      testId="edge-administrators-studio"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/edge/security">Security →</Link>
        </Button>
      }
    >
      {tab === "invite" && canInvite ? (
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

      {tab === "directory" ? (
        <section className="space-y-[var(--space-4)]">
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
              actionLabel={canInvite ? "Invite" : undefined}
              onAction={canInvite ? () => setTab("invite") : undefined}
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
        </section>
      ) : null}
    </EdgeStudioShell>
  );
}
