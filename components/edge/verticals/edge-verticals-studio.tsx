"use client";

/**
 * Verticals studio — list, create, detail lifecycle, config, memberships, products.
 * Wired to Edge control-plane APIs only (no invented state).
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
import { BackLink } from "@/components/ui/back-link";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { EdgeVertical } from "@/types/edge";

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function verticalLabel(v: EdgeVertical) {
  return v.displayName ?? v.name ?? v.code ?? v.id;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

const LIST_TABS = [
  { id: "registry", label: "Registry" },
  { id: "create", label: "Create" },
];

export function EdgeVerticalsListStudio() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:verticals:read");
  const canCreate =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:verticals:create");
  const [tab, setTab] = useState("registry");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreate) {
      setTab("create");
    }
  }, [searchParams, canCreate]);

  const query = useQuery({
    queryKey: ["edge", "verticals", "studio", search, status],
    enabled: allowed,
    queryFn: async () => {
      const qs = new URLSearchParams({ page: "1", limit: "100" });
      if (search.trim()) qs.set("search", search.trim());
      if (status) qs.set("status", status);
      const { data } = await edgeApi.listVerticals(qs.toString());
      return data ?? [];
    },
  });

  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () =>
      edgeApi.createVertical({
        code: code.trim().toUpperCase(),
        slug: slug.trim() || slugify(displayName || code),
        displayName: displayName.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async (res) => {
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["edge", "verticals"] });
      if (res.data?.id) router.push(`/edge/verticals/${res.data.id}`);
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:verticals:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <div className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            Verticals studio
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            Create, activate, and administer industry workspaces. Product
            bindings and Business Backend control live under Catalog and Product
            Control.
          </p>
        </div>
        <div className="flex flex-wrap gap-[var(--space-2)]">
          <Button asChild variant="outline">
            <Link href="/edge/catalog">Catalog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/edge/backends">Backends (BB)</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/edge/provisioning/product-controls">
              Product Control
            </Link>
          </Button>
        </div>
      </header>

      <Tabs
        tabs={canCreate ? LIST_TABS : LIST_TABS.filter((t) => t.id !== "create")}
        value={tab}
        onChange={setTab}
      />

      {tab === "registry" ? (
        <section className="space-y-[var(--space-4)]">
          <div className="flex flex-wrap gap-[var(--space-3)]">
            <input
              className={`${fieldControlClass} max-w-xs`}
              placeholder="Search code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={`${fieldControlClass} max-w-[14rem]`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {[
                "DRAFT",
                "CONFIGURING",
                "READY_FOR_ACTIVATION",
                "ACTIVE",
                "SUSPENDED",
                "DEACTIVATED",
                "DEPRECATED",
                "RETIRED",
                "ARCHIVED",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              Refresh
            </Button>
          </div>

          {query.isLoading ? <EdgeLoadingState /> : null}
          {query.isError ? (
            <EdgeErrorState
              description={errMessage(query.error)}
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {query.isSuccess && !query.data.length ? (
            <EdgeEmptyState
              title="No verticals"
              description="Create a vertical to start administering industry workspaces."
              actionLabel={canCreate ? "Create vertical" : undefined}
              onAction={canCreate ? () => setTab("create") : undefined}
            />
          ) : null}
          {query.isSuccess && query.data.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
              {query.data.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/edge/verticals/${v.id}`}
                    className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--surface-muted)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[var(--text-primary)]">
                        {verticalLabel(v)}
                      </span>
                      <span className="type-xs text-[var(--text-muted)]">
                        {[v.code, v.slug].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <Badge>{v.status ?? "—"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tab === "create" && canCreate ? (
        <form
          className="max-w-xl space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!code.trim() || !displayName.trim()) {
              setFormError("Code and display name are required.");
              return;
            }
            createMutation.mutate();
          }}
        >
          <h2 className="type-md font-semibold text-[var(--text-primary)]">
            Create vertical
          </h2>
          <label className="block space-y-1">
            <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Code
            </span>
            <input
              className={fieldControlClass}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="PHARMACY"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Display name
            </span>
            <input
              className={fieldControlClass}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (!slug || slug === slugify(code)) {
                  setSlug(slugify(e.target.value));
                }
              }}
              placeholder="Pharmacy"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Slug
            </span>
            <input
              className={fieldControlClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="pharmacy"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Description
            </span>
            <textarea
              className={fieldControlClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {formError ? (
            <p className="type-sm text-[var(--danger)]" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create vertical"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "products", label: "Products" },
  { id: "memberships", label: "Memberships" },
  { id: "configuration", label: "Configuration" },
  { id: "history", label: "History" },
];

export function EdgeVerticalDetailStudio({ verticalId }: { verticalId: string }) {
  const { permissions, switchWorkspace, activeVerticalId } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:verticals:read");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");

  const verticalQuery = useQuery({
    queryKey: ["edge", "verticals", verticalId],
    enabled: allowed && Boolean(verticalId),
    queryFn: async () => {
      const { data } = await edgeApi.getVertical(verticalId);
      return data;
    },
  });

  useEffect(() => {
    if (!verticalQuery.data) return;
    setDisplayName(
      verticalQuery.data.displayName ?? verticalQuery.data.name ?? "",
    );
    setDescription(verticalQuery.data.description ?? "");
  }, [verticalQuery.data]);

  const readinessQuery = useQuery({
    queryKey: ["edge", "verticals", verticalId, "readiness"],
    enabled: allowed && Boolean(verticalId) && tab === "lifecycle",
    queryFn: async () => {
      const { data } = await edgeApi.getVerticalReadiness(verticalId);
      return data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "by-vertical", verticalId],
    enabled: allowed && tab === "products",
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({
        verticalId,
        limit: 100,
      });
      return data ?? [];
    },
  });

  const membershipsQuery = useQuery({
    queryKey: ["edge", "verticals", verticalId, "memberships"],
    enabled:
      allowed &&
      tab === "memberships" &&
      (!permissionKnown ||
        hasEdgePermission(permissions, "membership:read")),
    queryFn: async () => {
      const { data } = await edgeApi.listVerticalMemberships(verticalId);
      return data ?? [];
    },
  });

  const adminsQuery = useQuery({
    queryKey: ["edge", "administrators", "invite"],
    enabled:
      tab === "memberships" &&
      (!permissionKnown ||
        hasEdgePermission(permissions, "membership:invite")),
    queryFn: async () => {
      const { data } = await edgeApi.listAdministrators("page=1&limit=100");
      return data ?? [];
    },
  });

  const configQuery = useQuery({
    queryKey: ["edge", "verticals", verticalId, "configuration"],
    enabled:
      allowed &&
      tab === "configuration" &&
      activeVerticalId === verticalId &&
      (!permissionKnown ||
        hasEdgePermission(permissions, "workspace:configuration:read")),
    queryFn: async () => {
      const { data } = await edgeApi.getWorkspaceConfiguration(verticalId);
      return data;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "verticals", verticalId, "lifecycle-events"],
    enabled: allowed && tab === "history",
    queryFn: async () => {
      const { data } = await edgeApi.listVerticalLifecycleEvents(verticalId);
      return data ?? [];
    },
  });

  const [inviteAdminId, setInviteAdminId] = useState("");
  const [configJson, setConfigJson] = useState("{}");

  useEffect(() => {
    if (!configQuery.data) return;
    try {
      const draft =
        (configQuery.data as { draft?: unknown; config?: unknown })?.draft ??
        (configQuery.data as { config?: unknown })?.config ??
        configQuery.data;
      setConfigJson(JSON.stringify(draft ?? {}, null, 2));
    } catch {
      setConfigJson("{}");
    }
  }, [configQuery.data]);

  async function invalidateVertical() {
    await queryClient.invalidateQueries({
      queryKey: ["edge", "verticals", verticalId],
    });
    await queryClient.invalidateQueries({ queryKey: ["edge", "verticals"] });
    await queryClient.invalidateQueries({ queryKey: ["edge", "bootstrap"] });
  }

  const runLifecycle = useMutation({
    mutationFn: async (
      action:
        | "activate"
        | "suspend"
        | "reinstate"
        | "deactivate"
        | "deprecate"
        | "retire"
        | "archive",
    ) => {
      switch (action) {
        case "activate":
          return edgeApi.activateVertical(verticalId);
        case "suspend":
          return edgeApi.suspendVertical(verticalId, reason || undefined);
        case "reinstate":
          return edgeApi.reinstateVertical(verticalId);
        case "deactivate":
          return edgeApi.deactivateVertical(verticalId, reason || undefined);
        case "deprecate":
          return edgeApi.deprecateVertical(verticalId, reason || undefined);
        case "retire":
          return edgeApi.retireVertical(verticalId, reason || undefined);
        case "archive":
          return edgeApi.archiveVertical(verticalId, reason || undefined);
      }
    },
    onSuccess: async (_res, action) => {
      setActionErr(null);
      setActionMsg(`Lifecycle action « ${action} » applied.`);
      await invalidateVertical();
      await queryClient.invalidateQueries({
        queryKey: ["edge", "verticals", verticalId, "lifecycle-events"],
      });
    },
    onError: (err) => {
      setActionMsg(null);
      setActionErr(errMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      edgeApi.updateVertical(verticalId, {
        displayName: displayName.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async () => {
      setActionErr(null);
      setActionMsg("Vertical updated.");
      await invalidateVertical();
    },
    onError: (err) => {
      setActionMsg(null);
      setActionErr(errMessage(err));
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () =>
      edgeApi.inviteVerticalMembership(verticalId, {
        administratorId: inviteAdminId,
      }),
    onSuccess: async () => {
      setInviteAdminId("");
      setActionErr(null);
      setActionMsg("Membership invitation created.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "verticals", verticalId, "memberships"],
      });
    },
    onError: (err) => {
      setActionMsg(null);
      setActionErr(errMessage(err));
    },
  });

  const membershipActionMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      action: "activate" | "suspend" | "reinstate" | "revoke";
    }) => {
      if (input.action === "activate")
        return edgeApi.activateMembership(input.id);
      if (input.action === "suspend")
        return edgeApi.suspendMembership(input.id, "studio");
      if (input.action === "reinstate")
        return edgeApi.reinstateMembership(input.id);
      return edgeApi.revokeMembership(input.id, "studio");
    },
    onSuccess: async (_res, vars) => {
      setActionErr(null);
      setActionMsg(`Membership ${vars.action} succeeded.`);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "verticals", verticalId, "memberships"],
      });
    },
    onError: (err) => {
      setActionMsg(null);
      setActionErr(errMessage(err));
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(configJson) as Record<string, unknown>;
      return edgeApi.updateWorkspaceConfigurationDraft(verticalId, {
        config: parsed,
        changeReason: "studio-edit",
      });
    },
    onSuccess: async () => {
      setActionErr(null);
      setActionMsg("Configuration draft saved.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "verticals", verticalId, "configuration"],
      });
    },
    onError: (err) => {
      setActionMsg(null);
      setActionErr(errMessage(err));
    },
  });

  const status = verticalQuery.data?.status;
  const lifecycleActions = useMemo(() => {
    const items: Array<{
      id:
        | "activate"
        | "suspend"
        | "reinstate"
        | "deactivate"
        | "deprecate"
        | "retire"
        | "archive";
      label: string;
      permission: string;
      needsReason?: boolean;
    }> = [];
    if (
      status === "DRAFT" ||
      status === "CONFIGURING" ||
      status === "READY_FOR_ACTIVATION"
    ) {
      items.push({
        id: "activate",
        label: "Activate",
        permission: "platform:verticals:activate",
      });
    }
    if (status === "ACTIVE") {
      items.push({
        id: "suspend",
        label: "Suspend",
        permission: "platform:verticals:suspend",
        needsReason: true,
      });
      items.push({
        id: "deactivate",
        label: "Deactivate",
        permission: "platform:verticals:suspend",
        needsReason: true,
      });
      items.push({
        id: "deprecate",
        label: "Deprecate",
        permission: "platform:verticals:suspend",
        needsReason: true,
      });
    }
    if (status === "SUSPENDED") {
      items.push({
        id: "reinstate",
        label: "Reinstate",
        permission: "platform:verticals:activate",
      });
    }
    if (status === "DEPRECATED" || status === "DEACTIVATED") {
      items.push({
        id: "retire",
        label: "Retire",
        permission: "platform:verticals:suspend",
        needsReason: true,
      });
    }
    if (status === "RETIRED") {
      items.push({
        id: "archive",
        label: "Archive",
        permission: "platform:verticals:suspend",
        needsReason: true,
      });
    }
    return items;
  }, [status]);

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:verticals:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href="/edge/verticals" />
      {verticalQuery.isLoading ? <EdgeLoadingState /> : null}
      {verticalQuery.isError ? (
        <EdgeErrorState
          description={errMessage(verticalQuery.error)}
          onRetry={() => void verticalQuery.refetch()}
        />
      ) : null}
      {verticalQuery.data ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
            <div className="space-y-[var(--space-1)]">
              <h1 className="type-xl font-semibold text-[var(--text-primary)]">
                {verticalLabel(verticalQuery.data)}
              </h1>
              <p className="type-sm text-[var(--text-secondary)]">
                {[verticalQuery.data.code, verticalQuery.data.slug]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Badge>{verticalQuery.data.status ?? "—"}</Badge>
            </div>
            <div className="flex flex-wrap gap-[var(--space-2)]">
              <Button
                variant="outline"
                onClick={() => void switchWorkspace(verticalId)}
              >
                {activeVerticalId === verticalId
                  ? "Workspace active"
                  : "Enter workspace"}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/edge/verticals/${verticalId}/products`}>
                  Products
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/edge/provisioning/product-controls">
                  BB · Product Control
                </Link>
              </Button>
            </div>
          </header>

          {actionErr ? (
            <p className="type-sm text-[var(--danger)]" role="alert">
              {actionErr}
            </p>
          ) : null}
          {actionMsg ? (
            <p className="type-sm text-[var(--success)]">{actionMsg}</p>
          ) : null}

          <Tabs tabs={DETAIL_TABS} value={tab} onChange={setTab} />

          {tab === "overview" ? (
            <section className="space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <EdgePermissionGate permission="platform:verticals:update">
                <form
                  className="space-y-[var(--space-3)]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate();
                  }}
                >
                  <h2 className="type-md font-semibold">Edit profile</h2>
                  <label className="block space-y-1">
                    <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Display name
                    </span>
                    <input
                      className={fieldControlClass}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Description
                    </span>
                    <textarea
                      className={fieldControlClass}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </form>
              </EdgePermissionGate>
              {!hasEdgePermission(permissions, "platform:verticals:update") &&
              permissionKnown ? (
                <p className="type-sm text-[var(--text-secondary)]">
                  {verticalQuery.data.description || "No description."}
                </p>
              ) : null}
            </section>
          ) : null}

          {tab === "lifecycle" ? (
            <section className="space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <h2 className="type-md font-semibold">Lifecycle</h2>
              <p className="type-sm text-[var(--text-secondary)]">
                Current status:{" "}
                <strong>{verticalQuery.data.status ?? "—"}</strong>
              </p>
              {readinessQuery.isLoading ? <EdgeLoadingState label="Checking readiness…" /> : null}
              {readinessQuery.data ? (
                <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-[var(--space-3)] type-xs">
                  {JSON.stringify(readinessQuery.data, null, 2)}
                </pre>
              ) : null}
              <label className="block max-w-md space-y-1">
                <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Reason (for suspend / deactivate / …)
                </span>
                <input
                  className={fieldControlClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional operator reason"
                />
              </label>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {lifecycleActions.map((a) => (
                  <EdgePermissionGate key={a.id} permission={a.permission}>
                    <Button
                      variant={a.id === "activate" ? "default" : "outline"}
                      disabled={runLifecycle.isPending}
                      onClick={() => runLifecycle.mutate(a.id)}
                    >
                      {a.label}
                    </Button>
                  </EdgePermissionGate>
                ))}
                {!lifecycleActions.length ? (
                  <p className="type-sm text-[var(--text-muted)]">
                    No lifecycle transitions available for this status.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === "products" ? (
            <section className="space-y-[var(--space-4)]">
              <div className="flex flex-wrap gap-[var(--space-2)]">
                <Button asChild>
                  <Link href={`/edge/catalog/new?verticalId=${verticalId}`}>
                    New product
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/edge/catalog">Open catalog</Link>
                </Button>
              </div>
              {productsQuery.isLoading ? <EdgeLoadingState /> : null}
              {productsQuery.isError ? (
                <EdgeErrorState
                  description={errMessage(productsQuery.error)}
                  onRetry={() => void productsQuery.refetch()}
                />
              ) : null}
              {productsQuery.isSuccess && !productsQuery.data.length ? (
                <EdgeEmptyState
                  title="No products"
                  description="Create a product in the catalog bound to this vertical."
                />
              ) : null}
              {productsQuery.data?.length ? (
                <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                  {productsQuery.data.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/edge/catalog/${p.id}`}
                        className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--surface-muted)]"
                      >
                        <span>
                          <span className="block font-medium">{p.name}</span>
                          <span className="type-xs text-[var(--text-muted)]">
                            {p.code}
                          </span>
                        </span>
                        <Badge>{p.lifecycleStatus}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {tab === "memberships" ? (
            <section className="space-y-[var(--space-4)]">
              {membershipsQuery.isLoading ? <EdgeLoadingState /> : null}
              {membershipsQuery.isError ? (
                <EdgeErrorState
                  description={errMessage(membershipsQuery.error)}
                  onRetry={() => void membershipsQuery.refetch()}
                />
              ) : null}
              {membershipsQuery.data?.length ? (
                <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                  {membershipsQuery.data.map((m) => {
                    const status = (m.status ?? "").toUpperCase();
                    return (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
                      >
                        <span className="min-w-0">
                          <span className="block type-sm font-medium">
                            {m.administratorId ?? m.id}
                          </span>
                          <span className="type-xs font-mono text-[var(--text-muted)]">
                            {m.id}
                          </span>
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{m.status ?? "—"}</Badge>
                          {status === "INVITED" || status === "PENDING" ? (
                            <EdgePermissionGate permission="membership:activate">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={membershipActionMutation.isPending}
                                onClick={() =>
                                  membershipActionMutation.mutate({
                                    id: m.id,
                                    action: "activate",
                                  })
                                }
                              >
                                Activate
                              </Button>
                            </EdgePermissionGate>
                          ) : null}
                          {status === "ACTIVE" ? (
                            <EdgePermissionGate permission="membership:suspend">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={membershipActionMutation.isPending}
                                onClick={() =>
                                  membershipActionMutation.mutate({
                                    id: m.id,
                                    action: "suspend",
                                  })
                                }
                              >
                                Suspend
                              </Button>
                            </EdgePermissionGate>
                          ) : null}
                          {status === "SUSPENDED" ? (
                            <EdgePermissionGate permission="membership:reinstate">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={membershipActionMutation.isPending}
                                onClick={() =>
                                  membershipActionMutation.mutate({
                                    id: m.id,
                                    action: "reinstate",
                                  })
                                }
                              >
                                Reinstate
                              </Button>
                            </EdgePermissionGate>
                          ) : null}
                          {status !== "REVOKED" ? (
                            <EdgePermissionGate permission="membership:revoke">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={membershipActionMutation.isPending}
                                onClick={() =>
                                  membershipActionMutation.mutate({
                                    id: m.id,
                                    action: "revoke",
                                  })
                                }
                              >
                                Revoke
                              </Button>
                            </EdgePermissionGate>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : membershipsQuery.isSuccess ? (
                <EdgeEmptyState
                  title="No memberships"
                  description="Invite an Edge administrator to this vertical."
                />
              ) : null}

              <EdgePermissionGate permission="membership:invite">
                <form
                  className="flex flex-wrap items-end gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inviteAdminId) return;
                    inviteMutation.mutate();
                  }}
                >
                  <label className="min-w-[16rem] flex-1 space-y-1">
                    <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Administrator
                    </span>
                    <select
                      className={fieldControlClass}
                      value={inviteAdminId}
                      onChange={(e) => setInviteAdminId(e.target.value)}
                      required
                    >
                      <option value="">Select…</option>
                      {(adminsQuery.data ?? []).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.displayName ?? a.email ?? a.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Inviting…" : "Invite"}
                  </Button>
                </form>
              </EdgePermissionGate>
            </section>
          ) : null}

          {tab === "configuration" ? (
            <section className="space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              {activeVerticalId !== verticalId ? (
                <EdgeEmptyState
                  title="Workspace required"
                  description="Enter this vertical workspace to read or edit configuration drafts."
                  actionLabel="Enter workspace"
                  onAction={() => void switchWorkspace(verticalId)}
                />
              ) : (
                <>
                  <p className="type-sm text-[var(--text-secondary)]">
                    Edit the JSON draft, validate, then activate. Requires an
                    active workspace session on this vertical.
                  </p>
                  {configQuery.isLoading ? <EdgeLoadingState /> : null}
                  {configQuery.isError ? (
                    <EdgeErrorState
                      description={errMessage(configQuery.error)}
                      onRetry={() => void configQuery.refetch()}
                    />
                  ) : null}
                  <textarea
                    className={`${fieldControlClass} min-h-[16rem] font-mono type-xs`}
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="flex flex-wrap gap-[var(--space-2)]">
                    <EdgePermissionGate permission="workspace:configuration:update">
                      <Button
                        disabled={saveDraftMutation.isPending}
                        onClick={() => saveDraftMutation.mutate()}
                      >
                        Save draft
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void edgeApi
                            .validateWorkspaceConfiguration(verticalId)
                            .then(() => setActionMsg("Configuration validated."))
                            .catch((err) => setActionErr(errMessage(err)))
                        }
                      >
                        Validate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void edgeApi
                            .activateWorkspaceConfiguration(verticalId)
                            .then(async () => {
                              setActionMsg("Configuration activated.");
                              await configQuery.refetch();
                            })
                            .catch((err) => setActionErr(errMessage(err)))
                        }
                      >
                        Activate
                      </Button>
                    </EdgePermissionGate>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {tab === "history" ? (
            <section className="space-y-[var(--space-3)]">
              {historyQuery.isLoading ? <EdgeLoadingState /> : null}
              {historyQuery.isError ? (
                <EdgeErrorState
                  description={errMessage(historyQuery.error)}
                  onRetry={() => void historyQuery.refetch()}
                />
              ) : null}
              {historyQuery.isSuccess && !historyQuery.data.length ? (
                <EdgeEmptyState
                  title="No lifecycle events"
                  description="Lifecycle transitions will appear here."
                />
              ) : null}
              {historyQuery.data?.length ? (
                <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                  {historyQuery.data.map((ev, idx) => {
                    const row = ev as Record<string, unknown>;
                    return (
                      <li
                        key={String(row.id ?? idx)}
                        className="px-[var(--space-4)] py-[var(--space-3)] type-sm"
                      >
                        <p className="font-medium text-[var(--text-primary)]">
                          {String(row.eventType ?? row.toStatus ?? row.action ?? "event")}
                        </p>
                        <p className="type-xs text-[var(--text-muted)]">
                          {String(row.createdAt ?? row.at ?? "")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
