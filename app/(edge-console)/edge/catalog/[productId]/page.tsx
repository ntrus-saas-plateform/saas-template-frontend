"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
import { ListOrUuidField } from "@/components/edge/list-or-uuid-field";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { G11ProductBadge } from "@/components/edge/g11-product-badge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { unwrapRegistryList } from "@/lib/edge/registry";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  EdgeBackend,
  EdgeCapability,
  EdgeCommercialAvailability,
  EdgeProductLifecycleStatus,
  EdgeProductReleaseType,
} from "@/types/edge";
import type { ProductPlatform } from "@/types/edge-registry";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "edit", label: "Edit" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "versions", label: "Versions" },
  { id: "capabilities", label: "Capabilities" },
  { id: "bindings", label: "Backends" },
  { id: "compat", label: "Compatibility" },
  { id: "readiness", label: "Readiness" },
];

const LIFECYCLE_STATUSES: EdgeProductLifecycleStatus[] = [
  "DRAFT",
  "CONFIGURING",
  "TECHNICAL_VALIDATION",
  "READY_FOR_PUBLICATION",
  "PUBLISHED",
  "DEPRECATED",
  "RETIRED",
  "ARCHIVED",
];

const COMMERCIAL_OPTIONS: EdgeCommercialAvailability[] = [
  "UNAVAILABLE",
  "INTERNAL_ONLY",
  "BETA",
  "CONTROLLED_ROLLOUT",
  "AVAILABLE",
  "DEPRECATED",
];

export default function EdgeProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:products:read");
  const [tab, setTab] = useState("overview");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ["edge", "products", productId],
    enabled: allowed && Boolean(productId),
    queryFn: async () => {
      const { data } = await edgeApi.getProduct(productId);
      return data;
    },
  });

  const versionsQuery = useQuery({
    queryKey: ["edge", "products", productId, "versions"],
    enabled: allowed && Boolean(productId),
    queryFn: async () => {
      const { data } = await edgeApi.listProductVersions(productId);
      return data ?? [];
    },
  });

  const versions = versionsQuery.data ?? [];
  const defaultVersionId =
    productQuery.data?.defaultVersionId ?? versions[0]?.id ?? "";

  const [selectedVersionId, setSelectedVersionId] = useState("");
  const versionId = selectedVersionId || defaultVersionId;

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!versionId) throw new Error("Select a product version to publish.");
      // Version-scoped publish (Nest products/:id/versions/:versionId/publish)
      await edgeApi.publishProductVersion(productId, versionId);
      // Product commercial publish (Nest products/:id/publish)
      return edgeApi.publishProduct(productId, { productVersionId: versionId });
    },
    onSuccess: async () => {
      setActionOk("Version + product publish requested.");
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId, "versions"],
      });
    },
    onError: (err) => {
      setActionOk(null);
      setActionError(errMessage(err));
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      if (!versionId) throw new Error("Select a product version to evaluate.");
      return edgeApi.evaluateReadiness(productId, {
        productVersionId: versionId,
      });
    },
    onSuccess: async (res) => {
      setActionOk(`Readiness: ${res.data?.result ?? "completed"}`);
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "readiness-evaluations"],
      });
    },
    onError: (err) => {
      setActionOk(null);
      setActionError(errMessage(err));
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:products:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href="/edge/catalog" />
      {productQuery.isLoading ? <EdgeLoadingState /> : null}
      {productQuery.isError ? (
        <EdgeErrorState
          description={
            productQuery.error instanceof Error
              ? productQuery.error.message
              : "Failed to load product"
          }
          onRetry={() => void productQuery.refetch()}
        />
      ) : null}
      {productQuery.data ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
            <div className="space-y-[var(--space-1)]">
              <h1 className="type-xl font-semibold text-[var(--text-primary)]">
                {productQuery.data.name}
              </h1>
              <p className="type-sm text-[var(--text-secondary)]">
                {[productQuery.data.code, productQuery.data.slug]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Badge>{productQuery.data.lifecycleStatus}</Badge>
            </div>
            <div className="flex flex-wrap gap-[var(--space-2)]">
              <Button asChild variant="outline">
                <Link href={`/edge/verticals/${productQuery.data.verticalId}`}>
                  Vertical studio
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/edge/backends">Backends</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/edge/provisioning/product-controls">
                  BB · Product Control
                </Link>
              </Button>
              <EdgePermissionGate permission="platform:publication:approve">
                <Button
                  disabled={!versionId || publishMutation.isPending}
                  onClick={() => publishMutation.mutate()}
                >
                  {publishMutation.isPending ? "Publishing…" : "Publish"}
                </Button>
              </EdgePermissionGate>
            </div>
          </header>

          {actionError ? (
            <p className="type-sm text-[var(--danger)]" role="alert">
              {actionError}
            </p>
          ) : null}
          {actionOk ? (
            <p className="type-sm text-[var(--success)]">{actionOk}</p>
          ) : null}

          <Tabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === "overview" ? (
            <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <dl className="grid gap-[var(--space-3)] sm:grid-cols-2">
                <DetailField label="Vertical" value={productQuery.data.verticalId} />
                <DetailField
                  label="Commercial"
                  value={productQuery.data.commercialAvailability ?? "—"}
                />
                <DetailField
                  label="G11 readiness"
                  value={
                    <G11ProductBadge product={productQuery.data} />
                  }
                />
                <DetailField
                  label="Technical status"
                  value={productQuery.data.technicalStatus ?? "—"}
                />
                <DetailField
                  label="Default version"
                  value={productQuery.data.defaultVersionId ?? "—"}
                />
              </dl>
              {productQuery.data.description || productQuery.data.shortDescription ? (
                <p className="type-sm text-[var(--text-secondary)]">
                  {productQuery.data.description ??
                    productQuery.data.shortDescription}
                </p>
              ) : null}
              <p className="type-sm">
                <Link
                  href={`/edge/verticals/${productQuery.data.verticalId}/products`}
                  className="font-semibold text-[var(--primary)]"
                >
                  View vertical products
                </Link>
              </p>
            </section>
          ) : null}

          {tab === "edit" ? (
            <ProductEditPanel
              productId={productId}
              initial={{
                name: productQuery.data.name,
                shortDescription: productQuery.data.shortDescription ?? "",
                description: productQuery.data.description ?? "",
                productType: productQuery.data.productType ?? "",
                technicalStatus: productQuery.data.technicalStatus ?? "",
                commercialAvailability:
                  productQuery.data.commercialAvailability ?? "UNAVAILABLE",
              }}
              canUpdate={
                !permissionKnown ||
                hasEdgePermission(permissions, "platform:products:update")
              }
              onSaved={() => {
                setActionOk("Product updated.");
                setActionError(null);
                void queryClient.invalidateQueries({
                  queryKey: ["edge", "products", productId],
                });
              }}
              onError={(msg) => {
                setActionOk(null);
                setActionError(msg);
              }}
            />
          ) : null}

          {tab === "lifecycle" ? (
            <ProductLifecyclePanel
              productId={productId}
              current={productQuery.data.lifecycleStatus}
              canTransition={
                !permissionKnown ||
                hasEdgePermission(permissions, "platform:products:lifecycle")
              }
              onDone={() => {
                setActionOk("Lifecycle transition applied.");
                setActionError(null);
                void queryClient.invalidateQueries({
                  queryKey: ["edge", "products", productId],
                });
              }}
              onError={(msg) => {
                setActionOk(null);
                setActionError(msg);
              }}
            />
          ) : null}

          {tab === "versions" ? (
            <VersionsPanel
              productId={productId}
              versions={versions}
              loading={versionsQuery.isLoading}
              error={versionsQuery.error}
              onRetry={() => void versionsQuery.refetch()}
              selectedVersionId={versionId}
              onSelectVersion={setSelectedVersionId}
              canCreate={hasEdgePermission(
                permissions,
                "platform:products:create",
              )}
              canPublishVersion={
                !permissionKnown ||
                hasEdgePermission(permissions, "platform:products:publish") ||
                hasEdgePermission(permissions, "platform:publication:approve")
              }
            />
          ) : null}

          {tab === "capabilities" ? (
            <CapabilityMappingsPanel productId={productId} />
          ) : null}

          {tab === "bindings" ? (
            <BackendBindingsPanel productId={productId} />
          ) : null}

          {tab === "compat" ? (
            <CompatibilitiesPanel
              productId={productId}
              versions={versions}
              selectedVersionId={versionId}
            />
          ) : null}

          {tab === "readiness" ? (
            <section className="space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
              <h2 className="type-md font-semibold text-[var(--text-primary)]">
                Readiness
              </h2>
              <p className="type-sm text-[var(--text-secondary)]">
                Evaluate publication readiness for a product version, then review
                results on the readiness board.
              </p>
              <label className="block max-w-md space-y-1">
                <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Version
                </span>
                <select
                  className={fieldControlClass}
                  value={versionId}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                >
                  <option value="">Select version…</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.version} · {v.status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                <EdgePermissionGate permission="platform:readiness:evaluate">
                  <Button
                    disabled={!versionId || evaluateMutation.isPending}
                    onClick={() => evaluateMutation.mutate()}
                  >
                    {evaluateMutation.isPending ? "Evaluating…" : "Evaluate"}
                  </Button>
                </EdgePermissionGate>
                <Button asChild variant="outline">
                  <Link href="/edge/readiness">Open readiness board</Link>
                </Button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 type-sm text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function VersionsPanel({
  productId,
  versions,
  loading,
  error,
  onRetry,
  selectedVersionId,
  onSelectVersion,
  canCreate,
  canPublishVersion,
}: {
  productId: string;
  versions: Array<{
    id: string;
    version: string;
    status: string;
    releaseType: string;
    releaseName?: string | null;
  }>;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  selectedVersionId: string;
  onSelectVersion: (id: string) => void;
  canCreate: boolean;
  canPublishVersion: boolean;
}) {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState("");
  const [releaseType, setReleaseType] =
    useState<EdgeProductReleaseType>("MINOR");
  const [createError, setCreateError] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [busyVersionId, setBusyVersionId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () =>
      edgeApi.createProductVersion(productId, {
        version: version.trim(),
        releaseType,
      }),
    onSuccess: async () => {
      setVersion("");
      setCreateError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId, "versions"],
      });
    },
    onError: (err) => setCreateError(errMessage(err)),
  });

  const publishVersionMutation = useMutation({
    mutationFn: async (versionId: string) =>
      edgeApi.publishProductVersion(productId, versionId),
    onSuccess: async () => {
      setPublishMsg("Version published (products/:id/versions/:versionId/publish).");
      setBusyVersionId(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId, "versions"],
      });
    },
    onError: (err) => {
      setBusyVersionId(null);
      setPublishMsg(errMessage(err));
    },
  });

  const sorted = useMemo(() => versions, [versions]);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!version.trim()) {
      setCreateError("Version is required.");
      return;
    }
    createMutation.mutate();
  }

  if (loading) return <EdgeLoadingState />;
  if (error) {
    return (
      <EdgeErrorState
        description={errMessage(error)}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-[var(--space-4)]">
      {publishMsg ? (
        <p className="type-sm text-[var(--text-secondary)]" role="status">
          {publishMsg}
        </p>
      ) : null}
      {!sorted.length ? (
        <EdgeEmptyState
          title="No versions"
          description="Create a version before evaluating readiness or publishing."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {sorted.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left hover:opacity-90"
                onClick={() => onSelectVersion(v.id)}
                aria-pressed={selectedVersionId === v.id}
              >
                <span className="block font-medium text-[var(--text-primary)]">
                  {v.version}
                  {v.releaseName ? ` · ${v.releaseName}` : ""}
                </span>
                <span className="type-xs text-[var(--text-muted)]">
                  {v.releaseType} · {v.status}
                </span>
              </button>
              <div className="flex items-center gap-[var(--space-2)]">
                {selectedVersionId === v.id ? (
                  <Badge tone="info">Selected</Badge>
                ) : null}
                {canPublishVersion ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      busyVersionId === v.id || publishVersionMutation.isPending
                    }
                    onClick={() => {
                      setBusyVersionId(v.id);
                      setPublishMsg(null);
                      publishVersionMutation.mutate(v.id);
                    }}
                  >
                    {busyVersionId === v.id ? "Publishing…" : "Publish version"}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreate ? (
        <form
          onSubmit={onCreate}
          className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
        >
          <h3 className="type-sm font-semibold text-[var(--text-primary)]">
            Create version
          </h3>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Version
              </span>
              <input
                className={fieldControlClass}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Release type
              </span>
              <select
                className={fieldControlClass}
                value={releaseType}
                onChange={(e) =>
                  setReleaseType(e.target.value as EdgeProductReleaseType)
                }
              >
                {(
                  [
                    "MAJOR",
                    "MINOR",
                    "PATCH",
                    "HOTFIX",
                    "SECURITY",
                    "LTS",
                  ] as EdgeProductReleaseType[]
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {createError ? (
            <p className="type-sm text-[var(--danger)]">{createError}</p>
          ) : null}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Add version"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function ProductEditPanel({
  productId,
  initial,
  canUpdate,
  onSaved,
  onError,
}: {
  productId: string;
  initial: {
    name: string;
    shortDescription: string;
    description: string;
    productType: string;
    technicalStatus: string;
    commercialAvailability: EdgeCommercialAvailability | string;
  };
  canUpdate: boolean;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [shortDescription, setShortDescription] = useState(
    initial.shortDescription,
  );
  const [description, setDescription] = useState(initial.description);
  const [productType, setProductType] = useState(initial.productType);
  const [technicalStatus, setTechnicalStatus] = useState(
    initial.technicalStatus,
  );
  const [commercialAvailability, setCommercialAvailability] = useState(
    initial.commercialAvailability,
  );

  useEffect(() => {
    setName(initial.name);
    setShortDescription(initial.shortDescription);
    setDescription(initial.description);
    setProductType(initial.productType);
    setTechnicalStatus(initial.technicalStatus);
    setCommercialAvailability(initial.commercialAvailability);
  }, [initial]);

  const mutation = useMutation({
    mutationFn: async () =>
      edgeApi.updateProduct(productId, {
        name: name.trim(),
        shortDescription: shortDescription.trim() || null,
        description: description.trim() || null,
        productType: productType.trim() || null,
        technicalStatus: technicalStatus.trim() || null,
        commercialAvailability:
          commercialAvailability as EdgeCommercialAvailability,
      }),
    onSuccess: () => onSaved(),
    onError: (err) => onError(errMessage(err)),
  });

  if (!canUpdate) {
    return (
      <EdgeForbiddenState description="Requires platform:products:update." />
    );
  }

  return (
    <form
      className="max-w-2xl space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h2 className="type-md font-semibold">Edit product</h2>
      {(
        [
          ["Name", name, setName],
          ["Short description", shortDescription, setShortDescription],
          ["Product type", productType, setProductType],
          ["Technical status", technicalStatus, setTechnicalStatus],
        ] as const
      ).map(([label, value, setter]) => (
        <label key={label} className="block space-y-1">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {label}
          </span>
          <input
            className={fieldControlClass}
            value={value}
            onChange={(e) => setter(e.target.value)}
          />
        </label>
      ))}
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
      <label className="block space-y-1">
        <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Commercial availability
        </span>
        <select
          className={fieldControlClass}
          value={commercialAvailability}
          onChange={(e) => setCommercialAvailability(e.target.value)}
        >
          {COMMERCIAL_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save product"}
      </Button>
    </form>
  );
}

function ProductLifecyclePanel({
  productId,
  current,
  canTransition,
  onDone,
  onError,
}: {
  productId: string;
  current: EdgeProductLifecycleStatus | string;
  canTransition: boolean;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [toStatus, setToStatus] = useState(current);
  const mutation = useMutation({
    mutationFn: async () =>
      edgeApi.transitionProductLifecycle(productId, toStatus),
    onSuccess: () => onDone(),
    onError: (err) => onError(errMessage(err)),
  });

  return (
    <section className="space-y-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-5)]">
      <h2 className="type-md font-semibold">Lifecycle</h2>
      <p className="type-sm text-[var(--text-secondary)]">
        Current: <strong>{current}</strong>
      </p>
      {canTransition ? (
        <div className="flex flex-wrap items-end gap-[var(--space-3)]">
          <label className="space-y-1">
            <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Target status
            </span>
            <select
              className={fieldControlClass}
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value)}
            >
              {LIFECYCLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={mutation.isPending || toStatus === current}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Applying…" : "Apply transition"}
          </Button>
        </div>
      ) : (
        <EdgeForbiddenState description="Requires platform:products:lifecycle." />
      )}
    </section>
  );
}

function CapabilityMappingsPanel({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const canManage = hasEdgePermission(
    permissions,
    "platform:capabilities:manage",
  );
  const [capabilityId, setCapabilityId] = useState("");
  const [classification, setClassification] = useState("CORE");
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["edge", "products", productId, "capabilities"],
    queryFn: async () => {
      const { data } = await edgeApi.listProductCapabilityMappings(productId);
      return data ?? [];
    },
  });

  const capsQuery = useQuery({
    queryKey: ["edge", "capabilities"],
    enabled: canManage,
    queryFn: async () => {
      const { data } = await edgeApi.listCapabilities();
      return data ?? [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () =>
      edgeApi.upsertProductCapabilityMapping(productId, {
        capabilityId,
        classification,
      }),
    onSuccess: async () => {
      setFormError(null);
      setCapabilityId("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId, "capabilities"],
      });
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  if (query.isLoading) return <EdgeLoadingState />;
  if (query.isError) {
    return (
      <EdgeErrorState
        description={errMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-[var(--space-4)]">
      {!query.data?.length ? (
        <EdgeEmptyState
          title="No capability mappings"
          description="Map technical capabilities before readiness evaluation can pass required-capability checks."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {m.capabilityId}
                </p>
                <p className="type-xs text-[var(--text-muted)]">
                  {m.classification}
                  {m.technicalStatus ? ` · ${m.technicalStatus}` : ""}
                </p>
              </div>
              {m.commercialAvailability ? (
                <Badge>{m.commercialAvailability}</Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form
          className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!capabilityId) {
              setFormError("Select a capability.");
              return;
            }
            upsertMutation.mutate();
          }}
        >
          <h3 className="type-sm font-semibold">Map capability</h3>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Capability
              </span>
              <select
                className={fieldControlClass}
                value={capabilityId}
                onChange={(e) => setCapabilityId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {(capsQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Classification
              </span>
              <select
                className={fieldControlClass}
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
              >
                {["CORE", "OPTIONAL", "EXPERIMENTAL", "DEPRECATED"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError ? (
            <p className="type-sm text-[var(--danger)]">{formError}</p>
          ) : null}
          <Button type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "Saving…" : "Upsert mapping"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function BackendBindingsPanel({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const canManage = hasEdgePermission(permissions, "platform:backends:manage");
  const [backendId, setBackendId] = useState("");
  const [bindingType, setBindingType] = useState("PRIMARY");
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["edge", "products", productId, "bindings"],
    queryFn: async () => {
      const { data } = await edgeApi.listProductBackendBindings(productId);
      return data ?? [];
    },
  });

  const backendsQuery = useQuery({
    queryKey: ["edge", "backends"],
    enabled: canManage,
    queryFn: async () => {
      const { data } = await edgeApi.listBackends();
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      edgeApi.createProductBackendBinding(productId, {
        backendId,
        bindingType,
      }),
    onSuccess: async () => {
      setFormError(null);
      setBackendId("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId, "bindings"],
      });
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  if (query.isLoading) return <EdgeLoadingState />;
  if (query.isError) {
    return (
      <EdgeErrorState
        description={errMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-[var(--space-4)]">
      <p className="type-sm text-[var(--text-secondary)]">
        Bind this product to a Business Backend. Runtime control of BB endpoints
        is in{" "}
        <Link
          href="/edge/provisioning/product-controls"
          className="font-semibold text-[var(--primary)]"
        >
          Product Control
        </Link>
        .
      </p>
      {!query.data?.length ? (
        <EdgeEmptyState
          title="No backend bindings"
          description="Register a PRIMARY business backend binding before publication when the readiness profile requires it."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {b.backendId}
                </p>
                <p className="type-xs text-[var(--text-muted)]">
                  {b.bindingType}
                  {b.deploymentMode ? ` · ${b.deploymentMode}` : ""}
                </p>
              </div>
              {b.compatibilityStatus ? (
                <Badge>{b.compatibilityStatus}</Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form
          className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!backendId) {
              setFormError("Select a backend.");
              return;
            }
            createMutation.mutate();
          }}
        >
          <h3 className="type-sm font-semibold">Add backend binding</h3>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Backend
              </span>
              <select
                className={fieldControlClass}
                value={backendId}
                onChange={(e) => setBackendId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {(backendsQuery.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} · {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Binding type
              </span>
              <select
                className={fieldControlClass}
                value={bindingType}
                onChange={(e) => setBindingType(e.target.value)}
              >
                {["PRIMARY", "SECONDARY", "SHADOW", "MIGRATION"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError ? (
            <p className="type-sm text-[var(--danger)]">{formError}</p>
          ) : null}
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Binding…" : "Create binding"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/edge/backends">Manage backends</Link>
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function CompatibilitiesPanel({
  productId,
  versions,
  selectedVersionId,
}: {
  productId: string;
  versions: Array<{ id: string; version: string; status: string }>;
  selectedVersionId: string;
}) {
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const canUpdate = hasEdgePermission(permissions, "platform:products:update");
  const [targetType, setTargetType] = useState("BACKEND");
  const [targetId, setTargetId] = useState("");
  const [status, setStatus] = useState("COMPATIBLE");
  const [justification, setJustification] = useState("");
  const [versionId, setVersionId] = useState(selectedVersionId);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedVersionId) setVersionId(selectedVersionId);
  }, [selectedVersionId]);

  const query = useQuery({
    queryKey: ["edge", "products", productId, "compatibilities"],
    queryFn: async () => {
      const { data } = await edgeApi.listCompatibilities(productId);
      return data ?? [];
    },
  });

  const backendsQuery = useQuery({
    queryKey: ["edge", "backends", "compat-pick"],
    enabled: canUpdate && targetType === "BACKEND",
    queryFn: async () => {
      const { data } = await edgeApi.listBackends();
      return (data ?? []) as EdgeBackend[];
    },
  });

  const capsQuery = useQuery({
    queryKey: ["edge", "capabilities", "compat-pick"],
    enabled: canUpdate && targetType === "CAPABILITY",
    queryFn: async () => {
      const { data } = await edgeApi.listCapabilities();
      return (data ?? []) as EdgeCapability[];
    },
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "integration-contracts", "compat-pick"],
    enabled: canUpdate && targetType === "INTEGRATION_CONTRACT",
    queryFn: async () => {
      const { data } = await edgeApi.listIntegrationContracts();
      return (data ?? []) as Array<Record<string, unknown>>;
    },
  });

  const platformsQuery = useQuery({
    queryKey: ["edge", "registry", "platforms", "compat-pick"],
    enabled: canUpdate && targetType === "PLATFORM",
    queryFn: async () => {
      const { data } = await edgeApi.listRegistryPlatforms({ limit: 100 });
      return unwrapRegistryList<ProductPlatform>(data).items;
    },
  });

  const targetPickOptions = useMemo(() => {
    if (targetType === "BACKEND") {
      return (backendsQuery.data ?? []).map((b) => ({
        id: b.id,
        label: `${b.code} · ${b.name}`,
      }));
    }
    if (targetType === "CAPABILITY") {
      return (capsQuery.data ?? []).map((c) => ({
        id: c.id,
        label: `${c.code} · ${c.name}`,
      }));
    }
    if (targetType === "INTEGRATION_CONTRACT") {
      return (contractsQuery.data ?? [])
        .map((c) => {
          const id = String(c.id ?? "").trim();
          if (!id) return null;
          return {
            id,
            label: `${String(c.code ?? c.name ?? id).slice(0, 40)} · ${id.slice(0, 8)}…`,
          };
        })
        .filter((o): o is { id: string; label: string } => Boolean(o));
    }
    if (targetType === "PLATFORM") {
      return (platformsQuery.data ?? []).map((p) => ({
        id: p.id,
        label: `${p.code ?? p.id} · ${p.name ?? p.id}`,
      }));
    }
    return [];
  }, [
    targetType,
    backendsQuery.data,
    capsQuery.data,
    contractsQuery.data,
    platformsQuery.data,
  ]);

  const upsertMutation = useMutation({
    mutationFn: async () =>
      edgeApi.upsertCompatibility(productId, {
        productVersionId: versionId || null,
        targetType: targetType.trim(),
        targetId: targetId.trim(),
        status: status.trim(),
        justification: justification.trim() || null,
      }),
    onSuccess: async () => {
      setFormError(null);
      setTargetId("");
      setJustification("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId, "compatibilities"],
      });
    },
    onError: (err) => setFormError(errMessage(err)),
  });

  if (query.isLoading) return <EdgeLoadingState />;
  if (query.isError) {
    return (
      <EdgeErrorState
        description={errMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-[var(--space-4)]">
      <p className="type-sm text-[var(--text-secondary)]">
        Product compatibility matrix (PUT /products/:id/compatibilities).
      </p>
      {!query.data?.length ? (
        <EdgeEmptyState
          title="No compatibility rows"
          description="Upsert a target (backend, contract, platform) before publication gates that require it."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {row.targetType} · {row.targetId}
                </p>
                <p className="type-xs text-[var(--text-muted)]">
                  {row.productVersionId
                    ? `version ${row.productVersionId}`
                    : "all versions"}
                  {row.justification ? ` · ${row.justification}` : ""}
                </p>
              </div>
              <Badge>{row.status}</Badge>
            </li>
          ))}
        </ul>
      )}

      {canUpdate ? (
        <form
          className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!targetId.trim()) {
              setFormError("Target id is required.");
              return;
            }
            upsertMutation.mutate();
          }}
        >
          <h3 className="type-sm font-semibold">Upsert compatibility</h3>
          <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Product version
              </span>
              <select
                className={fieldControlClass}
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
              >
                <option value="">All / unspecified</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version} · {v.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Target type
              </span>
              <select
                className={fieldControlClass}
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setTargetId("");
                }}
              >
                {["BACKEND", "INTEGRATION_CONTRACT", "PLATFORM", "CAPABILITY"].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Target id
              </span>
              <ListOrUuidField
                value={targetId}
                onChange={setTargetId}
                options={targetPickOptions}
                placeholder={`Select ${targetType.toLowerCase()}`}
                fallbackPlaceholder="UUID or code"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Status
              </span>
              <select
                className={fieldControlClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {[
                  "COMPATIBLE",
                  "INCOMPATIBLE",
                  "CONDITIONAL",
                  "UNKNOWN",
                  "DEPRECATED",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Justification
              </span>
              <input
                className={fieldControlClass}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>
          {formError ? (
            <p className="type-sm text-[var(--danger)]">{formError}</p>
          ) : null}
          <Button type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "Saving…" : "Upsert compatibility"}
          </Button>
        </form>
      ) : (
        <EdgeForbiddenState description="Requires platform:products:update to upsert." />
      )}
    </div>
  );
}

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}
