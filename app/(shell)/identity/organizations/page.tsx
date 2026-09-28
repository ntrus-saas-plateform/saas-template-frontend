"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Landmark,
  Plus,
  Search,
  Store,
  Warehouse,
} from "lucide-react";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  identityApi,
  type IdentityOrganization,
} from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { hasPermission } from "@/lib/access/permissions";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { cn } from "@/lib/utils";

const ORG_TYPES = ["BRANCH", "STORE", "OFFICE", "WAREHOUSE", "OTHER"] as const;

const TYPE_LABEL: Record<string, string> = {
  BRANCH: "Branch",
  STORE: "Store",
  OFFICE: "Office",
  WAREHOUSE: "Warehouse",
  OTHER: "Other",
};

type TreeNode = IdentityOrganization & { children: TreeNode[]; depth: number };

function typeLabel(type?: string | null) {
  if (!type) return "Other";
  return (
    TYPE_LABEL[type] ??
    type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

function TypeIcon({ type, className }: { type?: string | null; className?: string }) {
  const cls = cn("size-3.5", className);
  switch (type) {
    case "STORE":
      return <Store className={cls} />;
    case "WAREHOUSE":
      return <Warehouse className={cls} />;
    case "BRANCH":
      return <GitBranch className={cls} />;
    case "OFFICE":
      return <Landmark className={cls} />;
    default:
      return <Building2 className={cls} />;
  }
}

function statusTone(
  status: string,
): "success" | "warning" | "danger" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "ARCHIVED") return "danger";
  return "default";
}

function locationLabel(org: IdentityOrganization): string {
  const parts = [org.city, org.province, org.country].filter(Boolean);
  return parts.join(", ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildTree(items: IdentityOrganization[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const item of items) {
    byId.set(item.id, { ...item, children: [], depth: 0 });
  }
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const assignDepth = (nodes: TreeNode[], depth: number) => {
    for (const n of nodes) {
      n.depth = depth;
      assignDepth(n.children, depth + 1);
    }
  };
  assignDepth(roots, 0);
  return roots;
}

function filterTree(
  nodes: TreeNode[],
  pred: (node: TreeNode) => boolean,
): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    const children = filterTree(node.children, pred);
    if (pred(node) || children.length > 0) {
      out.push({ ...node, children });
    }
  }
  return out;
}

function flattenVisible(nodes: TreeNode[], collapsed: Set<string>): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      out.push(node);
      if (node.children.length > 0 && !collapsed.has(node.id)) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return out;
}

function matchesQuery(org: IdentityOrganization, q: string) {
  if (!q) return true;
  const hay = [org.name, org.slug, org.code, org.city, org.type, org.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function OrganizationsList() {
  const router = useRouter();
  const client = useApiClient();
  const { context, capabilities } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const canCreate = hasPermission(perms, "organizations:create");
  const canUpdate = hasPermission(perms, "organizations:update");
  const canSuspend = hasPermission(perms, "organizations:suspend");
  const [open, setOpen] = useState(false);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "table">("table");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");

  const orgsQuery = useQuery({
    queryKey: [...idk.organizations(), "tenant-tree"],
    queryFn: async () =>
      api.organizations.list(1, 200, { scope: "tenant", tree: true }),
  });

  const items = orgsQuery.data?.data ?? [];
  const q = query.trim().toLowerCase();

  const tree = useMemo(() => {
    const rooted = buildTree(items);
    return filterTree(rooted, (node) => {
      if (typeFilter !== "ALL" && node.type !== typeFilter) return false;
      return matchesQuery(node, q);
    });
  }, [items, q, typeFilter]);

  const treeRows = useMemo(
    () => flattenVisible(tree, q ? new Set() : collapsed),
    [tree, collapsed, q],
  );

  const filteredFlat = useMemo(
    () =>
      items.filter((org) => {
        if (typeFilter !== "ALL" && org.type !== typeFilter) return false;
        return matchesQuery(org, q);
      }),
    [items, q, typeFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [q, typeFilter, pageSize]);

  const pagedFlat = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFlat.slice(start, start + pageSize);
  }, [filteredFlat, page, pageSize]);

  const stats = useMemo(() => {
    const roots = items.filter((o) => !o.parentId).length;
    const primary = items.find((o) => o.isPrimary);
    const active = items.filter((o) => o.status === "ACTIVE").length;
    return { total: items.length, roots, active, primary };
  }, [items]);

  const parentOptions = useMemo(
    () => [
      { value: "", label: "None — root site" },
      ...items.map((o) => ({
        value: o.id,
        label: o.code ? `${o.name} (${o.code})` : o.name,
      })),
    ],
    [items],
  );

  const resetCreate = () => {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setCode("");
    setType("OTHER");
    setDescription("");
    setParentId("");
  };

  const create = useMutation({
    mutationFn: () =>
      api.organizations.create({
        name: name.trim(),
        slug: slug.trim(),
        code: code.trim() || undefined,
        type: type || undefined,
        description: description.trim() || undefined,
        parentId: parentId || undefined,
      }),
    onSuccess: async (res) => {
      setOpen(false);
      resetCreate();
      await qc.invalidateQueries({ queryKey: idk.organizations() });
      const id = res.data?.id;
      if (id) router.push(`/identity/organizations/${id}`);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (org: IdentityOrganization) => {
      if (org.status === "ACTIVE") return api.organizations.suspend(org.id);
      return api.organizations.activate(org.id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: idk.organizations() });
    },
  });

  const suspendOrg = useMutation({
    mutationFn: (id: string) => api.organizations.suspend(id),
    onSuccess: async () => {
      setSuspendId(null);
      await qc.invalidateQueries({ queryKey: idk.organizations() });
    },
  });

  const columns = useMemo<DataTableColumn<IdentityOrganization>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => row.code || row.slug || "",
        cell: (row) => (
          <span className="font-medium uppercase tracking-wide">
            {row.code || row.slug || "—"}
          </span>
        ),
      },
      {
        id: "label",
        header: "Libellé",
        sortable: true,
        sortValue: (row) => row.name,
        cell: (row) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{row.name}</span>
            {row.isPrimary ? <Badge tone="info">Primary</Badge> : null}
          </div>
        ),
      },
      {
        id: "description",
        header: "Description",
        sortable: true,
        sortValue: (row) => row.description || locationLabel(row),
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {row.description ||
              [typeLabel(row.type), locationLabel(row)].filter(Boolean).join(" · ") ||
              "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        align: "center",
        sortable: true,
        sortValue: (row) => row.status,
        cell: (row) => (
          <div className="flex justify-center">
            <Switch
              checked={row.status === "ACTIVE"}
              disabled={
                row.status === "ARCHIVED" ||
                toggleStatus.isPending ||
                (row.status === "ACTIVE" ? !canSuspend : !canUpdate)
              }
              aria-label={
                row.status === "ACTIVE"
                  ? `Suspendre ${row.name}`
                  : `Activer ${row.name}`
              }
              onCheckedChange={(next) => {
                if (next) void toggleStatus.mutateAsync(row);
                else setSuspendId(row.id);
              }}
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) => (
          <RowActions
            onEdit={() => router.push(`/identity/organizations/${row.id}`)}
            onDelete={
              canSuspend && row.status === "ACTIVE"
                ? () => setSuspendId(row.id)
                : undefined
            }
            deleteLabel="Suspendre"
          />
        ),
      },
    ],
    [canSuspend, canUpdate, router, toggleStatus.isPending],
  );

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (orgsQuery.isLoading) {
    return (
      <>
        <PageHeader
          className="mb-[var(--space-4)]"
          title="Organizations"
          description="Sites, branches, and establishments in this tenant."
        />
        <Skeleton className="min-h-0 w-full flex-1" />
      </>
    );
  }

  if (orgsQuery.isError) {
    return (
      <>
        <PageHeader
          className="mb-[var(--space-4)]"
          title="Organizations"
          description="Sites, branches, and establishments in this tenant."
        />
        <ErrorState
          title="Couldn't load organizations"
          description={
            orgsQuery.error instanceof Error
              ? orgsQuery.error.message
              : "Try again shortly."
          }
          onRetry={() => void orgsQuery.refetch()}
        />
      </>
    );
  }

  const filtering = Boolean(q) || typeFilter !== "ALL";
  const visibleCount = view === "tree" ? treeRows.length : filteredFlat.length;

  const viewToggle = (
    <div
      role="group"
      aria-label="View"
      className="inline-flex h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-0.5"
    >
      {(
        [
          ["table", "Table"],
          ["tree", "Hierarchy"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          className={cn(
            "rounded-[calc(var(--radius-sm)-2px)] px-3 type-xs font-medium transition-colors",
            view === id
              ? "bg-[var(--surface-muted)] text-[var(--text-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
          onClick={() => setView(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <FillSection>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Organizations"
        description="Sites, branches, and establishments in this tenant."
        status={
          stats.primary ? (
            <Badge tone="info">Primary · {stats.primary.name}</Badge>
          ) : null
        }
      />

      {view === "tree" ? (
        <div className="flex shrink-0 flex-wrap items-center gap-[var(--space-2)]">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, city…"
              className="pl-9"
              aria-label="Search organizations"
            />
          </div>
          <Select
            className="w-[10.5rem]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="ALL">All types</option>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeLabel(t)}
              </option>
            ))}
          </Select>
          {viewToggle}
          {canCreate ? (
            <Button type="button" className="ml-auto" onClick={() => setOpen(true)}>
              <Plus />
              Ajouter
            </Button>
          ) : null}
        </div>
      ) : null}

      {view === "table" ? (
        <DataTable
          columns={columns}
          rows={pagedFlat}
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Rechercher des organisations…",
          }}
          toolbar={
            <>
              <Select
                className="w-[10.5rem]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
              >
                <option value="ALL">All types</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {typeLabel(t)}
                  </option>
                ))}
              </Select>
              {viewToggle}
            </>
          }
          onRefresh={() => void orgsQuery.refetch()}
          refreshing={orgsQuery.isFetching}
          addAction={
            canCreate
              ? { label: "Ajouter", onClick: () => setOpen(true) }
              : undefined
          }
          pagination={{
            page,
            pageSize,
            total: filteredFlat.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
          onRowClick={(row) => {
            router.push(`/identity/organizations/${row.id}`);
          }}
          empty={
            <EmptyState
              title={filtering ? "No matching sites" : "No organizations yet"}
              description={
                filtering
                  ? "Try a different search or type filter."
                  : "Create the first site for this tenant."
              }
              actionLabel={filtering ? "Clear filters" : canCreate ? "Ajouter" : undefined}
              onAction={
                filtering
                  ? () => {
                      setQuery("");
                      setTypeFilter("ALL");
                    }
                  : canCreate
                    ? () => setOpen(true)
                    : undefined
              }
            />
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No organizations yet"
          description="Create the first site for this tenant. You can nest branches, stores, and warehouses under it."
          actionLabel="Ajouter"
          onAction={() => setOpen(true)}
        />
      ) : visibleCount === 0 ? (
        <EmptyState
          title="No matching sites"
          description="Try a different search or type filter."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery("");
            setTypeFilter("ALL");
          }}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-surface)]">
          <ul>
            {treeRows.map((row) => {
              const hasChildren = row.children.length > 0;
              const isCollapsed = !q && collapsed.has(row.id);
              const loc = locationLabel(row);
              const meta = [
                typeLabel(row.type),
                row.code,
                loc,
                row.defaultCurrency,
              ].filter(Boolean);
              return (
                <li
                  key={row.id}
                  className="group border-b border-[var(--border)] last:border-b-0"
                >
                  <div
                    className="flex items-center gap-1 pr-3 hover:bg-[var(--surface-muted)]/60"
                    style={{ paddingLeft: `${8 + row.depth * 20}px` }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        aria-label={isCollapsed ? "Expand" : "Collapse"}
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleCollapsed(row.id)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="size-7 shrink-0" aria-hidden />
                    )}
                    <Link
                      href={`/identity/organizations/${row.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 py-2.5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                        <TypeIcon type={row.type} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-[var(--text-primary)]">
                            {row.name}
                          </span>
                          {row.isPrimary ? (
                            <Badge tone="info">Primary</Badge>
                          ) : null}
                          {row.status !== "ACTIVE" ? (
                            <Badge tone={statusTone(row.status)}>
                              {row.status.toLowerCase()}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate type-xs text-[var(--text-muted)]">
                          {meta.join(" · ")}
                        </p>
                      </div>
                      {hasChildren ? (
                        <span className="hidden shrink-0 type-xs tabular-nums text-[var(--text-muted)] sm:inline">
                          {row.children.length}
                        </span>
                      ) : null}
                      <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
          {filtering ? (
            <p className="border-t border-[var(--border)] px-4 py-2 type-xs text-[var(--text-muted)]">
              Showing {visibleCount} of {stats.total}
            </p>
          ) : null}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetCreate();
        }}
        title="New organization"
        description="Add a site, branch, or establishment to the tenant hierarchy."
        size="md"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!name.trim() || !slug.trim() || create.isPending}
              loading={create.isPending}
              onClick={() => create.mutate()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[var(--space-4)]">
          <Field label="Name" htmlFor="org-name" required>
            <Input
              id="org-name"
              value={name}
              placeholder="Downtown office"
              onChange={(e) => {
                const next = e.target.value;
                setName(next);
                if (!slugTouched) setSlug(slugify(next));
              }}
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="org-slug"
            required
            hint="Used in URLs and integrations. Generated from the name unless you edit it."
          >
            <Input
              id="org-slug"
              value={slug}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type" htmlFor="org-type">
              <Select
                id="org-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {typeLabel(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Code" htmlFor="org-code" hint="Optional internal code.">
              <Input
                id="org-code"
                value={code}
                placeholder="PH-01"
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Parent" htmlFor="org-parent">
            <SearchableSelect
              id="org-parent"
              value={parentId}
              options={parentOptions}
              placeholder="Root site"
              onChange={setParentId}
            />
          </Field>
          <Field label="Description" htmlFor="org-desc">
            <Textarea
              id="org-desc"
              value={description}
              rows={2}
              placeholder="Optional"
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {create.isError ? (
            <p className="type-sm text-[var(--danger)]">
              {create.error instanceof Error
                ? create.error.message
                : "Could not create organization"}
            </p>
          ) : null}
        </div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(suspendId)}
        onOpenChange={(open) => {
          if (!open) setSuspendId(null);
        }}
        title="Suspendre l’organisation ?"
        description="Les utilisateurs de ce site perdront l’accès jusqu’à réactivation."
        confirmLabel="Suspendre"
        tone="danger"
        loading={suspendOrg.isPending || toggleStatus.isPending}
        onConfirm={() => {
          if (suspendId) suspendOrg.mutate(suspendId);
        }}
      />
    </FillSection>
  );
}

export default function OrganizationsPage() {
  return (
    <FillPage>
      <PermissionGate permission="organizations:read">
        <OrganizationsList />
      </PermissionGate>
    </FillPage>
  );
}
