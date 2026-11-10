"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import {
  RegistryFilters,
  RegistryPagination,
  RegistryStatusBadge,
  RegistryTableShell,
  formatRegistryDate,
} from "@/components/edge/registry/shared";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import {
  ENVIRONMENT_TYPE_OPTIONS,
  PLATFORM_TYPE_OPTIONS,
  REGISTRY_STATUS_OPTIONS,
  redactSecureConfigRef,
  registryErrMessage,
  unwrapEdgeData,
  unwrapRegistryList,
} from "@/lib/edge/registry";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { EdgeProduct } from "@/types/edge";
import type {
  CompatibilityEvaluation,
  DeploymentProfile,
  ProductControlContract,
  ProductPlatform,
  ProductRegistryRecord,
  ProductTechnicalVersion,
  RegistryHistoryEntry,
  RuntimeEnvironment,
} from "@/types/edge-registry";

type TabId =
  | "products"
  | "versions"
  | "platforms"
  | "environments"
  | "profiles"
  | "contracts"
  | "compatibility"
  | "history";

const TABS: { id: TabId; label: string; permissions: string[] }[] = [
  {
    id: "products",
    label: "Products",
    permissions: ["platform:product_registry:read"],
  },
  {
    id: "versions",
    label: "Versions",
    permissions: ["platform:product_registry:read"],
  },
  {
    id: "platforms",
    label: "Platforms",
    permissions: ["platform:product_platforms:read"],
  },
  {
    id: "environments",
    label: "Environments",
    permissions: ["platform:runtime_environments:read"],
  },
  {
    id: "profiles",
    label: "Profiles",
    permissions: ["platform:deployment_profiles:read"],
  },
  {
    id: "contracts",
    label: "Contracts",
    permissions: ["platform:product_control_contracts:read"],
  },
  {
    id: "compatibility",
    label: "Compatibility",
    permissions: [
      "platform:registry_compatibility:evaluate",
      "platform:product_registry:read",
    ],
  },
  {
    id: "history",
    label: "History",
    permissions: ["platform:registry_history:read"],
  },
];

const LIMIT = 20;

export default function RegistryManagementPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const canReadAny = useMemo(
    () =>
      TABS.some((t) => hasAnyEdgePermission(permissions, t.permissions)) ||
      hasEdgePermission(permissions, "platform:product_registry:read"),
    [permissions],
  );

  const [tab, setTab] = useState<TabId>("products");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const allowed = TABS.find((t) =>
      hasAnyEdgePermission(permissions, t.permissions),
    )?.id;
    if (allowed && !hasAnyEdgePermission(
      permissions,
      TABS.find((t) => t.id === tab)?.permissions ?? [],
    )) {
      setTab(allowed);
    }
  }, [permissions, tab]);

  const canManageProducts = hasEdgePermission(
    permissions,
    "platform:product_registry:manage",
  );
  const canManagePlatforms = hasEdgePermission(
    permissions,
    "platform:product_platforms:manage",
  );
  const canManageEnvironments = hasEdgePermission(
    permissions,
    "platform:runtime_environments:manage",
  );
  const canManageProfiles = hasEdgePermission(
    permissions,
    "platform:deployment_profiles:manage",
  );
  const canManageContracts = hasEdgePermission(
    permissions,
    "platform:product_control_contracts:manage",
  );
  const canEvaluate = hasEdgePermission(
    permissions,
    "platform:registry_compatibility:evaluate",
  );

  const productsQuery = useQuery({
    queryKey: ["edge", "registry", "products", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryProducts({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled: canReadAny && tab === "products",
  });

  const [versionProductId, setVersionProductId] = useState("");
  const versionsQuery = useQuery({
    queryKey: [
      "edge",
      "registry",
      "versions",
      versionProductId,
      { q, status, offset },
    ],
    queryFn: () =>
      edgeApi.listRegistryProductVersions(versionProductId, {
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "versions" &&
      Boolean(versionProductId) &&
      hasEdgePermission(permissions, "platform:product_registry:read"),
  });

  const platformsQuery = useQuery({
    queryKey: ["edge", "registry", "platforms", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryPlatforms({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      (tab === "platforms" ||
        tab === "environments" ||
        tab === "contracts" ||
        tab === "compatibility"),
  });

  const environmentsQuery = useQuery({
    queryKey: ["edge", "registry", "environments", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryEnvironments({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      (tab === "environments" || tab === "compatibility") &&
      hasEdgePermission(permissions, "platform:runtime_environments:read"),
  });

  const profilesQuery = useQuery({
    queryKey: ["edge", "registry", "profiles", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryDeploymentProfiles({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      (tab === "profiles" || tab === "compatibility") &&
      hasEdgePermission(permissions, "platform:deployment_profiles:read"),
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "registry", "contracts", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryControlContracts({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      (tab === "contracts" || tab === "compatibility") &&
      hasEdgePermission(permissions, "platform:product_control_contracts:read"),
  });

  const compatibilityQuery = useQuery({
    queryKey: ["edge", "registry", "compatibility", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryCompatibilityEvaluations({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled: canReadAny && tab === "compatibility",
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "registry", "history", { q, status, offset }],
    queryFn: () =>
      edgeApi.listRegistryHistory({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "history" &&
      hasEdgePermission(permissions, "platform:registry_history:read"),
  });

  const catalogProductsQuery = useQuery({
    queryKey: ["edge", "products", "registry-select"],
    queryFn: () => edgeApi.listProducts({ limit: 100 }),
    enabled:
      canManageProducts || canManageContracts || tab === "versions",
  });

  const registryProductsForSelectQuery = useQuery({
    queryKey: ["edge", "registry", "products", "select"],
    queryFn: () => edgeApi.listRegistryProducts({ limit: 100 }),
    enabled: tab === "versions" || tab === "compatibility",
  });

  const catalogProducts = useMemo(() => {
    const raw = unwrapEdgeData<EdgeProduct[] | { items?: EdgeProduct[] }>(
      catalogProductsQuery.data,
    );
    if (Array.isArray(raw)) return raw;
    return raw?.items ?? [];
  }, [catalogProductsQuery.data]);

  const registryProducts = useMemo(
    () => unwrapRegistryList<ProductRegistryRecord>(registryProductsForSelectQuery.data).items,
    [registryProductsForSelectQuery.data],
  );

  const platforms = useMemo(
    () => unwrapRegistryList<ProductPlatform>(platformsQuery.data).items,
    [platformsQuery.data],
  );

  const [productForm, setProductForm] = useState({
    productId: "",
    code: "",
    name: "",
    description: "",
  });
  const [versionForm, setVersionForm] = useState({
    technicalVersion: "",
    releaseChannel: "stable",
    changeSummary: "",
  });
  const [platformForm, setPlatformForm] = useState({
    code: "",
    name: "",
    description: "",
    platformType: "SHARED_SAAS_PLATFORM",
    secureConfigRef: "",
  });
  const [envForm, setEnvForm] = useState({
    platformId: "",
    code: "",
    name: "",
    environmentType: "PRODUCTION",
    region: "",
  });
  const [contractForm, setContractForm] = useState({
    productId: "",
    platformId: "",
    contractCode: "",
    contractVersion: "1.0.0",
    schemaVersion: "1.0",
    connectivityModel: "S2S",
  });
  const [compatForm, setCompatForm] = useState({
    productRegistryId: "",
    technicalVersionId: "",
    platformId: "",
    environmentId: "",
    profileId: "",
    contractId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const compatVersionsQuery = useQuery({
    queryKey: [
      "edge",
      "registry",
      "versions",
      "compat",
      compatForm.productRegistryId,
    ],
    queryFn: () =>
      edgeApi.listRegistryProductVersions(compatForm.productRegistryId, {
        limit: 100,
      }),
    enabled:
      tab === "compatibility" && Boolean(compatForm.productRegistryId),
  });

  const invalidate = async (keys: string[]) => {
    await queryClient.invalidateQueries({ queryKey: ["edge", "registry", ...keys] });
  };

  const createProduct = useMutation({
    mutationFn: () =>
      edgeApi.createRegistryProduct({
        productId: productForm.productId,
        code: productForm.code.trim(),
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
      }),
    onSuccess: async () => {
      setProductForm({ productId: "", code: "", name: "", description: "" });
      setFormError(null);
      await invalidate(["products"]);
    },
    onError: (err) => setFormError(registryErrMessage(err)),
  });

  const createVersion = useMutation({
    mutationFn: () =>
      edgeApi.createRegistryProductVersion(versionProductId, {
        technicalVersion: versionForm.technicalVersion.trim(),
        releaseChannel: versionForm.releaseChannel.trim() || "stable",
        changeSummary: versionForm.changeSummary.trim() || null,
      }),
    onSuccess: async () => {
      setVersionForm({
        technicalVersion: "",
        releaseChannel: "stable",
        changeSummary: "",
      });
      setFormError(null);
      await invalidate(["versions"]);
    },
    onError: (err) => setFormError(registryErrMessage(err)),
  });

  const createPlatform = useMutation({
    mutationFn: () =>
      edgeApi.createRegistryPlatform({
        code: platformForm.code.trim(),
        name: platformForm.name.trim(),
        description: platformForm.description.trim() || null,
        platformType: platformForm.platformType,
        secureConfigRef: platformForm.secureConfigRef.trim() || null,
      }),
    onSuccess: async () => {
      setPlatformForm({
        code: "",
        name: "",
        description: "",
        platformType: "SHARED_SAAS_PLATFORM",
        secureConfigRef: "",
      });
      setFormError(null);
      await invalidate(["platforms"]);
    },
    onError: (err) => setFormError(registryErrMessage(err)),
  });

  const createEnvironment = useMutation({
    mutationFn: () =>
      edgeApi.createRegistryEnvironment({
        platformId: envForm.platformId,
        code: envForm.code.trim(),
        name: envForm.name.trim(),
        environmentType: envForm.environmentType,
        region: envForm.region.trim() || null,
      }),
    onSuccess: async () => {
      setEnvForm({
        platformId: "",
        code: "",
        name: "",
        environmentType: "PRODUCTION",
        region: "",
      });
      setFormError(null);
      await invalidate(["environments"]);
    },
    onError: (err) => setFormError(registryErrMessage(err)),
  });

  const createContract = useMutation({
    mutationFn: () =>
      edgeApi.createRegistryControlContract({
        productId: contractForm.productId,
        platformId: contractForm.platformId,
        contractCode: contractForm.contractCode.trim(),
        contractVersion: contractForm.contractVersion.trim(),
        schemaVersion: contractForm.schemaVersion.trim(),
        connectivityModel: contractForm.connectivityModel.trim(),
      }),
    onSuccess: async () => {
      setContractForm({
        productId: "",
        platformId: "",
        contractCode: "",
        contractVersion: "1.0.0",
        schemaVersion: "1.0",
        connectivityModel: "S2S",
      });
      setFormError(null);
      await invalidate(["contracts"]);
    },
    onError: (err) => setFormError(registryErrMessage(err)),
  });

  const evaluateCompat = useMutation({
    mutationFn: () => edgeApi.evaluateRegistryCompatibility(compatForm),
    onSuccess: async () => {
      setFormError(null);
      await invalidate(["compatibility"]);
    },
    onError: (err) => setFormError(registryErrMessage(err)),
  });

  const switchTab = (next: TabId) => {
    setTab(next);
    setOffset(0);
    setQ("");
    setStatus("");
    setFormError(null);
  };

  if (platformLoading) return <EdgeLoadingState />;
  if (!canReadAny) {
    return (
      <EdgeForbiddenState description="Registry Management requires at least one platform:product_registry / platforms / environments / profiles / contracts / compatibility / history read permission." />
    );
  }

  const statusOptionsForTab =
    tab === "products"
      ? REGISTRY_STATUS_OPTIONS.product
      : tab === "versions"
        ? REGISTRY_STATUS_OPTIONS.version
        : tab === "platforms"
          ? REGISTRY_STATUS_OPTIONS.platform
          : tab === "environments"
            ? REGISTRY_STATUS_OPTIONS.environment
            : tab === "profiles"
              ? REGISTRY_STATUS_OPTIONS.profile
              : tab === "contracts"
                ? REGISTRY_STATUS_OPTIONS.contract
                : tab === "compatibility"
                  ? REGISTRY_STATUS_OPTIONS.compatibility
                  : [];

  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-4)] md:p-[var(--space-6)]">
      <header className="space-y-[var(--space-2)]">
        <p className="type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Ecosystem Management · P7.2 Registry
        </p>
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Registry Management
        </h1>
        <p className="max-w-3xl type-sm text-[var(--text-secondary)]">
          Product, platform, runtime environment, deployment profile, and
          control-contract registries. Compatibility evaluation is
          deterministic — no mock success paths.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {TABS.map((t) =>
          hasAnyEdgePermission(permissions, t.permissions) ? (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "primary" : "ghost"}
              onClick={() => switchTab(t.id)}
            >
              {t.label}
            </Button>
          ) : null,
        )}
      </nav>

      {tab !== "history" ? (
        <RegistryFilters
          q={q}
          status={status}
          statusOptions={statusOptionsForTab}
          onQChange={(value) => {
            setOffset(0);
            setQ(value);
          }}
          onStatusChange={(value) => {
            setOffset(0);
            setStatus(value);
          }}
          extra={
            tab === "versions" ? (
              <select
                className={fieldControlClass}
                value={versionProductId}
                onChange={(e) => {
                  setOffset(0);
                  setVersionProductId(e.target.value);
                }}
                aria-label="Product registry"
              >
                <option value="">Select product registry…</option>
                {registryProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            ) : null
          }
        />
      ) : (
        <RegistryFilters
          q={q}
          status={status}
          statusOptions={[]}
          onQChange={(value) => {
            setOffset(0);
            setQ(value);
          }}
          onStatusChange={(value) => {
            setOffset(0);
            setStatus(value);
          }}
        />
      )}

      {formError ? (
        <p className="type-sm text-[var(--danger)]">{formError}</p>
      ) : null}

      {tab === "products" ? (
        <EdgePermissionGate permission="platform:product_registry:read">
          <ProductsTab
            query={productsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            canManage={canManageProducts}
            catalogProducts={catalogProducts}
            productForm={productForm}
            setProductForm={setProductForm}
            onCreate={(e) => {
              e.preventDefault();
              createProduct.mutate();
            }}
            creating={createProduct.isPending}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "versions" ? (
        <EdgePermissionGate permission="platform:product_registry:read">
          <VersionsTab
            productId={versionProductId}
            query={versionsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            canManage={canManageProducts}
            versionForm={versionForm}
            setVersionForm={setVersionForm}
            onCreate={(e) => {
              e.preventDefault();
              createVersion.mutate();
            }}
            creating={createVersion.isPending}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "platforms" ? (
        <EdgePermissionGate permission="platform:product_platforms:read">
          <PlatformsTab
            query={platformsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            canManage={canManagePlatforms}
            platformForm={platformForm}
            setPlatformForm={setPlatformForm}
            onCreate={(e) => {
              e.preventDefault();
              createPlatform.mutate();
            }}
            creating={createPlatform.isPending}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "environments" ? (
        <EdgePermissionGate permission="platform:runtime_environments:read">
          <EnvironmentsTab
            query={environmentsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            canManage={canManageEnvironments}
            platforms={platforms}
            envForm={envForm}
            setEnvForm={setEnvForm}
            onCreate={(e) => {
              e.preventDefault();
              createEnvironment.mutate();
            }}
            creating={createEnvironment.isPending}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "profiles" ? (
        <EdgePermissionGate permission="platform:deployment_profiles:read">
          <ProfilesTab
            query={profilesQuery}
            offset={offset}
            onOffsetChange={setOffset}
            canManage={canManageProfiles}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "contracts" ? (
        <EdgePermissionGate permission="platform:product_control_contracts:read">
          <ContractsTab
            query={contractsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            canManage={canManageContracts}
            catalogProducts={catalogProducts}
            platforms={platforms}
            contractForm={contractForm}
            setContractForm={setContractForm}
            onCreate={(e) => {
              e.preventDefault();
              createContract.mutate();
            }}
            creating={createContract.isPending}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "compatibility" ? (
        <CompatibilityTab
          canEvaluate={canEvaluate}
          query={compatibilityQuery}
          offset={offset}
          onOffsetChange={setOffset}
          registryProducts={registryProducts}
          versions={
            unwrapRegistryList<ProductTechnicalVersion>(compatVersionsQuery.data)
              .items
          }
          platforms={platforms}
          environments={
            unwrapRegistryList<RuntimeEnvironment>(environmentsQuery.data).items
          }
          profiles={
            unwrapRegistryList<DeploymentProfile>(profilesQuery.data).items
          }
          contracts={
            unwrapRegistryList<ProductControlContract>(contractsQuery.data)
              .items
          }
          compatForm={compatForm}
          setCompatForm={setCompatForm}
          onEvaluate={(e) => {
            e.preventDefault();
            evaluateCompat.mutate();
          }}
          evaluating={evaluateCompat.isPending}
          evaluateError={
            evaluateCompat.isError
              ? registryErrMessage(evaluateCompat.error)
              : null
          }
        />
      ) : null}

      {tab === "history" ? (
        <EdgePermissionGate permission="platform:registry_history:read">
          <HistoryTab
            query={historyQuery}
            offset={offset}
            onOffsetChange={setOffset}
          />
        </EdgePermissionGate>
      ) : null}
    </div>
  );
}

function ProductsTab({
  query,
  offset,
  onOffsetChange,
  canManage,
  catalogProducts,
  productForm,
  setProductForm,
  onCreate,
  creating,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  canManage: boolean;
  catalogProducts: EdgeProduct[];
  productForm: {
    productId: string;
    code: string;
    name: string;
    description: string;
  };
  setProductForm: (v: {
    productId: string;
    code: string;
    name: string;
    description: string;
  }) => void;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
}) {
  const list = unwrapRegistryList<ProductRegistryRecord>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Create product registry entry
          </p>
          <select
            className={fieldControlClass}
            required
            value={productForm.productId}
            onChange={(e) =>
              setProductForm({ ...productForm, productId: e.target.value })
            }
          >
            <option value="">Catalog product…</option>
            {catalogProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <input
            className={fieldControlClass}
            required
            placeholder="Registry code"
            value={productForm.code}
            onChange={(e) =>
              setProductForm({ ...productForm, code: e.target.value })
            }
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Name"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
          />
          <input
            className={fieldControlClass}
            placeholder="Description"
            value={productForm.description}
            onChange={(e) =>
              setProductForm({ ...productForm, description: e.target.value })
            }
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      ) : null}

      {query.isLoading ? (
        <EdgeLoadingState label="Loading products…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No product registry entries"
          description="Create a registry entry linked to a catalog product."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={[
              "Code",
              "Name",
              "Product",
              "Status",
              "Certification",
              "Provisionable",
              "Updated",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/products/${row.id}`}
                    className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.productId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.registryStatus} />
                </td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.certificationStatus} />
                </td>
                <td className="px-3 py-2">
                  {row.provisionable ? "Yes" : "No"}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {formatRegistryDate(row.updatedAt)}
                </td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function VersionsTab({
  productId,
  query,
  offset,
  onOffsetChange,
  canManage,
  versionForm,
  setVersionForm,
  onCreate,
  creating,
}: {
  productId: string;
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  canManage: boolean;
  versionForm: {
    technicalVersion: string;
    releaseChannel: string;
    changeSummary: string;
  };
  setVersionForm: (v: {
    technicalVersion: string;
    releaseChannel: string;
    changeSummary: string;
  }) => void;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
}) {
  if (!productId) {
    return (
      <EdgeEmptyState
        title="Select a product registry"
        description="Technical versions are scoped to a product registry entry."
      />
    );
  }
  const list = unwrapRegistryList<ProductTechnicalVersion>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-3"
        >
          <p className="type-sm font-semibold md:col-span-3">
            Create technical version
          </p>
          <input
            className={fieldControlClass}
            required
            placeholder="Technical version (e.g. 1.2.0)"
            value={versionForm.technicalVersion}
            onChange={(e) =>
              setVersionForm({
                ...versionForm,
                technicalVersion: e.target.value,
              })
            }
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Release channel"
            value={versionForm.releaseChannel}
            onChange={(e) =>
              setVersionForm({
                ...versionForm,
                releaseChannel: e.target.value,
              })
            }
          />
          <input
            className={fieldControlClass}
            placeholder="Change summary"
            value={versionForm.changeSummary}
            onChange={(e) =>
              setVersionForm({
                ...versionForm,
                changeSummary: e.target.value,
              })
            }
          />
          <div className="md:col-span-3">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create version"}
            </Button>
          </div>
        </form>
      ) : null}
      {query.isLoading ? (
        <EdgeLoadingState label="Loading versions…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No technical versions"
          description="Publish a technical version for this product registry."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={["Version", "Channel", "Status", "Support ends", "Updated"]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/versions/${row.id}`}
                    className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {row.technicalVersion}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.releaseChannel}</td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.versionStatus} />
                </td>
                <td className="px-3 py-2 type-xs">
                  {formatRegistryDate(row.supportEndsAt)}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {formatRegistryDate(row.updatedAt)}
                </td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function PlatformsTab({
  query,
  offset,
  onOffsetChange,
  canManage,
  platformForm,
  setPlatformForm,
  onCreate,
  creating,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  canManage: boolean;
  platformForm: {
    code: string;
    name: string;
    description: string;
    platformType: string;
    secureConfigRef: string;
  };
  setPlatformForm: (v: {
    code: string;
    name: string;
    description: string;
    platformType: string;
    secureConfigRef: string;
  }) => void;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
}) {
  const list = unwrapRegistryList<ProductPlatform>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">Create platform</p>
          <input
            className={fieldControlClass}
            required
            placeholder="Code"
            value={platformForm.code}
            onChange={(e) =>
              setPlatformForm({ ...platformForm, code: e.target.value })
            }
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Name"
            value={platformForm.name}
            onChange={(e) =>
              setPlatformForm({ ...platformForm, name: e.target.value })
            }
          />
          <select
            className={fieldControlClass}
            value={platformForm.platformType}
            onChange={(e) =>
              setPlatformForm({
                ...platformForm,
                platformType: e.target.value,
              })
            }
          >
            {PLATFORM_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className={fieldControlClass}
            placeholder="Description"
            value={platformForm.description}
            onChange={(e) =>
              setPlatformForm({
                ...platformForm,
                description: e.target.value,
              })
            }
          />
          <input
            className={fieldControlClass}
            placeholder="Secure config ref (opaque handle only)"
            value={platformForm.secureConfigRef}
            onChange={(e) =>
              setPlatformForm({
                ...platformForm,
                secureConfigRef: e.target.value,
              })
            }
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      ) : null}
      {query.isLoading ? (
        <EdgeLoadingState label="Loading platforms…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No platforms"
          description="Register a product platform before binding environments."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={[
              "Code",
              "Name",
              "Type",
              "Status",
              "Certification",
              "Secure config",
              "Updated",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/platforms/${row.id}`}
                    className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 type-xs">{row.platformType}</td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.operationalStatus} />
                </td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.certificationStatus} />
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                  {redactSecureConfigRef(row.secureConfigRef)}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {formatRegistryDate(row.updatedAt)}
                </td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function EnvironmentsTab({
  query,
  offset,
  onOffsetChange,
  canManage,
  platforms,
  envForm,
  setEnvForm,
  onCreate,
  creating,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  canManage: boolean;
  platforms: ProductPlatform[];
  envForm: {
    platformId: string;
    code: string;
    name: string;
    environmentType: string;
    region: string;
  };
  setEnvForm: (v: {
    platformId: string;
    code: string;
    name: string;
    environmentType: string;
    region: string;
  }) => void;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
}) {
  const list = unwrapRegistryList<RuntimeEnvironment>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Create runtime environment
          </p>
          <select
            className={fieldControlClass}
            required
            value={envForm.platformId}
            onChange={(e) =>
              setEnvForm({ ...envForm, platformId: e.target.value })
            }
          >
            <option value="">Platform…</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            value={envForm.environmentType}
            onChange={(e) =>
              setEnvForm({ ...envForm, environmentType: e.target.value })
            }
          >
            {ENVIRONMENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className={fieldControlClass}
            required
            placeholder="Code"
            value={envForm.code}
            onChange={(e) => setEnvForm({ ...envForm, code: e.target.value })}
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Name"
            value={envForm.name}
            onChange={(e) => setEnvForm({ ...envForm, name: e.target.value })}
          />
          <input
            className={fieldControlClass}
            placeholder="Region"
            value={envForm.region}
            onChange={(e) =>
              setEnvForm({ ...envForm, region: e.target.value })
            }
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      ) : null}
      {query.isLoading ? (
        <EdgeLoadingState label="Loading environments…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No environments"
          description="Attach runtime environments to a registered platform."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={["Code", "Name", "Type", "Platform", "Status", "Region"]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/environments/${row.id}`}
                    className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 type-xs">{row.environmentType}</td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.platformId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.environmentStatus} />
                </td>
                <td className="px-3 py-2">{row.region ?? "—"}</td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function ProfilesTab({
  query,
  offset,
  onOffsetChange,
  canManage,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  canManage: boolean;
}) {
  const list = unwrapRegistryList<DeploymentProfile>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canManage ? (
        <p className="type-sm text-[var(--text-secondary)]">
          Deployment profiles are seeded by the platform. Open a profile to
          update metadata or apply lifecycle transitions.
        </p>
      ) : null}
      {query.isLoading ? (
        <EdgeLoadingState label="Loading profiles…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No deployment profiles"
          description="Profiles appear once seeded by the control plane."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={[
              "Code",
              "Name",
              "Isolation",
              "Status",
              "Certification",
              "Version",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/profiles/${row.id}`}
                    className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 type-xs">{row.isolationModel}</td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.profileStatus} />
                </td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.certificationStatus} />
                </td>
                <td className="px-3 py-2">{row.profileVersion}</td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function ContractsTab({
  query,
  offset,
  onOffsetChange,
  canManage,
  catalogProducts,
  platforms,
  contractForm,
  setContractForm,
  onCreate,
  creating,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  canManage: boolean;
  catalogProducts: EdgeProduct[];
  platforms: ProductPlatform[];
  contractForm: {
    productId: string;
    platformId: string;
    contractCode: string;
    contractVersion: string;
    schemaVersion: string;
    connectivityModel: string;
  };
  setContractForm: (v: {
    productId: string;
    platformId: string;
    contractCode: string;
    contractVersion: string;
    schemaVersion: string;
    connectivityModel: string;
  }) => void;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
}) {
  const list = unwrapRegistryList<ProductControlContract>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Create control contract
          </p>
          <select
            className={fieldControlClass}
            required
            value={contractForm.productId}
            onChange={(e) =>
              setContractForm({ ...contractForm, productId: e.target.value })
            }
          >
            <option value="">Catalog product…</option>
            {catalogProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={contractForm.platformId}
            onChange={(e) =>
              setContractForm({ ...contractForm, platformId: e.target.value })
            }
          >
            <option value="">Platform…</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <input
            className={fieldControlClass}
            required
            placeholder="Contract code"
            value={contractForm.contractCode}
            onChange={(e) =>
              setContractForm({
                ...contractForm,
                contractCode: e.target.value,
              })
            }
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Contract version"
            value={contractForm.contractVersion}
            onChange={(e) =>
              setContractForm({
                ...contractForm,
                contractVersion: e.target.value,
              })
            }
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Schema version"
            value={contractForm.schemaVersion}
            onChange={(e) =>
              setContractForm({
                ...contractForm,
                schemaVersion: e.target.value,
              })
            }
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Connectivity model"
            value={contractForm.connectivityModel}
            onChange={(e) =>
              setContractForm({
                ...contractForm,
                connectivityModel: e.target.value,
              })
            }
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      ) : null}
      {query.isLoading ? (
        <EdgeLoadingState label="Loading contracts…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No control contracts"
          description="Create a product control contract between a catalog product and platform."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={[
              "Code",
              "Version",
              "Product",
              "Platform",
              "Status",
              "Immutable",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/contracts/${row.id}`}
                    className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {row.contractCode}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.contractVersion}</td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.productId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.platformId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2">
                  <RegistryStatusBadge status={row.contractStatus} />
                </td>
                <td className="px-3 py-2">{row.immutable ? "Yes" : "No"}</td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function CompatibilityTab({
  canEvaluate,
  query,
  offset,
  onOffsetChange,
  registryProducts,
  versions,
  platforms,
  environments,
  profiles,
  contracts,
  compatForm,
  setCompatForm,
  onEvaluate,
  evaluating,
  evaluateError,
}: {
  canEvaluate: boolean;
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  registryProducts: ProductRegistryRecord[];
  versions: ProductTechnicalVersion[];
  platforms: ProductPlatform[];
  environments: RuntimeEnvironment[];
  profiles: DeploymentProfile[];
  contracts: ProductControlContract[];
  compatForm: {
    productRegistryId: string;
    technicalVersionId: string;
    platformId: string;
    environmentId: string;
    profileId: string;
    contractId: string;
  };
  setCompatForm: (v: {
    productRegistryId: string;
    technicalVersionId: string;
    platformId: string;
    environmentId: string;
    profileId: string;
    contractId: string;
  }) => void;
  onEvaluate: (e: FormEvent) => void;
  evaluating: boolean;
  evaluateError: string | null;
}) {
  const list = unwrapRegistryList<CompatibilityEvaluation>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {canEvaluate ? (
        <form
          onSubmit={onEvaluate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Evaluate compatibility
          </p>
          <select
            className={fieldControlClass}
            required
            value={compatForm.productRegistryId}
            onChange={(e) =>
              setCompatForm({
                ...compatForm,
                productRegistryId: e.target.value,
                technicalVersionId: "",
              })
            }
          >
            <option value="">Product registry…</option>
            {registryProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={compatForm.technicalVersionId}
            onChange={(e) =>
              setCompatForm({
                ...compatForm,
                technicalVersionId: e.target.value,
              })
            }
          >
            <option value="">Technical version…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.technicalVersion} ({v.versionStatus})
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={compatForm.platformId}
            onChange={(e) =>
              setCompatForm({ ...compatForm, platformId: e.target.value })
            }
          >
            <option value="">Platform…</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={compatForm.environmentId}
            onChange={(e) =>
              setCompatForm({ ...compatForm, environmentId: e.target.value })
            }
          >
            <option value="">Environment…</option>
            {environments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={compatForm.profileId}
            onChange={(e) =>
              setCompatForm({ ...compatForm, profileId: e.target.value })
            }
          >
            <option value="">Profile…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={compatForm.contractId}
            onChange={(e) =>
              setCompatForm({ ...compatForm, contractId: e.target.value })
            }
          >
            <option value="">Contract…</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractCode}@{c.contractVersion}
              </option>
            ))}
          </select>
          <div className="md:col-span-2 space-y-2">
            <Button type="submit" disabled={evaluating}>
              {evaluating ? "Evaluating…" : "Evaluate"}
            </Button>
            {evaluateError ? (
              <p className="type-sm text-[var(--danger)]">{evaluateError}</p>
            ) : null}
          </div>
        </form>
      ) : (
        <EdgeForbiddenState description="Compatibility evaluation requires platform:registry_compatibility:evaluate" />
      )}

      {query.isLoading ? (
        <EdgeLoadingState label="Loading evaluations…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof EdgeApiError && query.error.status === 403
              ? "Forbidden"
              : registryErrMessage(query.error)
          }
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No evaluations yet"
          description="Run a compatibility evaluation to persist a deterministic result."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={["Result", "Product", "Platform", "Reasons", "Evaluated"]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/registry/compatibility/${row.id}`}
                    className="inline-flex"
                  >
                    <RegistryStatusBadge status={row.result} />
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.productRegistryId?.slice(0, 8) ?? "—"}…
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.platformId?.slice(0, 8) ?? "—"}…
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {row.reasons?.slice(0, 2).join("; ") || "—"}
                </td>
                <td className="px-3 py-2 type-xs">
                  {formatRegistryDate(row.evaluatedAt)}
                </td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}

function HistoryTab({
  query,
  offset,
  onOffsetChange,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
}) {
  const list = unwrapRegistryList<RegistryHistoryEntry>(query.data);
  return (
    <section className="space-y-[var(--space-4)]">
      {query.isLoading ? (
        <EdgeLoadingState label="Loading history…" />
      ) : query.isError ? (
        <EdgeErrorState
          description={registryErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <EdgeEmptyState
          title="No registry history"
          description="Lifecycle transitions and mutations will appear here."
        />
      ) : (
        <>
          <RegistryTableShell
            headers={[
              "When",
              "Resource",
              "Action",
              "From → To",
              "Actor",
              "Reason",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2 type-xs">
                  {formatRegistryDate(row.createdAt)}
                </td>
                <td className="px-3 py-2 type-xs">
                  {row.resourceType}
                  <br />
                  <span className="font-mono">{row.resourceId.slice(0, 8)}…</span>
                </td>
                <td className="px-3 py-2">{row.action}</td>
                <td className="px-3 py-2 type-xs">
                  {row.fromStatus ?? "—"} → {row.toStatus ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {row.actorId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {row.reason ?? "—"}
                </td>
              </tr>
            ))}
          </RegistryTableShell>
          <RegistryPagination
            offset={offset}
            limit={LIMIT}
            total={list.total}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </section>
  );
}
