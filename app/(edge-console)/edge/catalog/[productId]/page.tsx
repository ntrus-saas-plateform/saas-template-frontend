"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
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
import type { EdgeProductReleaseType } from "@/types/edge";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "versions", label: "Versions" },
  { id: "capabilities", label: "Capabilities" },
  { id: "bindings", label: "Backends" },
  { id: "readiness", label: "Readiness" },
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
      return edgeApi.publishProduct(productId, { productVersionId: versionId });
    },
    onSuccess: async () => {
      setActionOk("Publish requested.");
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "products", productId],
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
            <EdgePermissionGate permission="platform:publication:approve">
              <Button
                disabled={!versionId || publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                {publishMutation.isPending ? "Publishing…" : "Publish"}
              </Button>
            </EdgePermissionGate>
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
            />
          ) : null}

          {tab === "capabilities" ? (
            <CapabilityMappingsPanel productId={productId} />
          ) : null}

          {tab === "bindings" ? (
            <BackendBindingsPanel productId={productId} />
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

function DetailField({ label, value }: { label: string; value: string }) {
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
}) {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState("");
  const [releaseType, setReleaseType] =
    useState<EdgeProductReleaseType>("MINOR");
  const [createError, setCreateError] = useState<string | null>(null);

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
      {!sorted.length ? (
        <EdgeEmptyState
          title="No versions"
          description="Create a version before evaluating readiness or publishing."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {sorted.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left hover:bg-[var(--surface-muted)]"
                onClick={() => onSelectVersion(v.id)}
                aria-pressed={selectedVersionId === v.id}
              >
                <span>
                  <span className="block font-medium text-[var(--text-primary)]">
                    {v.version}
                    {v.releaseName ? ` · ${v.releaseName}` : ""}
                  </span>
                  <span className="type-xs text-[var(--text-muted)]">
                    {v.releaseType} · {v.status}
                  </span>
                </span>
                {selectedVersionId === v.id ? (
                  <Badge tone="info">Selected</Badge>
                ) : null}
              </button>
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

function CapabilityMappingsPanel({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["edge", "products", productId, "capabilities"],
    queryFn: async () => {
      const { data } = await edgeApi.listProductCapabilityMappings(productId);
      return data ?? [];
    },
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
  if (!query.data?.length) {
    return (
      <EdgeEmptyState
        title="No capability mappings"
        description="Map technical capabilities via the Edge API before readiness evaluation can pass required-capability checks."
      />
    );
  }

  return (
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
  );
}

function BackendBindingsPanel({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["edge", "products", productId, "bindings"],
    queryFn: async () => {
      const { data } = await edgeApi.listProductBackendBindings(productId);
      return data ?? [];
    },
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
  if (!query.data?.length) {
    return (
      <EdgeEmptyState
        title="No backend bindings"
        description="Register a PRIMARY business backend binding before publication when the readiness profile requires it."
      />
    );
  }

  return (
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
          {b.compatibilityStatus ? <Badge>{b.compatibilityStatus}</Badge> : null}
        </li>
      ))}
    </ul>
  );
}

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}
