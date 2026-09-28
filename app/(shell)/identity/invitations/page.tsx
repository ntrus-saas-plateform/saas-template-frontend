"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { RoleMultiSelect } from "@/components/identity/role-multi-select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi, type Invitation } from "@/lib/api/identity";
import { formatDateTime } from "@/lib/format/datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function invitationEmailStatus(delivery: {
  sent: boolean;
  provider?: string;
  error?: string | null;
} | null) {
  if (!delivery) return null;
  if (delivery.sent) {
    const via =
      delivery.provider === "resend"
        ? "Resend"
        : delivery.provider === "smtp"
          ? "SMTP"
          : delivery.provider;
    return `Invitation email sent via ${via}.`;
  }
  if (!delivery.provider || delivery.provider === "none") {
    return "Email delivery is not configured. Copy the token or accept link and send it yourself.";
  }
  return delivery.error
    ? `Email could not be sent: ${delivery.error}. Copy the token instead.`
    : "Email could not be sent. Copy the token instead.";
}

function InvitationsPanel() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, organizations: platformOrgs } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState(
    context?.organizationId ?? "",
  );
  const [roles, setRoles] = useState<string[]>(["viewer"]);
  const [expiresInHours, setExpiresInHours] = useState("72");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<{
    sent: boolean;
    provider?: string;
    error?: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<"token" | "link" | null>(null);
  const [acceptToken, setAcceptToken] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, search]);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) setAcceptToken(tokenFromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!organizationId && context?.organizationId) {
      setOrganizationId(context.organizationId);
    }
  }, [context?.organizationId, organizationId]);

  const query = useQuery({
    queryKey: [...idk.invitations(), page, pageSize, search],
    queryFn: async () =>
      api.invitations.list(page, pageSize, undefined, {
        search: search || undefined,
      }),
  });

  const orgsQuery = useQuery({
    queryKey: [...idk.organizations(), "invite"],
    queryFn: async () =>
      api.organizations.list(1, 200, { scope: "tenant", tree: true }),
  });

  const rolesQuery = useQuery({
    queryKey: idk.roles(),
    queryFn: async () => api.roles.list(1, 100),
    enabled: createOpen,
  });

  const orgOptions = useMemo(() => {
    const fromApi = orgsQuery.data?.data ?? [];
    if (fromApi.length > 0) {
      return fromApi.map((org) => ({
        value: org.id,
        label: org.slug ? `${org.name} Â· ${org.slug}` : org.name,
      }));
    }
    return platformOrgs.map((org) => ({
      value: org.id,
      label: org.slug ? `${org.name} Â· ${org.slug}` : org.name,
    }));
  }, [orgsQuery.data?.data, platformOrgs]);

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of orgsQuery.data?.data ?? []) {
      map.set(org.id, org.name);
    }
    for (const org of platformOrgs) {
      if (!map.has(org.id)) map.set(org.id, org.name);
    }
    return map;
  }, [orgsQuery.data?.data, platformOrgs]);

  const resetCreateForm = () => {
    setCreatedToken(null);
    setEmailDelivery(null);
    setCopied(null);
    setEmail("");
    setRoles(["viewer"]);
    setExpiresInHours("72");
    setOrganizationId(context?.organizationId ?? "");
  };

  const create = useMutation({
    mutationFn: () =>
      api.invitations.create({
        organizationId,
        email: email.trim(),
        roles,
        expiresInHours: Number(expiresInHours) || 72,
      }),
    onSuccess: async (res) => {
      const token = res.data?.token ?? null;
      setCreatedToken(token);
      setEmailDelivery({
        sent: Boolean(res.data?.emailSent),
        provider:
          typeof res.data?.emailProvider === "string"
            ? res.data.emailProvider
            : undefined,
        error:
          typeof res.data?.emailError === "string" ? res.data.emailError : null,
      });
      if (token) setAcceptToken(token);
      await qc.invalidateQueries({ queryKey: idk.invitations() });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.invitations.revoke(id),
    onSuccess: async () => {
      setRevokeId(null);
      await qc.invalidateQueries({ queryKey: idk.invitations() });
    },
  });

  const accept = useMutation({
    mutationFn: () => api.invitations.accept(acceptToken.trim()),
    onSuccess: async () => {
      setAcceptToken("");
      await qc.invalidateQueries({ queryKey: idk.invitations() });
      await qc.invalidateQueries({ queryKey: ["identity", "memberships"] });
    },
  });

  const columns = useMemo<DataTableColumn<Invitation>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => orgNameById.get(row.organizationId) ?? "",
        cell: (row) => (
          <span className="font-medium">
            {orgNameById.get(row.organizationId) ?? "â€”"}
          </span>
        ),
      },
      {
        id: "label",
        header: "LibellÃ©",
        sortable: true,
        sortValue: (row) => row.email,
        cell: (row) => <span className="font-medium">{row.email}</span>,
      },
      {
        id: "description",
        header: "Description",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {(row.roles ?? []).join(", ") || "â€”"}
            {row.expiresAt ? ` Â· expire ${formatDateTime(row.expiresAt)}` : ""}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        sortable: true,
        sortValue: (row) => row.status,
        cell: (row) => <Badge>{row.status}</Badge>,
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) =>
          row.status === "PENDING" ? (
            <RowActions
              onDelete={() => setRevokeId(row.id)}
              deleteLabel="RÃ©voquer"
            />
          ) : null,
      },
    ],
    [orgNameById],
  );

  if (query.isLoading) return <Skeleton className="min-h-0 w-full flex-1" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load invitations"
        description={
          query.error instanceof Error
            ? query.error.message
            : "Try again shortly."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-hidden">
      <DataTable
        columns={columns}
        rows={query.data?.data ?? []}
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Rechercher des invitationsâ€¦",
        }}
        onRefresh={() => void query.refetch()}
        refreshing={query.isFetching}
        addAction={{
          label: "Ajouter",
          onClick: () => setCreateOpen(true),
        }}
        pagination={{
          page,
          pageSize,
          total: query.data?.pagination?.total,
          hasMore: query.data?.pagination?.hasNext,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        empty={
          <EmptyState
            title="No invitations"
            description="Invite someone by email to join an organization."
            actionLabel="Ajouter"
            onAction={() => setCreateOpen(true)}
          />
        }
      />

      <section className="max-w-lg shrink-0 space-y-3 rounded-md border border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold">Accept invitation</h2>
        <p className="type-sm text-[var(--text-muted)]">
          Paste the 64-character token shown once when the invite was created â€”
          not the organization id. Your signed-in email must match the invite.
        </p>
        <Field label="Token" htmlFor="token">
          <Input
            id="token"
            value={acceptToken}
            onChange={(e) => setAcceptToken(e.target.value)}
            placeholder="Paste invitation token"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Button
          type="button"
          disabled={!acceptToken.trim() || accept.isPending}
          onClick={() => accept.mutate()}
        >
          {accept.isPending ? "Acceptingâ€¦" : "Accept"}
        </Button>
        {accept.isError ? (
          <p className="text-sm text-[var(--danger)]">
            {accept.error instanceof Error
              ? accept.error.message
              : "Accept failed"}
          </p>
        ) : null}
        {accept.isSuccess ? (
          <p className="text-sm text-emerald-700">Invitation accepted.</p>
        ) : null}
      </section>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetCreateForm();
        }}
        title="Create invitation"
        description="Invite someone by email to join an organization."
        footer={
          createdToken ? (
            <Button type="button" onClick={() => setCreateOpen(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !isValidEmail(email) ||
                  !organizationId ||
                  roles.length === 0 ||
                  create.isPending
                }
                onClick={() => create.mutate()}
              >
                {create.isPending ? "Creatingâ€¦" : "Create"}
              </Button>
            </>
          )
        }
      >
        {createdToken ? (
          <div className="space-y-3">
            <p className="type-sm text-[var(--text-secondary)]">
              {invitationEmailStatus(emailDelivery)}
            </p>
            <p className="type-sm text-[var(--text-secondary)]">
              Copy this single-use token now â€” it will not be shown again.
            </p>
            <code className="block break-all rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-[var(--space-3)] type-xs text-[var(--text-primary)]">
              {createdToken}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(createdToken);
                  setCopied("token");
                }}
              >
                {copied === "token" ? "Copied" : "Copy token"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = `${window.location.origin}/invite?token=${encodeURIComponent(createdToken)}`;
                  await navigator.clipboard.writeText(url);
                  setCopied("link");
                }}
              >
                {copied === "link" ? "Copied" : "Copy accept link"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[var(--space-4)]">
            <Field
              label="Email"
              htmlFor="invite-email"
              required
              hint="The invitee must sign in with this address to accept."
            >
              <Input
                id="invite-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Organization" htmlFor="invite-org" required>
              <SearchableSelect
                id="invite-org"
                value={organizationId}
                options={orgOptions}
                placeholder="Search organizationâ€¦"
                onChange={setOrganizationId}
              />
            </Field>
            <Field
              label="Roles"
              hint="Select at least one role. Viewer is the default."
            >
              <RoleMultiSelect
                roles={rolesQuery.data?.data ?? []}
                selected={roles}
                onChange={setRoles}
              />
            </Field>
            <Field label="Expires in" htmlFor="invite-expiry">
              <Select
                id="invite-expiry"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
              >
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">7 days</option>
                <option value="336">14 days</option>
              </Select>
            </Field>
            {create.isError ? (
              <p className="type-sm text-[var(--danger)]">
                {create.error instanceof Error
                  ? create.error.message
                  : "Could not create invitation"}
              </p>
            ) : null}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(revokeId)}
        onOpenChange={(o) => {
          if (!o) setRevokeId(null);
        }}
        title="Revoke invitation?"
        description="The invitee will no longer be able to accept this token."
        confirmLabel="Revoke"
        tone="danger"
        loading={revoke.isPending}
        onConfirm={() => {
          if (revokeId) revoke.mutate(revokeId);
        }}
      />
    </div>
  );
}

export default function InvitationsPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Invitations"
        description="Invite users, revoke pending invites, or accept a token."
      />
      <PermissionGate
        permission="users:invite"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need users:invite to manage invitations."
          />
        }
      >
        <FillSection>
          <Suspense fallback={<Skeleton className="min-h-0 w-full flex-1" />}>
            <InvitationsPanel />
          </Suspense>
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
