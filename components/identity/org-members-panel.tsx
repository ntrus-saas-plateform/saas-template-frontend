"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState } from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingsPanel } from "@/components/shell/settings-panel";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions, type RowActionItem } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { RoleMultiSelect } from "@/components/identity/role-multi-select";
import { PermissionPicker } from "@/components/identity/permission-picker";
import { ResourceScopeEditor } from "@/components/identity/resource-scope-editor";
import {
  identityApi,
  type ApplicationUser,
  type Invitation,
  type Membership,
  type MembershipResourceScope,
} from "@/lib/api/identity";
import { hasPermission } from "@/lib/access/permissions";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { Ban, CheckCircle2, Pencil, UserMinus } from "lucide-react";

const MEMBER_STATUSES = [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REMOVED",
  "EXPIRED",
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const MEMBER_TABS = [
  { id: "members", label: "Members" },
  { id: "invitations", label: "Invitations" },
];

function statusTone(
  status: string,
): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "INVITED") return "info";
  if (status === "SUSPENDED" || status === "EXPIRED") return "warning";
  if (status === "REMOVED") return "danger";
  return "default";
}

function userLabel(user: ApplicationUser | undefined, fallbackId: string) {
  if (!user) return fallbackId;
  const p = user.profile ?? {};
  return (
    (p.displayName as string) ||
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    (p.email as string) ||
    user.email ||
    user.identityId ||
    user.id ||
    fallbackId
  );
}

function userIdentity(user: ApplicationUser) {
  return user.identityId || user.id;
}

type MemberFormState = {
  userId: string;
  roles: string[];
  permissions: string[];
  resourceScopes: MembershipResourceScope[];
  status: string;
  department: string;
  position: string;
  managerUserId: string;
  expiresAt: string;
};

const emptyGrantForm = (): MemberFormState => ({
  userId: "",
  roles: ["viewer"],
  permissions: [],
  resourceScopes: [],
  status: "ACTIVE",
  department: "",
  position: "",
  managerUserId: "",
  expiresAt: "",
});

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 border-b border-[var(--border)] pb-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
    </div>
  );
}

export function OrgMembersPanel({ organizationId }: { organizationId: string }) {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, capabilities } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const toast = useToast();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const canUpdateMembership = hasPermission(perms, "memberships:update");
  const canRevokeMembership = hasPermission(perms, "memberships:revoke");

  const [subTab, setSubTab] = useState("members");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(20);
  const [invitePage, setInvitePage] = useState(1);
  const [invitePageSize, setInvitePageSize] = useState(20);
  const [inviteSearch, setInviteSearch] = useState("");
  const [debouncedInviteSearch, setDebouncedInviteSearch] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<Membership | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [grantForm, setGrantForm] = useState<MemberFormState>(emptyGrantForm);
  const [editForm, setEditForm] = useState<MemberFormState | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["viewer"]);
  const [inviteExpiresHours, setInviteExpiresHours] = useState("72");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInviteSearch(inviteSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [inviteSearch]);

  useEffect(() => {
    setMemberPage(1);
  }, [statusFilter, debouncedSearch, memberPageSize]);

  useEffect(() => {
    setInvitePage(1);
  }, [debouncedInviteSearch, invitePageSize]);

  const membersQuery = useQuery({
    queryKey: [
      ...idk.organization(organizationId),
      "members",
      memberPage,
      memberPageSize,
      statusFilter,
      debouncedSearch,
    ],
    queryFn: async () =>
      api.memberships.list(memberPage, memberPageSize, organizationId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      }),
  });

  const invitationsQuery = useQuery({
    queryKey: [
      ...idk.organization(organizationId),
      "invitations",
      invitePage,
      invitePageSize,
      debouncedInviteSearch,
    ],
    queryFn: async () =>
      api.invitations.list(invitePage, invitePageSize, organizationId, {
        search: debouncedInviteSearch || undefined,
      }),
    enabled: subTab === "invitations" || inviteOpen,
  });

  const memberIdsQuery = useQuery({
    queryKey: [...idk.organization(organizationId), "members", "grant-ids"],
    queryFn: async () => api.memberships.list(1, 100, organizationId),
    enabled: grantOpen,
  });

  const usersQuery = useQuery({
    queryKey: [...idk.users(), "for-members"],
    queryFn: async () => api.users.list(1, 100),
  });

  const rolesQuery = useQuery({
    queryKey: idk.roles(),
    queryFn: async () => api.roles.list(1, 100),
  });

  const catalogQuery = useQuery({
    queryKey: [...idk.permissions(), "catalog-all", "v2"],
    queryFn: async () => api.permissions.listAll(),
    enabled: grantOpen || Boolean(editMember),
  });

  const warehousesQuery = useQuery({
    queryKey: [...idk.organization(organizationId), "warehouses"],
    queryFn: async () => api.organizations.warehouses.list(organizationId),
    enabled: grantOpen || Boolean(editMember),
  });

  const posQuery = useQuery({
    queryKey: [...idk.organization(organizationId), "pos-terminals"],
    queryFn: async () => api.organizations.posTerminals.list(organizationId),
    enabled: grantOpen || Boolean(editMember),
  });

  const users = usersQuery.data?.data ?? [];
  const roles = rolesQuery.data?.data ?? [];
  const permissionCatalog = catalogQuery.data?.data ?? [];
  const resourceOptionsByType = useMemo(
    () => ({
      warehouse: (warehousesQuery.data?.data ?? []).map((w) => ({
        value: w.id,
        label: w.name || w.code || w.id,
      })),
      pos_terminal: (posQuery.data?.data ?? []).map((t) => ({
        value: t.id,
        label: t.name || t.code || t.id,
      })),
      store: [] as { value: string; label: string }[],
    }),
    [warehousesQuery.data?.data, posQuery.data?.data],
  );
  const members = membersQuery.data?.data ?? [];
  const memberPagination = membersQuery.data?.pagination;
  const invitePagination = invitationsQuery.data?.pagination;
  const usersByIdentity = useMemo(() => {
    const map = new Map<string, ApplicationUser>();
    for (const u of users) {
      map.set(userIdentity(u), u);
      map.set(u.id, u);
    }
    return map;
  }, [users]);

  const activeMemberIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of memberIdsQuery.data?.data ?? []) {
      if (m.status === "REMOVED") continue;
      ids.add(m.userId);
    }
    return ids;
  }, [memberIdsQuery.data?.data]);

  const userOptions = useMemo(
    () =>
      users
        .filter((u) => !activeMemberIds.has(userIdentity(u)) && !activeMemberIds.has(u.id))
        .map((u) => {
          const email =
            u.email || (u.profile as { email?: string } | null)?.email;
          return {
            value: userIdentity(u),
            label: `${userLabel(u, userIdentity(u))}${email ? ` · ${email}` : ""}`,
          };
        }),
    [users, activeMemberIds],
  );

  const allUserOptions = useMemo(
    () =>
      users.map((u) => {
        const email =
          u.email || (u.profile as { email?: string } | null)?.email;
        return {
          value: userIdentity(u),
          label: `${userLabel(u, userIdentity(u))}${email ? ` · ${email}` : ""}`,
        };
      }),
    [users],
  );

  const managerOptions = useMemo(
    () => [{ value: "", label: "None" }, ...allUserOptions],
    [allUserOptions],
  );

  const stats = useMemo(() => {
    const s = membersQuery.data?.stats;
    return {
      total: Number(s?.total ?? memberPagination?.total ?? 0),
      active: Number(s?.active ?? 0),
      invited: Number(s?.invited ?? 0),
      suspended: Number(s?.suspended ?? 0),
    };
  }, [membersQuery.data?.stats, memberPagination?.total]);

  const invalidate = async () => {
    await qc.invalidateQueries({
      queryKey: [...idk.organization(organizationId), "members"],
    });
    await qc.invalidateQueries({
      queryKey: [...idk.organization(organizationId), "invitations"],
    });
  };

  const grant = useMutation({
    mutationFn: () =>
      api.memberships.create({
        userId: grantForm.userId,
        organizationId,
        roles: grantForm.roles,
        permissions: grantForm.permissions,
        resourceScopes: grantForm.resourceScopes,
        status: grantForm.status,
        department: grantForm.department || undefined,
        position: grantForm.position || undefined,
        managerUserId: grantForm.managerUserId || undefined,
        expiresAt: grantForm.expiresAt
          ? new Date(grantForm.expiresAt).toISOString()
          : undefined,
      }),
    onSuccess: async () => {
      setGrantOpen(false);
      setGrantForm(emptyGrantForm());
      toast.push({ title: "Membership granted", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const update = useMutation({
    mutationFn: () => {
      if (!editMember || !editForm) throw new Error("No membership selected");
      return api.memberships.patch(editMember.id, {
        roles: editForm.roles,
        permissions: editForm.permissions,
        resourceScopes: editForm.resourceScopes,
        status: editForm.status,
        department: editForm.department || null,
        position: editForm.position || null,
        managerUserId: editForm.managerUserId || null,
        expiresAt: editForm.expiresAt
          ? new Date(editForm.expiresAt).toISOString()
          : null,
      });
    },
    onSuccess: async () => {
      setEditMember(null);
      setEditForm(null);
      toast.push({ title: "Membership updated", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const setStatus = useMutation({
    mutationFn: ({
      membershipId,
      status,
      roles,
      permissions,
    }: {
      membershipId: string;
      status: string;
      roles: string[];
      permissions: string[];
    }) =>
      api.memberships.patch(membershipId, {
        roles,
        permissions,
        status,
      }),
    onSuccess: async () => {
      toast.push({ title: "Status updated", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const revoke = useMutation({
    mutationFn: (membershipId: string) => api.memberships.revoke(membershipId),
    onSuccess: async () => {
      setRevokeId(null);
      toast.push({ title: "Membership revoked", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const invite = useMutation({
    mutationFn: () =>
      api.invitations.create({
        organizationId,
        email: inviteEmail.trim(),
        roles: inviteRoles,
        expiresInHours: Number(inviteExpiresHours) || 72,
      }),
    onSuccess: async () => {
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRoles(["viewer"]);
      toast.push({ title: "Invitation sent", tone: "success" });
      await invalidate();
      setSubTab("invitations");
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const revokeInvite = useMutation({
    mutationFn: (invitationId: string) => api.invitations.revoke(invitationId),
    onSuccess: async () => {
      toast.push({ title: "Invitation revoked", tone: "success" });
      await invalidate();
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const openEdit = (m: Membership) => {
    setEditMember(m);
    setEditForm({
      userId: m.userId,
      roles: [...(m.roles ?? [])],
      permissions: [...(m.permissions ?? [])],
      resourceScopes: [...(m.resourceScopes ?? [])],
      status: String(m.status ?? "ACTIVE"),
      department: String(m.department ?? ""),
      position: String(m.position ?? ""),
      managerUserId: String(m.managerUserId ?? ""),
      expiresAt: m.expiresAt
        ? new Date(String(m.expiresAt)).toISOString().slice(0, 16)
        : "",
    });
  };

  const memberColumns = useMemo<DataTableColumn<Membership>[]>(
    () => [
      {
        id: "user",
        header: "Member",
        cell: (row) => {
          const user = usersByIdentity.get(row.userId);
          return (
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)]">
                {userLabel(user, row.userId)}
              </p>
              <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                {row.userId}
              </p>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge tone={statusTone(String(row.status ?? ""))}>
            {String(row.status ?? "—")}
          </Badge>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        cell: (row) => (
          <div className="flex max-w-[14rem] flex-wrap gap-1">
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
        header: "Employment",
        cell: (row) => (
          <div className="text-sm">
            <p>{String(row.position || "—")}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {String(row.department || "No department")}
            </p>
          </div>
        ),
      },
      {
        id: "manager",
        header: "Manager",
        cell: (row) => {
          const mgr = row.managerUserId
            ? usersByIdentity.get(String(row.managerUserId))
            : undefined;
          return row.managerUserId
            ? userLabel(mgr, String(row.managerUserId))
            : "—";
        },
      },
      {
        id: "dates",
        header: "Joined / Expires",
        cell: (row) => (
          <div className="text-xs text-[var(--text-secondary)]">
            <p>
              {row.joinedAt
                ? new Date(String(row.joinedAt)).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-[var(--text-muted)]">
              {row.expiresAt
                ? `exp ${new Date(String(row.expiresAt)).toLocaleDateString()}`
                : "no expiry"}
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
              label: "Modifier",
              onClick: () => openEdit(row),
              icon: <Pencil className="size-[var(--icon-sm)]" aria-hidden />,
            });
            if (row.status === "ACTIVE") {
              items.push({
                id: "suspend",
                label: "Suspendre",
                onClick: () =>
                  setStatus.mutate({
                    membershipId: row.id,
                    status: "SUSPENDED",
                    roles: row.roles ?? [],
                    permissions: row.permissions ?? [],
                  }),
                disabled: setStatus.isPending,
                icon: <Ban className="size-[var(--icon-sm)]" aria-hidden />,
              });
            }
            if (row.status === "SUSPENDED" || row.status === "INVITED") {
              items.push({
                id: "activate",
                label: "Activer",
                onClick: () =>
                  setStatus.mutate({
                    membershipId: row.id,
                    status: "ACTIVE",
                    roles: row.roles ?? [],
                    permissions: row.permissions ?? [],
                  }),
                disabled: setStatus.isPending,
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
      setStatus,
      usersByIdentity,
    ],
  );

  const invitationColumns = useMemo<DataTableColumn<Invitation>[]>(
    () => [
      {
        id: "email",
        header: "Email",
        cell: (row) => row.email,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <Badge>{row.status}</Badge>,
      },
      {
        id: "roles",
        header: "Roles",
        cell: (row) => (row.roles ?? []).join(", ") || "—",
      },
      {
        id: "expires",
        header: "Expires",
        cell: (row) =>
          row.expiresAt
            ? new Date(row.expiresAt).toLocaleString()
            : "—",
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        hideable: false,
        cell: (row) =>
          row.status === "PENDING" ? (
            <RowActions
              onDelete={() => revokeInvite.mutate(row.id)}
              deleteLabel="Révoquer"
              deleteDisabled={revokeInvite.isPending}
            />
          ) : null,
      },
    ],
    [revokeInvite],
  );

  if (membersQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (membersQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load members"
        description={
          membersQuery.error instanceof Error
            ? membersQuery.error.message
            : "Try again shortly."
        }
        onRetry={() => void membersQuery.refetch()}
      />
    );
  }

  return (
    <SettingsPanel maxWidth="full">
      <SectionTitle
        title="Organization members"
        description="Grant access, manage employment context, roles, and invitations for this site."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Invited", value: stats.invited },
          { label: "Suspended", value: stats.suspended },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)]/40 px-3 py-2.5"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {s.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs tabs={MEMBER_TABS} value={subTab} onChange={setSubTab} />

      {subTab === "members" ? (
        <div className="mt-4 space-y-3">
          {members.length === 0 && !search && statusFilter === "ALL" ? (
            <EmptyState
              title="No members"
              description="Grant an existing user access or send an email invitation."
              actionLabel="Grant membership"
              onAction={() => setGrantOpen(true)}
            />
          ) : (
            <DataTable
              fill={false}
              columns={memberColumns}
              rows={members}
              resourceKey={`org-members-${organizationId}`}
              localSearch={false}
              search={{
                value: search,
                onChange: setSearch,
                placeholder: "Rechercher un membre, rôle, service…",
              }}
              onRefresh={() => void membersQuery.refetch()}
              refreshing={membersQuery.isFetching}
              onRowClick={(row) => openEdit(row)}
              pagination={{
                page: memberPage,
                pageSize: memberPageSize,
                total: memberPagination?.total,
                hasMore: memberPagination?.hasNext,
                onPageChange: setMemberPage,
                onPageSizeChange: (size) => {
                  setMemberPageSize(size);
                  setMemberPage(1);
                },
                pageSizeOptions: [...PAGE_SIZE_OPTIONS],
              }}
              empty={
                <EmptyState
                  title="Aucun membre"
                  description="Aucun résultat pour ce filtre. Modifiez la recherche ou accordez un accès."
                  actionLabel="Accorder un accès"
                  onAction={() => {
                    setGrantForm(emptyGrantForm());
                    setGrantOpen(true);
                  }}
                />
              }
              toolbar={
                <>
                  <Select
                    className="max-w-[10rem]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filtrer par statut"
                  >
                    <option value="ALL">Tous les statuts</option>
                    {MEMBER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <PermissionGate permission="users:invite">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInviteOpen(true)}
                      >
                        Inviter par e-mail
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="memberships:create">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setGrantForm(emptyGrantForm());
                          setGrantOpen(true);
                        }}
                      >
                        Accorder un accès
                      </Button>
                    </PermissionGate>
                  </div>
                </>
              }
            />
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {invitationsQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <DataTable
              fill={false}
              columns={invitationColumns}
              rows={invitationsQuery.data?.data ?? []}
              localSearch={false}
              search={{
                value: inviteSearch,
                onChange: setInviteSearch,
                placeholder: "Rechercher une invitation…",
              }}
              onRefresh={() => void invitationsQuery.refetch()}
              refreshing={invitationsQuery.isFetching}
              addAction={
                hasPermission(perms, "users:invite")
                  ? {
                      label: "Inviter par e-mail",
                      onClick: () => setInviteOpen(true),
                    }
                  : undefined
              }
              pagination={{
                page: invitePage,
                pageSize: invitePageSize,
                total: invitePagination?.total,
                hasMore: invitePagination?.hasNext,
                onPageChange: setInvitePage,
                onPageSizeChange: (size) => {
                  setInvitePageSize(size);
                  setInvitePage(1);
                },
                pageSizeOptions: [...PAGE_SIZE_OPTIONS],
              }}
              empty={
                <EmptyState
                  title="Aucune invitation"
                  description="Invitez quelqu’un qui n’a pas encore de compte."
                  actionLabel="Inviter par e-mail"
                  onAction={() => setInviteOpen(true)}
                />
              }
            />
          )}
        </div>
      )}

      <Dialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        title="Grant membership"
        description="Add an existing tenant user to this organization."
        footer={
          <>
            <Button variant="ghost" onClick={() => setGrantOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!grantForm.userId || grantForm.roles.length === 0 || grant.isPending}
              onClick={() => grant.mutate()}
            >
              {grant.isPending ? "Granting…" : "Grant"}
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
          <Field label="User">
            <SearchableSelect
              value={grantForm.userId}
              options={userOptions}
              placeholder="Search users…"
              onChange={(v) => setGrantForm((f) => ({ ...f, userId: v }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={grantForm.status}
              onChange={(e) =>
                setGrantForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              {MEMBER_STATUSES.filter((s) => s !== "REMOVED" && s !== "EXPIRED").map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Field label="Roles" hint="Organization and tenant roles available to assign.">
            <RoleMultiSelect
              roles={roles}
              selected={grantForm.roles}
              onChange={(rolesNext) =>
                setGrantForm((f) => ({ ...f, roles: rolesNext }))
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Department">
              <Input
                value={grantForm.department}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, department: e.target.value }))
                }
              />
            </Field>
            <Field label="Position">
              <Input
                value={grantForm.position}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, position: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Manager">
            <SearchableSelect
              value={grantForm.managerUserId}
              options={managerOptions}
              placeholder="Search manager…"
              onChange={(v) =>
                setGrantForm((f) => ({ ...f, managerUserId: v }))
              }
            />
          </Field>
          <Field label="Expires at" hint="Optional end of access.">
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
            hint="Permissions catalogue hors rôles (optionnel)."
          >
            {catalogQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
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
          <ResourceScopeEditor
            value={grantForm.resourceScopes}
            onChange={(resourceScopes) =>
              setGrantForm((f) => ({ ...f, resourceScopes }))
            }
            permissions={permissionCatalog}
            organizationOptions={[
              { value: organizationId, label: "Cette organisation" },
            ]}
            resourceOptionsByType={resourceOptionsByType}
          />
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
        title="Edit membership"
        description={
          editMember
            ? userLabel(usersByIdentity.get(editMember.userId), editMember.userId)
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
              Cancel
            </Button>
            <Button
              disabled={!editForm || editForm.roles.length === 0 || update.isPending}
              onClick={() => update.mutate()}
            >
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        {editForm ? (
          <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
            <Field label="Status">
              <Select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, status: e.target.value } : f))
                }
              >
                {MEMBER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Roles">
              <RoleMultiSelect
                roles={roles}
                selected={editForm.roles}
                onChange={(rolesNext) =>
                  setEditForm((f) => (f ? { ...f, roles: rolesNext } : f))
                }
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Department">
                <Input
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, department: e.target.value } : f,
                    )
                  }
                />
              </Field>
              <Field label="Position">
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
            <Field label="Manager">
              <SearchableSelect
                value={editForm.managerUserId}
                options={managerOptions}
                placeholder="Search manager…"
                onChange={(v) =>
                  setEditForm((f) => (f ? { ...f, managerUserId: v } : f))
                }
              />
            </Field>
            <Field label="Expires at">
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
            <Field
              label="Permissions directes"
              hint="Permissions catalogue hors rôles (optionnel)."
            >
              {catalogQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
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
            <ResourceScopeEditor
              value={editForm.resourceScopes}
              onChange={(resourceScopes) =>
                setEditForm((f) => (f ? { ...f, resourceScopes } : f))
              }
              permissions={permissionCatalog}
              organizationOptions={[
                { value: organizationId, label: "Cette organisation" },
              ]}
              resourceOptionsByType={resourceOptionsByType}
            />
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite by email"
        description="Send an invitation for someone who is not yet a user."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!inviteEmail.trim() || invite.isPending}
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Email">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </Field>
          <Field label="Roles">
            <RoleMultiSelect
              roles={roles}
              selected={inviteRoles}
              onChange={setInviteRoles}
            />
          </Field>
          <Field label="Expires in (hours)">
            <Select
              value={inviteExpiresHours}
              onChange={(e) => setInviteExpiresHours(e.target.value)}
            >
              {["24", "48", "72", "168", "336"].map((h) => (
                <option key={h} value={h}>
                  {h} hours
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(revokeId)}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        title="Revoke membership?"
        description="The user will lose access to this organization."
        confirmLabel="Revoke"
        tone="danger"
        loading={revoke.isPending}
        onConfirm={() => {
          if (revokeId) revoke.mutate(revokeId);
        }}
      />
    </SettingsPanel>
  );
}
