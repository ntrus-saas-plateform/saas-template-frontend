"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, PageHeader } from "@/components/shell/page-header";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { RoleMultiSelect } from "@/components/identity/role-multi-select";
import { PermissionPicker } from "@/components/identity/permission-picker";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions, type RowActionItem } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/feedback/toast";
import {
  identityApi,
  type ApplicationUser,
  type Membership,
  type MembershipResourceScope,
} from "@/lib/api/identity";
import {
  userDisplayName,
  userEmail,
  userInitials,
  userJobTitle,
  userProfile,
  userStatusLabel,
  userStatusTone,
} from "@/lib/identity/user-display";
import { formatDateTime, formatRelativeTime } from "@/lib/format/datetime";
import { hasPermission } from "@/lib/access/permissions";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { Ban, CheckCircle2, Pencil, UserMinus } from "lucide-react";

const TABS = [
  { id: "overview", label: "Aperçu" },
  { id: "memberships", label: "Accès & rôles" },
  { id: "account", label: "Compte" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const MEMBER_STATUSES = ["ACTIVE", "SUSPENDED", "INVITED"] as const;

type MembershipForm = {
  organizationId: string;
  roles: string[];
  permissions: string[];
  resourceScopes: MembershipResourceScope[];
  status: string;
  department: string;
  position: string;
  expiresAt: string;
};

function emptyGrantForm(defaultOrgId: string): MembershipForm {
  return {
    organizationId: defaultOrgId,
    roles: ["viewer"],
    permissions: [],
    resourceScopes: [],
    status: "ACTIVE",
    department: "",
    position: "",
    expiresAt: "",
  };
}

function statusTone(
  status: string,
): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "INVITED") return "info";
  if (status === "SUSPENDED" || status === "EXPIRED") return "warning";
  if (status === "REMOVED") return "danger";
  return "default";
}

function resolveIdentity(user: ApplicationUser) {
  return user.identityId || user.id;
}

export function UserAdminHub({ identityOrUserId }: { identityOrUserId: string }) {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, capabilities, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const toast = useToast();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];

  const canSuspend = hasPermission(perms, "users:suspend");
  const canUpdateUser = hasPermission(perms, "users:update");
  const canCreateMembership = hasPermission(perms, "memberships:create");
  const canUpdateMembership = hasPermission(perms, "memberships:update");
  const canRevokeMembership = hasPermission(perms, "memberships:revoke");

  const [tab, setTab] = useState<TabId>("overview");
  const [lifecycleAction, setLifecycleAction] = useState<
    "suspend" | "disable" | "reactivate" | null
  >(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState<MembershipForm>(() =>
    emptyGrantForm(context?.organizationId ?? ""),
  );
  const [editMember, setEditMember] = useState<Membership | null>(null);
  const [editForm, setEditForm] = useState<MembershipForm | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: [...idk.users(), "me"],
    queryFn: async () => api.users.me(),
  });
  const me = meQuery.data?.data;

  const userQuery = useQuery({
    queryKey: idk.user(identityOrUserId),
    queryFn: async () => api.users.get(identityOrUserId),
  });

  const user = userQuery.data?.data;
  const identityId = user ? resolveIdentity(user) : identityOrUserId;

  const membershipsQuery = useQuery({
    queryKey: [...idk.memberships(), "by-user", identityId],
    queryFn: async () =>
      api.memberships.list(1, 100, undefined, { search: identityId }),
    enabled: Boolean(identityId),
  });

  const rolesQuery = useQuery({
    queryKey: idk.roles(),
    queryFn: async () => api.roles.list(1, 100),
    enabled: grantOpen || Boolean(editMember),
  });

  const catalogQuery = useQuery({
    queryKey: [...idk.permissions(), "all"],
    queryFn: async () => api.permissions.listAll(),
    enabled: grantOpen || Boolean(editMember),
  });

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) map.set(org.id, org.name);
    return map;
  }, [organizations]);

  const memberships = useMemo(() => {
    const rows = membershipsQuery.data?.data ?? [];
    return rows.filter(
      (m) =>
        m.userId === identityId ||
        m.userId === user?.id ||
        m.userId === user?.identityId,
    );
  }, [membershipsQuery.data?.data, identityId, user?.id, user?.identityId]);

  const orgOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.name,
      })),
    [organizations],
  );

  const roles = rolesQuery.data?.data ?? [];
  const permissionCatalog = catalogQuery.data?.data ?? [];

  const isSelf = Boolean(
    me &&
      user &&
      (user.id === me.id ||
        (user.identityId &&
          me.identityId &&
          user.identityId === me.identityId)),
  );

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: idk.user(identityOrUserId) });
    await qc.invalidateQueries({ queryKey: idk.users() });
    await qc.invalidateQueries({ queryKey: ["identity", "memberships"] });
  };

  const lifecycle = useMutation({
    mutationFn: async () => {
      if (lifecycleAction === "suspend") return api.users.suspend(identityId);
      if (lifecycleAction === "disable") return api.users.disable(identityId);
      return api.users.reactivate(identityId);
    },
    onSuccess: async () => {
      setLifecycleAction(null);
      toast.push({ title: "Statut compte mis à jour", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const grant = useMutation({
    mutationFn: () =>
      api.memberships.create({
        userId: identityId,
        organizationId: grantForm.organizationId,
        roles: grantForm.roles,
        permissions: grantForm.permissions,
        resourceScopes: grantForm.resourceScopes,
        status: grantForm.status,
        department: grantForm.department || undefined,
        position: grantForm.position || undefined,
        expiresAt: grantForm.expiresAt
          ? new Date(grantForm.expiresAt).toISOString()
          : undefined,
      }),
    onSuccess: async () => {
      setGrantOpen(false);
      setGrantForm(emptyGrantForm(context?.organizationId ?? ""));
      toast.push({ title: "Accès accordé", tone: "success" });
      await invalidate();
      setTab("memberships");
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const updateMembership = useMutation({
    mutationFn: () => {
      if (!editMember || !editForm) throw new Error("Nothing to update");
      return api.memberships.patch(editMember.id, {
        roles: editForm.roles,
        permissions: editForm.permissions,
        resourceScopes: editForm.resourceScopes,
        status: editForm.status,
        department: editForm.department || null,
        position: editForm.position || null,
        expiresAt: editForm.expiresAt
          ? new Date(editForm.expiresAt).toISOString()
          : null,
      });
    },
    onSuccess: async () => {
      setEditMember(null);
      setEditForm(null);
      toast.push({ title: "Membership mis à jour", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const setMembershipStatus = useMutation({
    mutationFn: (input: { membershipId: string; status: string; roles: string[] }) =>
      api.memberships.patch(input.membershipId, {
        status: input.status,
        roles: input.roles,
      }),
    onSuccess: async () => {
      toast.push({ title: "Statut membership mis à jour", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.memberships.revoke(id),
    onSuccess: async () => {
      setRevokeId(null);
      toast.push({ title: "Accès révoqué", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const openEdit = (m: Membership) => {
    setEditMember(m);
    setEditForm({
      organizationId: m.organizationId,
      roles: [...(m.roles ?? [])],
      permissions: [...(m.permissions ?? [])],
      resourceScopes: [...(m.resourceScopes ?? [])],
      status: String(m.status ?? "ACTIVE"),
      department: String(m.department ?? ""),
      position: String(m.position ?? ""),
      expiresAt: m.expiresAt
        ? new Date(String(m.expiresAt)).toISOString().slice(0, 16)
        : "",
    });
  };

  const columns = useMemo<DataTableColumn<Membership>[]>(
    () => [
      {
        id: "org",
        header: "Organisation",
        cell: (row) => (
          <div className="min-w-0">
            <Link
              href={`/identity/organizations/${row.organizationId}?tab=members`}
              className="font-medium text-[var(--primary)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {orgNameById.get(row.organizationId) ?? row.organizationId}
            </Link>
            <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">
              {row.organizationId.slice(0, 8)}…
            </p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) => (
          <Badge tone={statusTone(String(row.status ?? ""))}>
            {String(row.status ?? "—")}
          </Badge>
        ),
      },
      {
        id: "roles",
        header: "Rôles",
        cell: (row) => (
          <div className="flex max-w-[16rem] flex-wrap gap-1">
            {(row.roles ?? []).length === 0
              ? "—"
              : (row.roles ?? []).map((r) => (
                  <Badge key={r} tone="info">
                    {r}
                  </Badge>
                ))}
          </div>
        ),
      },
      {
        id: "employment",
        header: "Poste",
        cell: (row) => (
          <div className="text-sm">
            <p>{String(row.position || "—")}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {String(row.department || "—")}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        hideable: false,
        cell: (row) => {
          const items: RowActionItem[] = [];
          if (canUpdateMembership) {
            items.push({
              id: "edit",
              label: "Modifier rôles",
              onClick: () => openEdit(row),
              icon: <Pencil className="size-[var(--icon-sm)]" aria-hidden />,
            });
            if (row.status === "ACTIVE") {
              items.push({
                id: "suspend",
                label: "Suspendre accès",
                onClick: () =>
                  setMembershipStatus.mutate({
                    membershipId: row.id,
                    status: "SUSPENDED",
                    roles: row.roles ?? [],
                  }),
                disabled: setMembershipStatus.isPending,
                icon: <Ban className="size-[var(--icon-sm)]" aria-hidden />,
              });
            }
            if (row.status === "SUSPENDED" || row.status === "INVITED") {
              items.push({
                id: "activate",
                label: "Activer accès",
                onClick: () =>
                  setMembershipStatus.mutate({
                    membershipId: row.id,
                    status: "ACTIVE",
                    roles: row.roles ?? [],
                  }),
                disabled: setMembershipStatus.isPending,
                icon: (
                  <CheckCircle2 className="size-[var(--icon-sm)]" aria-hidden />
                ),
              });
            }
          }
          if (canRevokeMembership) {
            items.push({
              id: "revoke",
              label: "Révoquer",
              onClick: () => setRevokeId(row.id),
              tone: "danger",
              separatorBefore: items.length > 0,
              icon: <UserMinus className="size-[var(--icon-sm)]" aria-hidden />,
            });
          }
          return <RowActions items={items} />;
        },
      },
    ],
    [
      canRevokeMembership,
      canUpdateMembership,
      orgNameById,
      setMembershipStatus.isPending,
    ],
  );

  if (userQuery.isLoading) return <Skeleton className="h-48 w-full" />;
  if (userQuery.isError || !user) {
    return (
      <ErrorState
        title="Impossible de charger l’utilisateur"
        description={
          userQuery.error instanceof Error
            ? userQuery.error.message
            : "Utilisateur introuvable."
        }
        onRetry={() => void userQuery.refetch()}
      />
    );
  }

  const profile = userProfile(user);
  const name = userDisplayName(user);
  const email = userEmail(user);
  const job = userJobTitle(user);
  const canPause = canSuspend && user.status === "ACTIVE" && !isSelf;
  const canReactivate =
    canUpdateUser &&
    !isSelf &&
    (user.status === "SUSPENDED" ||
      user.status === "DISABLED" ||
      user.status === "LOCKED");

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={email || "Utilisateur applicatif de ce tenant."}
        back={{ href: "/identity/users", label: "Retour aux utilisateurs" }}
        crumbs={[
          { label: "Utilisateurs", href: "/identity/users" },
          { label: name },
        ]}
        status={
          <Badge tone={userStatusTone(user.status)}>
            {userStatusLabel(user.status)}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreateMembership ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setGrantForm(emptyGrantForm(context?.organizationId ?? ""));
                  setGrantOpen(true);
                  setTab("memberships");
                }}
              >
                Accorder un accès
              </Button>
            ) : null}
            {canPause ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLifecycleAction("suspend")}
                >
                  Suspendre
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setLifecycleAction("disable")}
                >
                  Désactiver
                </Button>
              </>
            ) : null}
            {canReactivate ? (
              <Button
                type="button"
                onClick={() => setLifecycleAction("reactivate")}
              >
                Réactiver
              </Button>
            ) : null}
          </div>
        }
      />

      <Tabs
        tabs={[...TABS]}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] font-semibold text-[var(--text-secondary)]">
              {userInitials(name)}
            </span>
            <dl className="grid min-w-0 flex-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="type-xs text-[var(--text-muted)]">Email</dt>
                <dd className="type-sm">{email || "—"}</dd>
              </div>
              <div>
                <dt className="type-xs text-[var(--text-muted)]">Poste</dt>
                <dd className="type-sm">{job || "—"}</dd>
              </div>
              <div>
                <dt className="type-xs text-[var(--text-muted)]">Téléphone</dt>
                <dd className="type-sm">
                  {[profile.phone, profile.mobile].filter(Boolean).join(" · ") ||
                    "—"}
                </dd>
              </div>
              <div>
                <dt className="type-xs text-[var(--text-muted)]">
                  Matricule
                </dt>
                <dd className="type-sm">
                  {(profile.employeeNumber as string) || "—"}
                </dd>
              </div>
              <div>
                <dt className="type-xs text-[var(--text-muted)]">
                  Dernière activité
                </dt>
                <dd className="type-sm">
                  {formatRelativeTime(user.lastSeenAt)}
                </dd>
              </div>
              <div>
                <dt className="type-xs text-[var(--text-muted)]">Créé le</dt>
                <dd className="type-sm">{formatDateTime(user.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="type-xs text-[var(--text-muted)]">
                  Identité Keycloak
                </dt>
                <dd className="type-sm font-mono text-[var(--text-secondary)]">
                  {identityId}
                </dd>
              </div>
            </dl>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="type-sm font-semibold text-[var(--text-primary)]">
                Organisations ({memberships.length})
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTab("memberships")}
              >
                Gérer les accès
              </Button>
            </div>
            {membershipsQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : memberships.length === 0 ? (
              <p className="type-sm text-[var(--text-muted)]">
                Aucun membership organisation. Accordez un accès pour assigner
                des rôles.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                {memberships.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-[var(--space-4)] py-[var(--space-3)]"
                  >
                    <div>
                      <p className="font-medium">
                        {orgNameById.get(m.organizationId) || "Organisation"}
                      </p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {[m.position, m.department].filter(Boolean).join(" · ") ||
                          "Membre"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge tone={statusTone(String(m.status ?? ""))}>
                        {String(m.status ?? "—")}
                      </Badge>
                      {(m.roles ?? []).map((role) => (
                        <Badge key={role}>{role}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === "memberships" ? (
        <div className="space-y-3">
          <p className="type-sm text-[var(--text-muted)]">
            Les rôles sont portés par le membership organisation (pas par le
            compte seul). Modifiez, suspendez ou révoquez ici.
          </p>
          {membershipsQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : membershipsQuery.isError ? (
            <ErrorState
              title="Impossible de charger les accès"
              description={
                membershipsQuery.error instanceof Error
                  ? membershipsQuery.error.message
                  : undefined
              }
              onRetry={() => void membershipsQuery.refetch()}
            />
          ) : memberships.length === 0 ? (
            <EmptyState
              title="Aucun accès organisation"
              description="Accordez un membership pour assigner des rôles à cet utilisateur."
              actionLabel={
                canCreateMembership ? "Accorder un accès" : undefined
              }
              onAction={
                canCreateMembership
                  ? () => {
                      setGrantForm(
                        emptyGrantForm(context?.organizationId ?? ""),
                      );
                      setGrantOpen(true);
                    }
                  : undefined
              }
            />
          ) : (
            <DataTable
              fill={false}
              columns={columns}
              rows={memberships}
              localSearch
              onRefresh={() => void membershipsQuery.refetch()}
              refreshing={membershipsQuery.isFetching}
              onRowClick={(row) => {
                if (canUpdateMembership) openEdit(row);
              }}
              toolbar={
                canCreateMembership ? (
                  <Button
                    type="button"
                    size="sm"
                    className="sm:ml-auto"
                    onClick={() => {
                      setGrantForm(
                        emptyGrantForm(context?.organizationId ?? ""),
                      );
                      setGrantOpen(true);
                    }}
                  >
                    Accorder un accès
                  </Button>
                ) : null
              }
            />
          )}
        </div>
      ) : null}

      {tab === "account" ? (
        <div className="max-w-xl space-y-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
          <h2 className="type-sm font-semibold">Cycle de vie du compte</h2>
          <p className="type-sm text-[var(--text-muted)]">
            Suspendre / désactiver agit sur le compte applicatif et Keycloak.
            Les rôles d’organisation se gèrent dans l’onglet Accès &amp; rôles.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--text-muted)]">Statut</dt>
              <dd>
                <Badge tone={userStatusTone(user.status)}>
                  {userStatusLabel(user.status)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Dernière activité</dt>
              <dd>{formatRelativeTime(user.lastSeenAt)}</dd>
            </div>
          </dl>
          {isSelf ? (
            <p className="type-sm text-[var(--text-muted)]">
              Vous ne pouvez pas modifier le statut de votre propre compte.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canPause ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLifecycleAction("suspend")}
                  >
                    Suspendre
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setLifecycleAction("disable")}
                  >
                    Désactiver
                  </Button>
                </>
              ) : null}
              {canReactivate ? (
                <Button
                  type="button"
                  onClick={() => setLifecycleAction("reactivate")}
                >
                  Réactiver
                </Button>
              ) : null}
              {!canPause && !canReactivate ? (
                <p className="type-sm text-[var(--text-muted)]">
                  Permissions users:suspend / users:update requises.
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <Dialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        title="Accorder un accès"
        description={`Ajouter ${name} à une organisation avec des rôles.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setGrantOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={
                !grantForm.organizationId ||
                grantForm.roles.length === 0 ||
                grant.isPending
              }
              onClick={() => grant.mutate()}
            >
              {grant.isPending ? "En cours…" : "Accorder"}
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
          <Field label="Organisation">
            <SearchableSelect
              value={grantForm.organizationId}
              options={orgOptions}
              placeholder="Choisir une organisation…"
              onChange={(v) =>
                setGrantForm((f) => ({ ...f, organizationId: v }))
              }
            />
          </Field>
          <Field label="Statut">
            <Select
              value={grantForm.status}
              onChange={(e) =>
                setGrantForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              {MEMBER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rôles">
            <RoleMultiSelect
              roles={roles}
              selected={grantForm.roles}
              onChange={(rolesNext) =>
                setGrantForm((f) => ({ ...f, roles: rolesNext }))
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Service">
              <Input
                value={grantForm.department}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, department: e.target.value }))
                }
              />
            </Field>
            <Field label="Poste">
              <Input
                value={grantForm.position}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, position: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Expire le" hint="Optionnel.">
            <Input
              type="datetime-local"
              value={grantForm.expiresAt}
              onChange={(e) =>
                setGrantForm((f) => ({ ...f, expiresAt: e.target.value }))
              }
            />
          </Field>
          <Field
            label="Permissions directes"
            hint="En plus des rôles (optionnel)."
          >
            {catalogQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <PermissionPicker
                permissions={permissionCatalog}
                selected={grantForm.permissions}
                onChange={(permissions) =>
                  setGrantForm((f) => ({ ...f, permissions }))
                }
              />
            )}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editMember && editForm)}
        onOpenChange={(open) => {
          if (!open) {
            setEditMember(null);
            setEditForm(null);
          }
        }}
        title="Modifier l’accès"
        description={
          editMember
            ? orgNameById.get(editMember.organizationId) ??
              editMember.organizationId
            : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditMember(null);
                setEditForm(null);
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={
                !editForm ||
                editForm.roles.length === 0 ||
                updateMembership.isPending
              }
              onClick={() => updateMembership.mutate()}
            >
              {updateMembership.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        {editForm ? (
          <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
            <Field label="Statut">
              <Select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) =>
                    f ? { ...f, status: e.target.value } : f,
                  )
                }
              >
                {MEMBER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Rôles">
              <RoleMultiSelect
                roles={roles}
                selected={editForm.roles}
                onChange={(rolesNext) =>
                  setEditForm((f) => (f ? { ...f, roles: rolesNext } : f))
                }
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Service">
                <Input
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, department: e.target.value } : f,
                    )
                  }
                />
              </Field>
              <Field label="Poste">
                <Input
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, position: e.target.value } : f,
                    )
                  }
                />
              </Field>
            </div>
            <Field label="Expire le">
              <Input
                type="datetime-local"
                value={editForm.expiresAt}
                onChange={(e) =>
                  setEditForm((f) =>
                    f ? { ...f, expiresAt: e.target.value } : f,
                  )
                }
              />
            </Field>
            <Field label="Permissions directes">
              {catalogQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <PermissionPicker
                  permissions={permissionCatalog}
                  selected={editForm.permissions}
                  onChange={(permissions) =>
                    setEditForm((f) => (f ? { ...f, permissions } : f))
                  }
                />
              )}
            </Field>
            {editMember ? (
              <p className="type-xs text-[var(--text-muted)]">
                Vue organisation complète :{" "}
                <Link
                  href={`/identity/organizations/${editMember.organizationId}?tab=members`}
                  className="text-[var(--primary)] underline"
                >
                  Members
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={lifecycleAction !== null}
        onOpenChange={(open) => {
          if (!open) setLifecycleAction(null);
        }}
        title={
          lifecycleAction === "reactivate"
            ? "Réactiver le compte ?"
            : lifecycleAction === "disable"
              ? "Désactiver le compte ?"
              : "Suspendre le compte ?"
        }
        description="Met à jour le statut applicatif et Keycloak si disponible."
        confirmLabel={
          lifecycleAction === "reactivate"
            ? "Réactiver"
            : lifecycleAction === "disable"
              ? "Désactiver"
              : "Suspendre"
        }
        tone={lifecycleAction === "reactivate" ? "default" : "danger"}
        loading={lifecycle.isPending}
        onConfirm={() => lifecycle.mutate()}
      />

      <ConfirmDialog
        open={revokeId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        title="Révoquer cet accès ?"
        description="L’utilisateur perdra les rôles de cette organisation."
        confirmLabel="Révoquer"
        tone="danger"
        loading={revoke.isPending}
        onConfirm={() => {
          if (revokeId) revoke.mutate(revokeId);
        }}
      />
    </div>
  );
}
