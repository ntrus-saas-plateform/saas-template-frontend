"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { edgeApi } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgeSession } from "@/providers/edge-session-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  OperationsOverview,
  PlatformServiceRecord,
  ServiceCatalogListPage,
} from "@/types/edge-platform-operations";
import { EdgeEmptyState, EdgeErrorState, EdgeLoadingState } from "@/components/edge/states";

function unwrapPage(data: unknown): ServiceCatalogListPage {
  const raw = data as { data?: ServiceCatalogListPage } | ServiceCatalogListPage | undefined;
  if (raw && typeof raw === "object" && "items" in raw) return raw;
  if (raw && typeof raw === "object" && "data" in raw && raw.data) return raw.data;
  return { items: [], total: 0 };
}

function unwrapOverview(data: unknown): OperationsOverview | null {
  const raw = data as { data?: OperationsOverview } | OperationsOverview | undefined;
  if (!raw) return null;
  if ("catalog" in raw) return raw;
  if ("data" in raw && raw.data) return raw.data;
  return null;
}

export function EdgeOperationsModule() {
  const { permissions } = useEdgeSession();
  const qc = useQueryClient();
  const canRead = hasEdgePermission(permissions, "platform:service_catalog:read");
  const canManage = hasEdgePermission(permissions, "platform:service_catalog:manage");
  const canOverview = hasEdgePermission(permissions, "platform:operations:overview:read");

  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    serviceCode: "",
    displayName: "",
    category: "CONTROL_PLANE",
    environment: "PRODUCTION",
  });

  const overviewQ = useQuery({
    queryKey: ["p9", "overview"],
    queryFn: () => edgeApi.getOperationsOverview(),
    enabled: canOverview,
  });

  const servicesQ = useQuery({
    queryKey: ["p9", "services", q],
    queryFn: () => edgeApi.listPlatformServices({ q: q || undefined, limit: 50 }),
    enabled: canRead,
  });

  const register = useMutation({
    mutationFn: () =>
      edgeApi.registerPlatformService({
        serviceCode: form.serviceCode.trim(),
        displayName: form.displayName.trim(),
        category: form.category,
        environment: form.environment,
        observationStatus: "CONFIGURED",
      }),
    onSuccess: () => {
      setForm({
        serviceCode: "",
        displayName: "",
        category: "CONTROL_PLANE",
        environment: "PRODUCTION",
      });
      void qc.invalidateQueries({ queryKey: ["p9"] });
    },
  });

  const overview = unwrapOverview(overviewQ.data);
  const page = unwrapPage(servicesQ.data);
  const services: PlatformServiceRecord[] = page.items;

  const observationHint = useMemo(() => {
    if (!overview) return null;
    return overview.note;
  }, [overview]);

  if (!canRead && !canOverview) {
    return (
      <EdgeEmptyState
        title="Operations access required"
        description="Missing platform:service_catalog:read or platform:operations:overview:read"
      />
    );
  }

  return (
    <div className="space-y-8" data-testid="edge-operations-module">
      {canOverview ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Operations overview</h2>
          {overviewQ.isLoading ? <EdgeLoadingState /> : null}
          {overviewQ.isError ? (
            <EdgeErrorState
              title="Overview unavailable"
              description={(overviewQ.error as Error).message}
            />
          ) : null}
          {overview ? (
            <div className="space-y-2 text-sm">
              <p className="text-[var(--text-muted)]">{observationHint}</p>
              <div className="flex flex-wrap gap-3">
                <Badge>Catalog services: {overview.catalog.totalServices}</Badge>
                <Badge tone="warning">
                  Incidents: {overview.activeIncidents.availability}
                </Badge>
                <Badge tone="warning">Alerts: {overview.activeAlerts.availability}</Badge>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {canRead ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grow">
              <label className="type-xs text-[var(--text-muted)]" htmlFor="p9-service-q">
                Search services
              </label>
              <input
                id="p9-service-q"
                className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="code, name…"
              />
            </div>
          </div>
          {servicesQ.isLoading ? <EdgeLoadingState /> : null}
          {servicesQ.isError ? (
            <EdgeErrorState
              title="Service catalog unavailable"
              description={(servicesQ.error as Error).message}
            />
          ) : null}
          {!servicesQ.isLoading && services.length === 0 ? (
            <EdgeEmptyState
              title="No platform services registered"
              description="Register configured Edge services. Observation status stays honest (UNKNOWN never becomes healthy silently)."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)] border border-[var(--border)]">
              {services.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-3 text-sm">
                  <span className="font-medium">{s.displayName}</span>
                  <span className="text-[var(--text-muted)]">{s.serviceCode}</span>
                  <Badge>{s.category}</Badge>
                  <Badge>{s.lifecycleStatus}</Badge>
                  <Badge tone={s.observationStatus === "UNKNOWN" ? "warning" : "default"}>
                    {s.observationStatus}
                  </Badge>
                  <span className="text-[var(--text-muted)]">
                    {s.environment}
                    {s.region ? ` · ${s.region}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {canManage ? (
        <section className="space-y-3 border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-medium">Register service</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded border border-[var(--border)] bg-transparent px-3 py-2"
              placeholder="serviceCode"
              aria-label="serviceCode"
              value={form.serviceCode}
              onChange={(e) => setForm((f) => ({ ...f, serviceCode: e.target.value }))}
            />
            <input
              className="rounded border border-[var(--border)] bg-transparent px-3 py-2"
              placeholder="displayName"
              aria-label="displayName"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            <input
              className="rounded border border-[var(--border)] bg-transparent px-3 py-2"
              placeholder="category"
              aria-label="category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <input
              className="rounded border border-[var(--border)] bg-transparent px-3 py-2"
              placeholder="environment"
              aria-label="environment"
              value={form.environment}
              onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
            />
          </div>
          <Button
            type="button"
            disabled={
              register.isPending ||
              form.serviceCode.trim().length < 2 ||
              form.displayName.trim().length < 2
            }
            onClick={() => register.mutate()}
          >
            Register configured service
          </Button>
          {register.isError ? (
            <p className="text-sm text-red-600">{String(register.error)}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
