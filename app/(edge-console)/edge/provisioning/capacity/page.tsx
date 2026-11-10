"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  CapacityFreshnessBadge,
  CapacityMeter,
  PlacementEmpty,
  PlacementError,
  PlacementFilters,
  PlacementForbidden,
  PlacementLoading,
  PlacementPagination,
  PlacementStatusBadge,
  PlacementTableShell,
  formatPlacementDate,
  shortId,
} from "@/components/edge/placement/shared";
import { edgeApi } from "@/lib/api/edge";
import {
  CAPACITY_INVENTORY_STATUS_OPTIONS,
  CAPACITY_RESERVATION_STATUS_OPTIONS,
  CAPACITY_RESOURCE_TYPE_OPTIONS,
  ENVIRONMENT_TYPE_OPTIONS,
  PLACEMENT_POLICY_STATUS_OPTIONS,
  PLACEMENT_REQUEST_STATUS_OPTIONS,
  placementApi,
  placementErrMessage,
  redactPlacementMetadata,
  unwrapPlacementList,
} from "@/lib/edge/placement";
import {
  hasAnyEdgePermission,
  hasEdgePermission,
} from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  CapacityInventoryRecord,
  CapacityReservationRecord,
  PlacementHistoryEntry,
  PlacementPolicyRecord,
  PlacementRequestRecord,
} from "@/types/edge-placement";
import type {
  DeploymentProfile,
  ProductControlContract,
  ProductRegistryRecord,
  ProductTechnicalVersion,
} from "@/types/edge-registry";
import { unwrapRegistryList } from "@/lib/edge/registry";

type TabId = "overview" | "requests" | "capacity" | "policies";

const TABS: { id: TabId; label: string; permissions: string[] }[] = [
  {
    id: "overview",
    label: "Overview",
    permissions: [
      "platform:placement:read",
      "platform:capacity:read",
      "platform:placement_policy:read",
    ],
  },
  {
    id: "requests",
    label: "Requests",
    permissions: ["platform:placement:read"],
  },
  {
    id: "capacity",
    label: "Capacity",
    permissions: ["platform:capacity:read"],
  },
  {
    id: "policies",
    label: "Policies",
    permissions: ["platform:placement_policy:read"],
  },
];

const LIMIT = 20;

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `idem-${Date.now()}`;
}

export default function PlacementCapacityPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();

  const canReadAny = useMemo(
    () =>
      TABS.some((t) => hasAnyEdgePermission(permissions, t.permissions)),
    [permissions],
  );

  const [tab, setTab] = useState<TabId>("overview");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const allowed = TABS.find((t) =>
      hasAnyEdgePermission(permissions, t.permissions),
    )?.id;
    if (
      allowed &&
      !hasAnyEdgePermission(
        permissions,
        TABS.find((t) => t.id === tab)?.permissions ?? [],
      )
    ) {
      setTab(allowed);
    }
  }, [permissions, tab]);

  const canRequest = hasEdgePermission(permissions, "platform:placement:request");
  const canEvaluate = hasEdgePermission(
    permissions,
    "platform:placement:evaluate",
  );
  const canConfirm = hasEdgePermission(
    permissions,
    "platform:placement:confirm",
  );
  const canCancel = hasEdgePermission(permissions, "platform:placement:cancel");
  const canManageCapacity = hasEdgePermission(
    permissions,
    "platform:capacity:manage",
  );
  const canRelease = hasEdgePermission(
    permissions,
    "platform:capacity:release",
  );
  const canManagePolicy = hasEdgePermission(
    permissions,
    "platform:placement_policy:manage",
  );

  const requestsQuery = useQuery({
    queryKey: ["edge", "placement", "requests", { q, status, offset, tab }],
    queryFn: () =>
      placementApi.listRequests({
        q: q || undefined,
        status: status || undefined,
        limit: tab === "overview" ? 100 : LIMIT,
        offset: tab === "overview" ? 0 : offset,
      }),
    enabled:
      canReadAny &&
      (tab === "overview" || tab === "requests") &&
      hasEdgePermission(permissions, "platform:placement:read"),
  });

  const inventoryQuery = useQuery({
    queryKey: ["edge", "capacity", "inventory", { q, status, offset, tab }],
    queryFn: () =>
      placementApi.listInventory({
        status: status || undefined,
        limit: tab === "overview" ? 100 : LIMIT,
        offset: tab === "overview" ? 0 : offset,
      }),
    enabled:
      canReadAny &&
      (tab === "overview" || tab === "capacity") &&
      hasEdgePermission(permissions, "platform:capacity:read"),
  });

  const reservationsQuery = useQuery({
    queryKey: ["edge", "capacity", "reservations", { status, offset }],
    queryFn: () =>
      placementApi.listReservations({
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "capacity" &&
      hasEdgePermission(permissions, "platform:capacity:read"),
  });

  const policiesQuery = useQuery({
    queryKey: ["edge", "placement", "policies", { q, status, offset }],
    queryFn: () =>
      placementApi.listPolicies({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "policies" &&
      hasEdgePermission(permissions, "platform:placement_policy:read"),
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "placement", "history", "overview"],
    queryFn: () =>
      placementApi.listHistory({
        resourceType: "PLACEMENT_DECISION",
        limit: 10,
        offset: 0,
      }),
    enabled:
      canReadAny &&
      tab === "overview" &&
      hasEdgePermission(permissions, "platform:placement:read"),
  });

  const registryProductsQuery = useQuery({
    queryKey: ["edge", "registry", "products", "placement-select"],
    queryFn: () => edgeApi.listRegistryProducts({ limit: 100 }),
    enabled: canRequest && tab === "requests",
  });

  const [requestForm, setRequestForm] = useState({
    provisioningRequestId: "",
    productRegistryId: "",
    technicalVersionId: "",
    contractId: "",
    deploymentProfileId: "",
    requestedEnvironmentType: "PRODUCTION",
    requestedDeploymentModel: "SHARED_SAAS",
    platformId: "",
    requestedRegion: "",
    capacityCpu: "",
    capacityMemory: "",
    idempotencyKey: newIdempotencyKey(),
  });

  const versionsQuery = useQuery({
    queryKey: [
      "edge",
      "registry",
      "versions",
      "placement",
      requestForm.productRegistryId,
    ],
    queryFn: () =>
      edgeApi.listRegistryProductVersions(requestForm.productRegistryId, {
        limit: 100,
      }),
    enabled: Boolean(requestForm.productRegistryId) && tab === "requests",
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "registry", "contracts", "placement-select"],
    queryFn: () => edgeApi.listRegistryControlContracts({ limit: 100 }),
    enabled: canRequest && tab === "requests",
  });

  const profilesQuery = useQuery({
    queryKey: ["edge", "registry", "profiles", "placement-select"],
    queryFn: () => edgeApi.listRegistryDeploymentProfiles({ limit: 100 }),
    enabled: canRequest && tab === "requests",
  });

  const platformsQuery = useQuery({
    queryKey: ["edge", "registry", "platforms", "placement-select"],
    queryFn: () => edgeApi.listRegistryPlatforms({ limit: 100 }),
    enabled: (canRequest || canManageCapacity) && (tab === "requests" || tab === "capacity"),
  });

  const environmentsQuery = useQuery({
    queryKey: ["edge", "registry", "environments", "placement-select"],
    queryFn: () => edgeApi.listRegistryEnvironments({ limit: 100 }),
    enabled: canManageCapacity && tab === "capacity",
  });

  const [capacityForm, setCapacityForm] = useState({
    platformId: "",
    environmentId: "",
    resourceType: "CPU",
    unit: "cores",
    totalCapacity: "",
    unavailableCapacity: "0",
    validUntil: "",
    capacityStatus: "ACTIVE",
  });

  const [policyForm, setPolicyForm] = useState({
    code: "",
    name: "",
    description: "",
    algorithmVersion: "1.0.0",
    policyStatus: "DRAFT",
  });

  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const invalidate = async (...keys: string[][]) => {
    await Promise.all(
      keys.map((key) =>
        queryClient.invalidateQueries({ queryKey: ["edge", ...key] }),
      ),
    );
  };

  const createRequest = useMutation({
    mutationFn: () => {
      const capacityRequirements: Record<string, number> = {};
      if (requestForm.capacityCpu.trim()) {
        capacityRequirements.CPU = Number(requestForm.capacityCpu);
      }
      if (requestForm.capacityMemory.trim()) {
        capacityRequirements.MEMORY = Number(requestForm.capacityMemory);
      }
      return placementApi.createRequest({
        idempotencyKey: requestForm.idempotencyKey.trim(),
        provisioningRequestId: requestForm.provisioningRequestId.trim(),
        productRegistryId: requestForm.productRegistryId,
        technicalVersionId: requestForm.technicalVersionId,
        contractId: requestForm.contractId,
        deploymentProfileId: requestForm.deploymentProfileId,
        requestedEnvironmentType: requestForm.requestedEnvironmentType,
        requestedDeploymentModel: requestForm.requestedDeploymentModel.trim(),
        platformId: requestForm.platformId || undefined,
        requestedRegion: requestForm.requestedRegion.trim() || undefined,
        capacityRequirements:
          Object.keys(capacityRequirements).length > 0
            ? capacityRequirements
            : undefined,
      });
    },
    onSuccess: async () => {
      setRequestForm({
        provisioningRequestId: "",
        productRegistryId: "",
        technicalVersionId: "",
        contractId: "",
        deploymentProfileId: "",
        requestedEnvironmentType: "PRODUCTION",
        requestedDeploymentModel: "SHARED_SAAS",
        platformId: "",
        requestedRegion: "",
        capacityCpu: "",
        capacityMemory: "",
        idempotencyKey: newIdempotencyKey(),
      });
      setFormError(null);
      await invalidate(["placement", "requests"]);
    },
    onError: (err) => setFormError(placementErrMessage(err)),
  });

  const upsertInventory = useMutation({
    mutationFn: () =>
      placementApi.upsertInventory({
        platformId: capacityForm.platformId,
        environmentId: capacityForm.environmentId,
        resourceType: capacityForm.resourceType,
        unit: capacityForm.unit.trim(),
        totalCapacity: Number(capacityForm.totalCapacity),
        unavailableCapacity: Number(capacityForm.unavailableCapacity || 0),
        validUntil: capacityForm.validUntil.includes("T")
          ? new Date(capacityForm.validUntil).toISOString()
          : capacityForm.validUntil,
        capacityStatus: capacityForm.capacityStatus,
        measurementSource: "DECLARED",
      }),
    onSuccess: async () => {
      setCapacityForm({
        platformId: "",
        environmentId: "",
        resourceType: "CPU",
        unit: "cores",
        totalCapacity: "",
        unavailableCapacity: "0",
        validUntil: "",
        capacityStatus: "ACTIVE",
      });
      setFormError(null);
      await invalidate(["capacity", "inventory"]);
    },
    onError: (err) => setFormError(placementErrMessage(err)),
  });

  const createPolicy = useMutation({
    mutationFn: () =>
      placementApi.createPolicy({
        code: policyForm.code.trim(),
        name: policyForm.name.trim(),
        description: policyForm.description.trim() || undefined,
        algorithmVersion: policyForm.algorithmVersion.trim() || "1.0.0",
        policyStatus: policyForm.policyStatus,
      }),
    onSuccess: async () => {
      setPolicyForm({
        code: "",
        name: "",
        description: "",
        algorithmVersion: "1.0.0",
        policyStatus: "DRAFT",
      });
      setFormError(null);
      await invalidate(["placement", "policies"]);
    },
    onError: (err) => setFormError(placementErrMessage(err)),
  });

  const switchTab = (next: TabId) => {
    setTab(next);
    setOffset(0);
    setQ("");
    setStatus("");
    setFormError(null);
  };

  if (platformLoading) return <PlacementLoading />;
  if (!canReadAny) {
    return (
      <PlacementForbidden description="Placement & Capacity requires platform:placement:read, platform:capacity:read, or platform:placement_policy:read." />
    );
  }

  const registryProducts = unwrapRegistryList<ProductRegistryRecord>(
    registryProductsQuery.data,
  ).items;
  const versions = unwrapRegistryList<ProductTechnicalVersion>(
    versionsQuery.data,
  ).items;
  const contracts = unwrapRegistryList<ProductControlContract>(
    contractsQuery.data,
  ).items;
  const profiles = unwrapRegistryList<DeploymentProfile>(profilesQuery.data)
    .items;
  const platforms = unwrapRegistryList(platformsQuery.data).items as Array<{
    id: string;
    code: string;
    name: string;
  }>;
  const environments = unwrapRegistryList(environmentsQuery.data)
    .items as Array<{
    id: string;
    code: string;
    name: string;
    platformId: string;
  }>;

  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-4)] md:p-[var(--space-6)]">
      <header className="space-y-[var(--space-2)]">
        <p className="type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Ecosystem Management · P7.3 Placement
        </p>
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Placement & Capacity
        </h1>
        <p className="max-w-3xl type-sm text-[var(--text-secondary)]">
          Evaluate placement requests against registry snapshots and live
          capacity inventory. Confirm holds capacity; no free-form tenant-id
          auth substitute.
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

      {formError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {formError}
        </p>
      ) : null}

      {tab === "overview" ? (
        <OverviewTab
          requestsQuery={requestsQuery}
          inventoryQuery={inventoryQuery}
          historyQuery={historyQuery}
        />
      ) : null}

      {tab === "requests" ? (
        <EdgePermissionGate permission="platform:placement:read">
          <RequestsTab
            query={requestsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            q={q}
            status={status}
            onQChange={(value) => {
              setOffset(0);
              setQ(value);
            }}
            onStatusChange={(value) => {
              setOffset(0);
              setStatus(value);
            }}
            canRequest={canRequest}
            canEvaluate={canEvaluate}
            canConfirm={canConfirm}
            canCancel={canCancel}
            requestForm={requestForm}
            setRequestForm={setRequestForm}
            registryProducts={registryProducts}
            versions={versions}
            contracts={contracts}
            profiles={profiles}
            platforms={platforms}
            onCreate={(e) => {
              e.preventDefault();
              createRequest.mutate();
            }}
            creating={createRequest.isPending}
            actionBusyId={actionBusyId}
            onEvaluate={async (id) => {
              setActionBusyId(id);
              setFormError(null);
              try {
                await placementApi.evaluateRequest(id, {
                  idempotencyKey: newIdempotencyKey(),
                });
                await invalidate(["placement", "requests"]);
              } catch (err) {
                setFormError(placementErrMessage(err));
              } finally {
                setActionBusyId(null);
              }
            }}
            onConfirm={async (id) => {
              setActionBusyId(id);
              setFormError(null);
              try {
                await placementApi.confirmRequest(id);
                await invalidate(["placement", "requests"], ["capacity"]);
              } catch (err) {
                setFormError(placementErrMessage(err));
              } finally {
                setActionBusyId(null);
              }
            }}
            onCancel={async (id) => {
              setActionBusyId(id);
              setFormError(null);
              try {
                await placementApi.cancelRequest(id, {
                  reason: "Cancelled from console",
                });
                await invalidate(["placement", "requests"], ["capacity"]);
              } catch (err) {
                setFormError(placementErrMessage(err));
              } finally {
                setActionBusyId(null);
              }
            }}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "capacity" ? (
        <EdgePermissionGate permission="platform:capacity:read">
          <CapacityTab
            inventoryQuery={inventoryQuery}
            reservationsQuery={reservationsQuery}
            offset={offset}
            onOffsetChange={setOffset}
            status={status}
            onStatusChange={(value) => {
              setOffset(0);
              setStatus(value);
            }}
            canManage={canManageCapacity}
            canRelease={canRelease}
            capacityForm={capacityForm}
            setCapacityForm={setCapacityForm}
            platforms={platforms}
            environments={environments}
            onCreate={(e) => {
              e.preventDefault();
              upsertInventory.mutate();
            }}
            creating={upsertInventory.isPending}
            onRelease={async (id, version) => {
              setActionBusyId(id);
              setFormError(null);
              try {
                await placementApi.releaseReservation(id, {
                  expectedVersion: version,
                  reason: "Released from console",
                });
                await invalidate(["capacity"]);
              } catch (err) {
                setFormError(placementErrMessage(err));
              } finally {
                setActionBusyId(null);
              }
            }}
            actionBusyId={actionBusyId}
            onPatchStatus={async (row, nextStatus) => {
              setActionBusyId(row.id);
              setFormError(null);
              try {
                await placementApi.patchInventory(row.id, {
                  expectedVersion: row.version,
                  capacityStatus: nextStatus,
                });
                await invalidate(["capacity", "inventory"]);
              } catch (err) {
                setFormError(placementErrMessage(err));
              } finally {
                setActionBusyId(null);
              }
            }}
          />
        </EdgePermissionGate>
      ) : null}

      {tab === "policies" ? (
        <EdgePermissionGate permission="platform:placement_policy:read">
          <PoliciesTab
            query={policiesQuery}
            offset={offset}
            onOffsetChange={setOffset}
            q={q}
            status={status}
            onQChange={(value) => {
              setOffset(0);
              setQ(value);
            }}
            onStatusChange={(value) => {
              setOffset(0);
              setStatus(value);
            }}
            canManage={canManagePolicy}
            policyForm={policyForm}
            setPolicyForm={setPolicyForm}
            onCreate={(e) => {
              e.preventDefault();
              createPolicy.mutate();
            }}
            creating={createPolicy.isPending}
            onActivate={async (row) => {
              setActionBusyId(row.id);
              setFormError(null);
              try {
                await placementApi.patchPolicy(row.id, {
                  expectedVersion: row.version,
                  policyStatus: "ACTIVE",
                });
                await invalidate(["placement", "policies"]);
              } catch (err) {
                setFormError(placementErrMessage(err));
              } finally {
                setActionBusyId(null);
              }
            }}
            actionBusyId={actionBusyId}
          />
        </EdgePermissionGate>
      ) : null}
    </div>
  );
}

function OverviewTab({
  requestsQuery,
  inventoryQuery,
  historyQuery,
}: {
  requestsQuery: ReturnType<typeof useQuery>;
  inventoryQuery: ReturnType<typeof useQuery>;
  historyQuery: ReturnType<typeof useQuery>;
}) {
  if (requestsQuery.isLoading || inventoryQuery.isLoading) {
    return <PlacementLoading label="Loading overview…" />;
  }
  if (requestsQuery.isError) {
    return (
      <PlacementError
        description={placementErrMessage(requestsQuery.error)}
        onRetry={() => void requestsQuery.refetch()}
      />
    );
  }

  const requests = unwrapPlacementList<PlacementRequestRecord>(
    requestsQuery.data,
  );
  const inventory = unwrapPlacementList<CapacityInventoryRecord>(
    inventoryQuery.data,
  );
  const history = unwrapPlacementList<PlacementHistoryEntry>(historyQuery.data);

  const counts: Record<string, number> = {};
  for (const r of requests.items) {
    counts[r.requestStatus] = (counts[r.requestStatus] ?? 0) + 1;
  }
  const requiresReview = counts.REQUIRES_REVIEW ?? 0;
  const noCapacity = counts.NO_CAPACITY ?? 0;

  const utilRows = inventory.items.slice(0, 8);

  return (
    <section className="space-y-[var(--space-5)]">
      <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total requests" value={String(requests.total)} />
        <StatCard label="Requires review" value={String(requiresReview)} />
        <StatCard label="No capacity" value={String(noCapacity)} />
        <StatCard
          label="Inventory rows"
          value={String(inventory.total)}
        />
      </div>

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <div className="space-y-[var(--space-3)]">
          <h2 className="type-md font-semibold">Status counts</h2>
          {Object.keys(counts).length === 0 ? (
            <PlacementEmpty
              title="No placement requests"
              description="Create a request from the Requests tab once a provisioning authorization is ready."
            />
          ) : (
            <PlacementTableShell headers={["Status", "Count"]}>
              {Object.entries(counts).map(([s, n]) => (
                <tr key={s} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">
                    <PlacementStatusBadge status={s} />
                  </td>
                  <td className="px-3 py-2">{n}</td>
                </tr>
              ))}
            </PlacementTableShell>
          )}
        </div>

        <div className="space-y-[var(--space-3)]">
          <h2 className="type-md font-semibold">Utilization summary</h2>
          {inventoryQuery.isError ? (
            <PlacementError
              description={placementErrMessage(inventoryQuery.error)}
              onRetry={() => void inventoryQuery.refetch()}
            />
          ) : utilRows.length === 0 ? (
            <PlacementEmpty
              title="No capacity inventory"
              description="Declare inventory before evaluating placement holds."
            />
          ) : (
            <div className="space-y-[var(--space-3)]">
              {utilRows.map((row) => (
                <CapacityMeter
                  key={row.id}
                  label={`${row.resourceType} · ${shortId(row.environmentId)}`}
                  totalCapacity={row.totalCapacity}
                  reservedCapacity={row.reservedCapacity}
                  allocatedCapacity={row.allocatedCapacity}
                  availableCapacity={row.availableCapacity}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Recent decisions</h2>
        {historyQuery.isLoading ? (
          <PlacementLoading label="Loading decisions…" />
        ) : historyQuery.isError ? (
          <PlacementError
            description={placementErrMessage(historyQuery.error)}
            onRetry={() => void historyQuery.refetch()}
          />
        ) : history.items.length === 0 ? (
          <PlacementEmpty
            title="No decisions yet"
            description="Evaluate a placement request to produce a decision record."
          />
        ) : (
          <PlacementTableShell
            headers={["When", "Decision", "Action", "From → To"]}
          >
            {history.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2 type-xs">
                  {formatPlacementDate(row.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/capacity/decisions/${row.resourceId}`}
                    className="font-mono type-xs text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {shortId(row.resourceId)}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.action}</td>
                <td className="px-3 py-2 type-xs">
                  {row.fromStatus ?? "—"} → {row.toStatus ?? "—"}
                </td>
              </tr>
            ))}
          </PlacementTableShell>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-4)]">
      <p className="type-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 type-xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function RequestsTab({
  query,
  offset,
  onOffsetChange,
  q,
  status,
  onQChange,
  onStatusChange,
  canRequest,
  canEvaluate,
  canConfirm,
  canCancel,
  requestForm,
  setRequestForm,
  registryProducts,
  versions,
  contracts,
  profiles,
  platforms,
  onCreate,
  creating,
  actionBusyId,
  onEvaluate,
  onConfirm,
  onCancel,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  q: string;
  status: string;
  onQChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  canRequest: boolean;
  canEvaluate: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  requestForm: {
    provisioningRequestId: string;
    productRegistryId: string;
    technicalVersionId: string;
    contractId: string;
    deploymentProfileId: string;
    requestedEnvironmentType: string;
    requestedDeploymentModel: string;
    platformId: string;
    requestedRegion: string;
    capacityCpu: string;
    capacityMemory: string;
    idempotencyKey: string;
  };
  setRequestForm: Dispatch<SetStateAction<typeof requestForm>>;
  registryProducts: ProductRegistryRecord[];
  versions: ProductTechnicalVersion[];
  contracts: ProductControlContract[];
  profiles: DeploymentProfile[];
  platforms: Array<{ id: string; code: string; name: string }>;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
  actionBusyId: string | null;
  onEvaluate: (id: string) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const list = unwrapPlacementList<PlacementRequestRecord>(query.data);

  return (
    <section className="space-y-[var(--space-4)]">
      <PlacementFilters
        q={q}
        status={status}
        statusOptions={PLACEMENT_REQUEST_STATUS_OPTIONS}
        onQChange={onQChange}
        onStatusChange={onStatusChange}
        searchLabel="Search placement requests"
      />

      {canRequest ? (
        <form
          noValidate
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Create placement request
          </p>
          <p className="type-xs text-[var(--text-muted)] md:col-span-2">
            Commercial identity comes from the provisioning authorization view.
            Do not supply a free-form tenant-id.
          </p>
          <input
            className={fieldControlClass}
            required
            placeholder="Provisioning request ID (UUID)"
            value={requestForm.provisioningRequestId}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                provisioningRequestId: e.target.value,
              }))
            }
            aria-label="Provisioning request ID"
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Idempotency key"
            value={requestForm.idempotencyKey}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                idempotencyKey: e.target.value,
              }))
            }
            aria-label="Idempotency key"
          />
          <select
            className={fieldControlClass}
            required
            value={requestForm.productRegistryId}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                productRegistryId: e.target.value,
                technicalVersionId: "",
              }))
            }
            aria-label="Product registry"
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
            value={requestForm.technicalVersionId}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                technicalVersionId: e.target.value,
              }))
            }
            aria-label="Technical version"
          >
            <option value="">Technical version…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.technicalVersion}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={requestForm.contractId}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                contractId: e.target.value,
              }))
            }
            aria-label="Control contract"
          >
            <option value="">Control contract…</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractCode}@{c.contractVersion}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            required
            value={requestForm.deploymentProfileId}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                deploymentProfileId: e.target.value,
              }))
            }
            aria-label="Deployment profile"
          >
            <option value="">Deployment profile…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            value={requestForm.requestedEnvironmentType}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                requestedEnvironmentType: e.target.value,
              }))
            }
            aria-label="Environment type"
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
            placeholder="Deployment model"
            value={requestForm.requestedDeploymentModel}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                requestedDeploymentModel: e.target.value,
              }))
            }
            aria-label="Deployment model"
          />
          <select
            className={fieldControlClass}
            value={requestForm.platformId}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                platformId: e.target.value,
              }))
            }
            aria-label="Preferred platform"
          >
            <option value="">Preferred platform (optional)…</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
          <input
            className={fieldControlClass}
            placeholder="Requested region (optional)"
            value={requestForm.requestedRegion}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                requestedRegion: e.target.value,
              }))
            }
          />
          <input
            className={fieldControlClass}
            placeholder="CPU requirement"
            inputMode="decimal"
            value={requestForm.capacityCpu}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                capacityCpu: e.target.value,
              }))
            }
            aria-label="CPU requirement"
          />
          <input
            className={fieldControlClass}
            placeholder="Memory requirement"
            inputMode="decimal"
            value={requestForm.capacityMemory}
            onChange={(e) =>
              setRequestForm((prev) => ({
                ...prev,
                capacityMemory: e.target.value,
              }))
            }
            aria-label="Memory requirement"
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create request"}
            </Button>
          </div>
        </form>
      ) : null}

      {query.isLoading ? (
        <PlacementLoading label="Loading requests…" />
      ) : query.isError ? (
        <PlacementError
          description={placementErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <PlacementEmpty
          title="No placement requests"
          description="Create a request linked to an accepted provisioning authorization and registry refs."
        />
      ) : (
        <>
          <PlacementTableShell
            headers={[
              "ID",
              "Status",
              "Provisioning",
              "Registry",
              "Updated",
              "Actions",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/capacity/requests/${row.id}`}
                    className="font-mono type-xs text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {shortId(row.id)}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <PlacementStatusBadge status={row.requestStatus} />
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {shortId(row.provisioningRequestId)}
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {shortId(row.productRegistryId)}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {formatPlacementDate(row.updatedAt)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {canEvaluate ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionBusyId === row.id}
                        onClick={() => onEvaluate(row.id)}
                      >
                        Evaluate
                      </Button>
                    ) : null}
                    {canConfirm ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionBusyId === row.id}
                        onClick={() => onConfirm(row.id)}
                      >
                        Confirm
                      </Button>
                    ) : null}
                    {canCancel ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionBusyId === row.id}
                        onClick={() => onCancel(row.id)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </PlacementTableShell>
          <PlacementPagination
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

function CapacityTab({
  inventoryQuery,
  reservationsQuery,
  offset,
  onOffsetChange,
  status,
  onStatusChange,
  canManage,
  canRelease,
  capacityForm,
  setCapacityForm,
  platforms,
  environments,
  onCreate,
  creating,
  onRelease,
  actionBusyId,
  onPatchStatus,
}: {
  inventoryQuery: ReturnType<typeof useQuery>;
  reservationsQuery: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  status: string;
  onStatusChange: (v: string) => void;
  canManage: boolean;
  canRelease: boolean;
  capacityForm: {
    platformId: string;
    environmentId: string;
    resourceType: string;
    unit: string;
    totalCapacity: string;
    unavailableCapacity: string;
    validUntil: string;
    capacityStatus: string;
  };
  setCapacityForm: Dispatch<SetStateAction<typeof capacityForm>>;
  platforms: Array<{ id: string; code: string; name: string }>;
  environments: Array<{
    id: string;
    code: string;
    name: string;
    platformId: string;
  }>;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
  onRelease: (id: string, version: number) => void;
  actionBusyId: string | null;
  onPatchStatus: (row: CapacityInventoryRecord, next: string) => void;
}) {
  const inventory = unwrapPlacementList<CapacityInventoryRecord>(
    inventoryQuery.data,
  );
  const reservations = unwrapPlacementList<CapacityReservationRecord>(
    reservationsQuery.data,
  );
  const filteredEnvs = capacityForm.platformId
    ? environments.filter((e) => e.platformId === capacityForm.platformId)
    : environments;

  return (
    <section className="space-y-[var(--space-5)]">
      <PlacementFilters
        q=""
        status={status}
        statusOptions={CAPACITY_INVENTORY_STATUS_OPTIONS}
        onQChange={() => undefined}
        onStatusChange={onStatusChange}
        searchLabel="Search capacity"
        extra={
          <span className="type-xs text-[var(--text-muted)]">
            Filter inventory / reservations by status
          </span>
        }
      />

      {canManage ? (
        <form
          noValidate
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Upsert capacity inventory
          </p>
          <select
            className={fieldControlClass}
            required
            value={capacityForm.platformId}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                platformId: e.target.value,
                environmentId: "",
              }))
            }
            aria-label="Capacity platform"
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
            value={capacityForm.environmentId}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                environmentId: e.target.value,
              }))
            }
            aria-label="Capacity environment"
          >
            <option value="">Environment…</option>
            {filteredEnvs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code}
              </option>
            ))}
          </select>
          <select
            className={fieldControlClass}
            value={capacityForm.resourceType}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                resourceType: e.target.value,
              }))
            }
            aria-label="Resource type"
          >
            {CAPACITY_RESOURCE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className={fieldControlClass}
            required
            placeholder="Unit"
            value={capacityForm.unit}
            onChange={(e) =>
              setCapacityForm((prev) => ({ ...prev, unit: e.target.value }))
            }
            aria-label="Unit"
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Total capacity"
            inputMode="decimal"
            value={capacityForm.totalCapacity}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                totalCapacity: e.target.value,
              }))
            }
            aria-label="Total capacity"
          />
          <input
            className={fieldControlClass}
            placeholder="Unavailable"
            inputMode="decimal"
            value={capacityForm.unavailableCapacity}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                unavailableCapacity: e.target.value,
              }))
            }
          />
          <input
            className={fieldControlClass}
            required
            type="datetime-local"
            value={capacityForm.validUntil}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                validUntil: e.target.value,
              }))
            }
            aria-label="Valid until"
          />
          <select
            className={fieldControlClass}
            value={capacityForm.capacityStatus}
            onChange={(e) =>
              setCapacityForm((prev) => ({
                ...prev,
                capacityStatus: e.target.value,
              }))
            }
          >
            {CAPACITY_INVENTORY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Saving…" : "Save inventory"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Inventory</h2>
        {inventoryQuery.isLoading ? (
          <PlacementLoading label="Loading inventory…" />
        ) : inventoryQuery.isError ? (
          <PlacementError
            description={placementErrMessage(inventoryQuery.error)}
            onRetry={() => void inventoryQuery.refetch()}
          />
        ) : inventory.items.length === 0 ? (
          <PlacementEmpty
            title="No inventory rows"
            description="Upsert capacity inventory for a platform environment before placing."
          />
        ) : (
          <>
            <PlacementTableShell
              headers={[
                "Resource",
                "Platform / Env",
                "Total",
                "Reserved",
                "Allocated",
                "Available",
                "Freshness",
                "Utilization",
                "Actions",
              ]}
            >
              {inventory.items.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
                >
                  <td className="px-3 py-2">
                    {row.resourceType}
                    <div className="type-xs text-[var(--text-muted)]">
                      {row.unit}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono type-xs">
                    {shortId(row.platformId)}
                    <br />
                    {shortId(row.environmentId)}
                  </td>
                  <td className="px-3 py-2">{row.totalCapacity}</td>
                  <td className="px-3 py-2">{row.reservedCapacity}</td>
                  <td className="px-3 py-2">{row.allocatedCapacity}</td>
                  <td className="px-3 py-2">{row.availableCapacity}</td>
                  <td className="px-3 py-2">
                    <CapacityFreshnessBadge
                      validUntil={row.validUntil}
                      capacityStatus={row.capacityStatus}
                    />
                    <div className="mt-1 type-xs text-[var(--text-muted)]">
                      until {formatPlacementDate(row.validUntil)}
                    </div>
                  </td>
                  <td className="px-3 py-2 min-w-[8rem]">
                    <CapacityMeter
                      totalCapacity={row.totalCapacity}
                      reservedCapacity={row.reservedCapacity}
                      allocatedCapacity={row.allocatedCapacity}
                      availableCapacity={row.availableCapacity}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {canManage && row.capacityStatus === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionBusyId === row.id}
                        onClick={() => onPatchStatus(row, "SUSPENDED")}
                      >
                        Suspend
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </PlacementTableShell>
            <PlacementPagination
              offset={offset}
              limit={LIMIT}
              total={inventory.total}
              onOffsetChange={onOffsetChange}
            />
          </>
        )}
      </div>

      <div className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Reservations</h2>
        <select
          className={fieldControlClass}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter reservations by status"
        >
          <option value="">All reservation statuses</option>
          {CAPACITY_RESERVATION_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {reservationsQuery.isLoading ? (
          <PlacementLoading label="Loading reservations…" />
        ) : reservationsQuery.isError ? (
          <PlacementError
            description={placementErrMessage(reservationsQuery.error)}
            onRetry={() => void reservationsQuery.refetch()}
          />
        ) : reservations.items.length === 0 ? (
          <PlacementEmpty
            title="No reservations"
            description="Successful evaluations create HELD reservations until confirm or cancel."
          />
        ) : (
          <PlacementTableShell
            headers={[
              "ID",
              "Status",
              "Request",
              "Expires",
              "Quantities",
              "Actions",
            ]}
          >
            {reservations.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2 font-mono type-xs">
                  {shortId(row.id)}
                </td>
                <td className="px-3 py-2">
                  <PlacementStatusBadge status={row.reservationStatus} />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/capacity/requests/${row.placementRequestId}`}
                    className="font-mono type-xs text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {shortId(row.placementRequestId)}
                  </Link>
                </td>
                <td className="px-3 py-2 type-xs">
                  {formatPlacementDate(row.expiresAt)}
                </td>
                <td className="px-3 py-2 type-xs font-mono">
                  {JSON.stringify(
                    redactPlacementMetadata(
                      row.resourceQuantities as Record<string, unknown>,
                    ),
                  )}
                </td>
                <td className="px-3 py-2">
                  {canRelease && row.reservationStatus === "HELD" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionBusyId === row.id}
                      onClick={() => onRelease(row.id, row.version)}
                    >
                      Release
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </PlacementTableShell>
        )}
      </div>
    </section>
  );
}

function PoliciesTab({
  query,
  offset,
  onOffsetChange,
  q,
  status,
  onQChange,
  onStatusChange,
  canManage,
  policyForm,
  setPolicyForm,
  onCreate,
  creating,
  onActivate,
  actionBusyId,
}: {
  query: ReturnType<typeof useQuery>;
  offset: number;
  onOffsetChange: (n: number) => void;
  q: string;
  status: string;
  onQChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  canManage: boolean;
  policyForm: {
    code: string;
    name: string;
    description: string;
    algorithmVersion: string;
    policyStatus: string;
  };
  setPolicyForm: Dispatch<SetStateAction<typeof policyForm>>;
  onCreate: (e: FormEvent) => void;
  creating: boolean;
  onActivate: (row: PlacementPolicyRecord) => void;
  actionBusyId: string | null;
}) {
  const list = unwrapPlacementList<PlacementPolicyRecord>(query.data);

  return (
    <section className="space-y-[var(--space-4)]">
      <PlacementFilters
        q={q}
        status={status}
        statusOptions={PLACEMENT_POLICY_STATUS_OPTIONS}
        onQChange={onQChange}
        onStatusChange={onStatusChange}
        searchLabel="Search policies"
      />

      {canManage ? (
        <form
          noValidate
          onSubmit={onCreate}
          className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
        >
          <p className="type-sm font-semibold md:col-span-2">
            Create placement policy
          </p>
          <input
            className={fieldControlClass}
            required
            placeholder="Code"
            value={policyForm.code}
            onChange={(e) =>
              setPolicyForm((prev) => ({ ...prev, code: e.target.value }))
            }
            aria-label="Policy code"
          />
          <input
            className={fieldControlClass}
            required
            placeholder="Name"
            value={policyForm.name}
            onChange={(e) =>
              setPolicyForm((prev) => ({ ...prev, name: e.target.value }))
            }
            aria-label="Policy name"
          />
          <input
            className={fieldControlClass}
            placeholder="Description"
            value={policyForm.description}
            onChange={(e) =>
              setPolicyForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
          <input
            className={fieldControlClass}
            placeholder="Algorithm version"
            value={policyForm.algorithmVersion}
            onChange={(e) =>
              setPolicyForm((prev) => ({
                ...prev,
                algorithmVersion: e.target.value,
              }))
            }
          />
          <select
            className={fieldControlClass}
            value={policyForm.policyStatus}
            onChange={(e) =>
              setPolicyForm((prev) => ({
                ...prev,
                policyStatus: e.target.value,
              }))
            }
            aria-label="Policy status"
          >
            {PLACEMENT_POLICY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create policy"}
            </Button>
          </div>
        </form>
      ) : null}

      {query.isLoading ? (
        <PlacementLoading label="Loading policies…" />
      ) : query.isError ? (
        <PlacementError
          description={placementErrMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : list.items.length === 0 ? (
        <PlacementEmpty
          title="No placement policies"
          description="Create a policy to drive hard constraints and scoring weights."
        />
      ) : (
        <>
          <PlacementTableShell
            headers={[
              "Code",
              "Name",
              "Version",
              "Status",
              "Algorithm",
              "Actions",
            ]}
          >
            {list.items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-3 py-2 font-medium">{row.code}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.policyVersion}</td>
                <td className="px-3 py-2">
                  <PlacementStatusBadge status={row.policyStatus} />
                </td>
                <td className="px-3 py-2 type-xs">{row.algorithmVersion}</td>
                <td className="px-3 py-2">
                  {canManage && row.policyStatus === "DRAFT" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionBusyId === row.id}
                      onClick={() => onActivate(row)}
                    >
                      Activate
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </PlacementTableShell>
          <PlacementPagination
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
