"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import {
  EdgeStudioShell,
  useStudioSectionParam,
  type StudioSectionGroup,
} from "@/components/edge/studio";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function errMessage(err: unknown): string {
  if (err instanceof EdgeApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

type TabId = "segments" | "profiles" | "models" | "contracts";

const TABS: { id: TabId; label: string }[] = [
  { id: "segments", label: "Segments" },
  { id: "profiles", label: "Business profiles" },
  { id: "models", label: "Operating models" },
  { id: "contracts", label: "Integration contracts" },
];

const MARKET_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const MARKET_STUDIO_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "Taxonomy", itemIds: ["segments"] },
  { title: "Profiles", itemIds: ["profiles", "models"] },
  { title: "Contracts", itemIds: ["contracts"] },
];

export default function EdgeMarketsPage() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading markets studio…" />}>
      <EdgeMarketsStudio />
    </Suspense>
  );
}

function EdgeMarketsStudio() {
  const queryClient = useQueryClient();
  const { permissions, activeVerticalId } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasAnyEdgePermission(permissions, [
      "platform:taxonomy:read",
      "platform:profiles:manage",
      "platform:contracts:manage",
    ]);
  const canManageTaxonomy =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:taxonomy:manage");
  const canProfiles =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:profiles:manage");
  const canContracts =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:contracts:manage");

  const [tab, setTab] = useStudioSectionParam<TabId>("segments", MARKET_SECTION_IDS);

  const studioGroups: StudioSectionGroup[] = useMemo(
    () =>
      MARKET_STUDIO_GROUPS.map((g) => ({
        title: g.title,
        items: g.itemIds.map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return { id: t.id, label: t.label };
        }),
      })),
    [],
  );
  const [verticalId, setVerticalId] = useState(activeVerticalId ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [profileCode, setProfileCode] = useState("");
  const [profileName, setProfileName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [modelName, setModelName] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [contractName, setContractName] = useState("");
  const [contractVersion, setContractVersion] = useState("1.0.0");

  useEffect(() => {
    if (!verticalId && activeVerticalId) setVerticalId(activeVerticalId);
  }, [activeVerticalId, verticalId]);

  const verticalsQuery = useQuery({
    queryKey: ["edge", "verticals", "markets"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listVerticals("page=1&limit=100");
      return data ?? [];
    },
  });

  const segmentsQuery = useQuery({
    queryKey: ["edge", "market-segments", verticalId],
    enabled: allowed && Boolean(verticalId) && tab === "segments",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketSegments(verticalId);
      return data ?? [];
    },
  });

  const profilesQuery = useQuery({
    queryKey: ["edge", "business-profiles", verticalId],
    enabled: canProfiles && Boolean(verticalId) && tab === "profiles",
    queryFn: async () => {
      const { data } = await edgeApi.listBusinessProfiles(verticalId);
      return data ?? [];
    },
  });

  const modelsQuery = useQuery({
    queryKey: ["edge", "operating-models", verticalId],
    enabled: canProfiles && Boolean(verticalId) && tab === "models",
    queryFn: async () => {
      const { data } = await edgeApi.listOperatingModels(verticalId);
      return data ?? [];
    },
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "integration-contracts"],
    enabled: canContracts && tab === "contracts",
    queryFn: async () => {
      const { data } = await edgeApi.listIntegrationContracts();
      return Array.isArray(data) ? data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketSegment({
        code: code.trim(),
        name: name.trim(),
        verticalId,
      }),
    onSuccess: async () => {
      setCode("");
      setName("");
      setCreateError(null);
      setMsg("Segment created.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "market-segments", verticalId],
      });
    },
    onError: (err) => setCreateError(errMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) throw new Error("No segment selected");
      return edgeApi.updateMarketSegment(editId, {
        name: editName.trim() || undefined,
        status: editStatus.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setEditId(null);
      setMsg("Segment updated.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "market-segments", verticalId],
      });
    },
    onError: (err) => setCreateError(errMessage(err)),
  });

  const createProfile = useMutation({
    mutationFn: async () =>
      edgeApi.createBusinessProfile({
        code: profileCode.trim(),
        name: profileName.trim(),
        verticalId,
      }),
    onSuccess: async () => {
      setProfileCode("");
      setProfileName("");
      setMsg("Business profile created.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "business-profiles", verticalId],
      });
    },
    onError: (err) => setCreateError(errMessage(err)),
  });

  const createModel = useMutation({
    mutationFn: async () =>
      edgeApi.createOperatingModel({
        code: modelCode.trim(),
        name: modelName.trim(),
        verticalId,
      }),
    onSuccess: async () => {
      setModelCode("");
      setModelName("");
      setMsg("Operating model created.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "operating-models", verticalId],
      });
    },
    onError: (err) => setCreateError(errMessage(err)),
  });

  const createContract = useMutation({
    mutationFn: async () =>
      edgeApi.createIntegrationContract({
        code: contractCode.trim(),
        name: contractName.trim(),
        version: contractVersion.trim() || "1.0.0",
      }),
    onSuccess: async () => {
      setContractCode("");
      setContractName("");
      setContractVersion("1.0.0");
      setMsg("Integration contract created.");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "integration-contracts"],
      });
    },
    onError: (err) => setCreateError(errMessage(err)),
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:taxonomy:read (or profiles/contracts manage)." />
    );
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!verticalId || !code.trim() || !name.trim()) {
      setCreateError("Vertical, code, and name are required.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <EdgeStudioShell
      title="Markets studio"
      description="Segments, business profiles, operating models, and integration contracts."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => setTab(id as TabId)}
      actions={
        <>
          {msg ? <p className="type-sm text-[var(--success)]">{msg}</p> : null}
          {createError ? (
            <p role="alert" className="type-sm text-[var(--danger)]">
              {createError}
            </p>
          ) : null}
        </>
      }
    >

      {tab !== "contracts" ? (
        <label className="block max-w-md space-y-1">
          <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Vertical
          </span>
          <select
            className={fieldControlClass}
            value={verticalId}
            onChange={(e) => setVerticalId(e.target.value)}
            disabled={verticalsQuery.isLoading}
          >
            <option value="">Select vertical…</option>
            {(verticalsQuery.data ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.displayName ?? v.name ?? v.code ?? v.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {tab === "segments" ? (
        <>
          {!verticalId ? (
            <EdgeEmptyState
              title="Choose a vertical"
              description="Market segments are listed per vertical."
            />
          ) : null}
          {verticalId && segmentsQuery.isLoading ? <EdgeLoadingState /> : null}
          {verticalId && segmentsQuery.isError ? (
            <EdgeErrorState
              description={errMessage(segmentsQuery.error)}
              onRetry={() => void segmentsQuery.refetch()}
            />
          ) : null}
          {verticalId &&
          segmentsQuery.isSuccess &&
          !segmentsQuery.data.length ? (
            <EdgeEmptyState
              title="No segments"
              description="Create a market segment for this vertical."
            />
          ) : null}
          {verticalId && segmentsQuery.data?.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
              {segmentsQuery.data.map((segment) => (
                <li
                  key={segment.id}
                  className="space-y-2 px-[var(--space-4)] py-[var(--space-3)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>
                      <span className="block font-medium text-[var(--text-primary)]">
                        {segment.name}
                      </span>
                      <span className="type-xs text-[var(--text-muted)]">
                        {[segment.code, segment.status]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge>{segment.status ?? "—"}</Badge>
                      {canManageTaxonomy ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditId(segment.id);
                            setEditName(segment.name ?? "");
                            setEditStatus(String(segment.status ?? ""));
                          }}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {editId === segment.id ? (
                    <form
                      className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateMutation.mutate();
                      }}
                    >
                      <input
                        className={fieldControlClass}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                      />
                      <input
                        className={fieldControlClass}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        placeholder="Status"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          <EdgePermissionGate permission="platform:taxonomy:manage">
            {canManageTaxonomy && verticalId ? (
              <form
                onSubmit={onCreate}
                className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]"
              >
                <h2 className="type-sm font-semibold text-[var(--text-primary)]">
                  Create segment
                </h2>
                <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Code
                    </span>
                    <input
                      className={fieldControlClass}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Name
                    </span>
                    <input
                      className={fieldControlClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating…" : "Add segment"}
                </Button>
              </form>
            ) : null}
          </EdgePermissionGate>
        </>
      ) : null}

      {tab === "profiles" ? (
        <section className="space-y-4">
          {!canProfiles ? (
            <EdgeForbiddenState description="Requires platform:profiles:manage." />
          ) : !verticalId ? (
            <EdgeEmptyState title="Choose a vertical" description="Required." />
          ) : (
            <>
              {profilesQuery.isLoading ? <EdgeLoadingState /> : null}
              <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                {(profilesQuery.data ?? []).map((p) => (
                  <li key={p.id} className="px-4 py-3 type-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="type-xs text-[var(--text-muted)]">
                      {" "}
                      · {p.code}
                    </span>
                  </li>
                ))}
              </ul>
              {!profilesQuery.data?.length && profilesQuery.isSuccess ? (
                <EdgeEmptyState
                  title="No profiles"
                  description="Create a business profile for this vertical."
                />
              ) : null}
              <form
                className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  createProfile.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Code"
                  value={profileCode}
                  onChange={(e) => setProfileCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createProfile.isPending}>
                  Create profile
                </Button>
              </form>
            </>
          )}
        </section>
      ) : null}

      {tab === "models" ? (
        <section className="space-y-4">
          {!canProfiles ? (
            <EdgeForbiddenState description="Requires platform:profiles:manage." />
          ) : !verticalId ? (
            <EdgeEmptyState title="Choose a vertical" description="Required." />
          ) : (
            <>
              {modelsQuery.isLoading ? <EdgeLoadingState /> : null}
              <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                {(modelsQuery.data ?? []).map((m) => (
                  <li key={m.id} className="px-4 py-3 type-sm">
                    <span className="font-medium">{m.name}</span>
                    <span className="type-xs text-[var(--text-muted)]">
                      {" "}
                      · {m.code}
                    </span>
                  </li>
                ))}
              </ul>
              <form
                className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  createModel.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Code"
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createModel.isPending}>
                  Create operating model
                </Button>
              </form>
            </>
          )}
        </section>
      ) : null}

      {tab === "contracts" ? (
        <section className="space-y-4">
          {!canContracts ? (
            <EdgeForbiddenState description="Requires platform:contracts:manage." />
          ) : (
            <>
              {contractsQuery.isLoading ? <EdgeLoadingState /> : null}
              <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
                {(contractsQuery.data ?? []).map((c, i) => {
                  const row = c as Record<string, unknown>;
                  const id = String(row.id ?? i);
                  return (
                    <li key={id} className="px-4 py-3 type-sm">
                      <span className="font-medium">
                        {String(row.name ?? row.code ?? id)}
                      </span>
                      <span className="type-xs text-[var(--text-muted)]">
                        {" "}
                        · {String(row.version ?? "")} ·{" "}
                        {String(row.status ?? "")}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {!contractsQuery.data?.length && contractsQuery.isSuccess ? (
                <EdgeEmptyState
                  title="No contracts"
                  description="Register an integration contract for BB compatibility."
                />
              ) : null}
              <form
                className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createContract.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Code"
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Name"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Version"
                  value={contractVersion}
                  onChange={(e) => setContractVersion(e.target.value)}
                  required
                />
                <Button type="submit" disabled={createContract.isPending}>
                  Create contract
                </Button>
              </form>
            </>
          )}
        </section>
      ) : null}
    </EdgeStudioShell>
  );
}
