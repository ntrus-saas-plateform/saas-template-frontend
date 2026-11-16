"use client";

/**
 * P9 — Edge Admin Console: Platform Operations Center.
 * Tabbed control plane — API state only; never invent live health metrics.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi } from "@/lib/api/edge";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgeSession } from "@/providers/edge-session-provider";
import type {
  OperationsListPage,
  OperationsOverview,
  PlatformServiceRecord,
  ServiceCatalogListPage,
} from "@/types/edge-platform-operations";

type TabId =
  | "overview"
  | "services"
  | "alerts"
  | "incidents"
  | "problems"
  | "changes"
  | "maintenance"
  | "requests"
  | "tasks"
  | "oncall"
  | "reliability"
  | "recovery"
  | "runbooks"
  | "status"
  | "risks"
  | "automation";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "overview", label: "Overview", permission: "platform:operations:overview:read" },
  { id: "services", label: "Services", permission: "platform:service_catalog:read" },
  { id: "alerts", label: "Alerts", permission: "platform:operations:alerts:read" },
  { id: "incidents", label: "Incidents", permission: "platform:operations:incidents:read" },
  { id: "problems", label: "Problems", permission: "platform:operations:problems:read" },
  { id: "changes", label: "Changes", permission: "platform:operations:changes:read" },
  {
    id: "maintenance",
    label: "Maintenance",
    permission: "platform:operations:maintenance:read",
  },
  { id: "requests", label: "Requests", permission: "platform:operations:requests:read" },
  { id: "tasks", label: "Tasks", permission: "platform:operations:tasks:read" },
  { id: "oncall", label: "On-call", permission: "platform:operations:oncall:read" },
  { id: "reliability", label: "Reliability", permission: "platform:operations:slo:read" },
  { id: "recovery", label: "Recovery", permission: "platform:operations:recovery:read" },
  { id: "runbooks", label: "Runbooks", permission: "platform:operations:runbooks:read" },
  { id: "status", label: "Status", permission: "platform:operations:status:read" },
  { id: "risks", label: "Risks", permission: "platform:operations:risks:read" },
  {
    id: "automation",
    label: "Automation",
    permission: "platform:operations:automation:read",
  },
];

const READ_PERMS = [
  ...TABS.map((t) => t.permission),
  "platform:operations:capacity:read",
  "platform:service_catalog:manage",
];

function unwrapPage<T>(data: unknown): OperationsListPage<T> {
  const raw = data as { data?: OperationsListPage<T> } | OperationsListPage<T> | undefined;
  if (raw && typeof raw === "object" && "items" in raw && Array.isArray(raw.items)) {
    return { items: raw.items, total: raw.total ?? raw.items.length };
  }
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    const inner = raw.data;
    if (inner && typeof inner === "object" && "items" in inner) {
      return {
        items: inner.items ?? [],
        total: inner.total ?? (inner.items?.length ?? 0),
      };
    }
  }
  return { items: [], total: 0 };
}

function unwrapOverview(data: unknown): OperationsOverview | null {
  const raw = data as { data?: OperationsOverview } | OperationsOverview | undefined;
  if (!raw) return null;
  if ("catalog" in raw) return raw;
  if ("data" in raw && raw.data) return raw.data;
  return null;
}

function unwrapCatalog(data: unknown): ServiceCatalogListPage {
  return unwrapPage<PlatformServiceRecord>(data);
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (["ACTIVE", "APPROVED", "COMPLETED", "RESOLVED", "DONE", "OPERATIONAL", "VERIFIED"].includes(s)) {
    return "success";
  }
  if (["FAILED", "REJECTED", "CRITICAL", "SEV0", "SEV1", "MAJOR_OUTAGE", "CANCELLED"].includes(s)) {
    return "danger";
  }
  if (
    ["UNKNOWN", "UNAVAILABLE", "STALE", "PENDING", "DRAFT", "REQUESTED", "DEGRADED", "ACKNOWLEDGED"].includes(
      s,
    )
  ) {
    return "warning";
  }
  return "info";
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function DenseTable({
  headers,
  children,
  testId,
}: {
  headers: string[];
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="overflow-x-auto border border-[var(--border)]" data-testid={testId}>
      <table className="w-full min-w-[40rem] border-collapse text-left type-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
    </div>
  );
}

function QueryShell({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  if (loading) return <EdgeLoadingState />;
  if (error) {
    return (
      <EdgeErrorState
        title="Unavailable"
        description={errMsg(error)}
      />
    );
  }
  if (empty) {
    return <EdgeEmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return <>{children}</>;
}

export function EdgeOperationsModule() {
  const { permissions } = useEdgeSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("overview");

  const canOverview = hasEdgePermission(permissions, "platform:operations:overview:read");
  const canReadServices = hasEdgePermission(permissions, "platform:service_catalog:read");
  const canManageServices = hasEdgePermission(permissions, "platform:service_catalog:manage");
  const canAlertsRead = hasEdgePermission(permissions, "platform:operations:alerts:read");
  const canAlertsManage = hasEdgePermission(permissions, "platform:operations:alerts:manage");
  const canIncidentsRead = hasEdgePermission(permissions, "platform:operations:incidents:read");
  const canIncidentsManage = hasEdgePermission(permissions, "platform:operations:incidents:manage");
  const canProblemsRead = hasEdgePermission(permissions, "platform:operations:problems:read");
  const canChangesRead = hasEdgePermission(permissions, "platform:operations:changes:read");
  const canChangesManage = hasEdgePermission(permissions, "platform:operations:changes:manage");
  const canMaintRead = hasEdgePermission(permissions, "platform:operations:maintenance:read");
  const canMaintManage = hasEdgePermission(permissions, "platform:operations:maintenance:manage");
  const canRequestsRead = hasEdgePermission(permissions, "platform:operations:requests:read");
  const canTasksRead = hasEdgePermission(permissions, "platform:operations:tasks:read");
  const canTasksManage = hasEdgePermission(permissions, "platform:operations:tasks:manage");
  const canOncallRead = hasEdgePermission(permissions, "platform:operations:oncall:read");
  const canSloRead = hasEdgePermission(permissions, "platform:operations:slo:read");
  const canCapacityRead = hasEdgePermission(permissions, "platform:operations:capacity:read");
  const canRecoveryRead = hasEdgePermission(permissions, "platform:operations:recovery:read");
  const canRunbooksRead = hasEdgePermission(permissions, "platform:operations:runbooks:read");
  const canStatusRead = hasEdgePermission(permissions, "platform:operations:status:read");
  const canRisksRead = hasEdgePermission(permissions, "platform:operations:risks:read");
  const canAutomationRead = hasEdgePermission(permissions, "platform:operations:automation:read");
  const canAnalytics = hasEdgePermission(permissions, "platform:operations:analytics:read");

  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      if (t.id === "reliability") {
        return canSloRead || canCapacityRead;
      }
      return hasEdgePermission(permissions, t.permission);
    });
  }, [permissions, canSloRead, canCapacityRead]);

  const [serviceQ, setServiceQ] = useState("");
  const [serviceForm, setServiceForm] = useState({
    serviceCode: "",
    displayName: "",
    category: "CONTROL_PLANE",
    environment: "PRODUCTION",
  });

  const [alertForm, setAlertForm] = useState({
    fingerprint: "",
    title: "",
    sourceSystem: "",
    severity: "SEV3",
  });
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    severity: "SEV3",
    category: "AVAILABILITY",
  });
  const [changeForm, setChangeForm] = useState({
    title: "",
    changeType: "NORMAL",
    riskLevel: "MEDIUM",
  });
  const [maintForm, setMaintForm] = useState({
    title: "",
    reason: "",
    startsAt: "",
    endsAt: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "P3",
  });

  function invalidateOps() {
    void qc.invalidateQueries({ queryKey: ["p9"] });
  }

  const overviewQ = useQuery({
    queryKey: ["p9", "overview"],
    queryFn: () => edgeApi.getOperationsOverview(),
    enabled: canOverview && tab === "overview",
  });

  const analyticsQ = useQuery({
    queryKey: ["p9", "analytics"],
    queryFn: () => edgeApi.getOperationsAnalytics(),
    enabled: canAnalytics && tab === "overview",
  });

  const servicesQ = useQuery({
    queryKey: ["p9", "services", serviceQ],
    queryFn: () => edgeApi.listPlatformServices({ q: serviceQ || undefined, limit: 50 }),
    enabled: canReadServices && tab === "services",
  });

  const alertsQ = useQuery({
    queryKey: ["p9", "alerts"],
    queryFn: () => edgeApi.listOperationalAlerts({ limit: 50 }),
    enabled: canAlertsRead && tab === "alerts",
  });

  const incidentsQ = useQuery({
    queryKey: ["p9", "incidents"],
    queryFn: () => edgeApi.listIncidents({ limit: 50 }),
    enabled: canIncidentsRead && tab === "incidents",
  });

  const problemsQ = useQuery({
    queryKey: ["p9", "problems"],
    queryFn: () => edgeApi.listProblems({ limit: 50 }),
    enabled: canProblemsRead && tab === "problems",
  });

  const changesQ = useQuery({
    queryKey: ["p9", "changes"],
    queryFn: () => edgeApi.listChanges({ limit: 50 }),
    enabled: canChangesRead && tab === "changes",
  });

  const maintQ = useQuery({
    queryKey: ["p9", "maintenance"],
    queryFn: () => edgeApi.listMaintenanceWindows({ limit: 50 }),
    enabled: canMaintRead && tab === "maintenance",
  });

  const requestsQ = useQuery({
    queryKey: ["p9", "requests"],
    queryFn: () => edgeApi.listServiceRequests({ limit: 50 }),
    enabled: canRequestsRead && tab === "requests",
  });

  const tasksQ = useQuery({
    queryKey: ["p9", "tasks"],
    queryFn: () => edgeApi.listOperationalTasks({ limit: 50 }),
    enabled: canTasksRead && tab === "tasks",
  });

  const oncallQ = useQuery({
    queryKey: ["p9", "oncall"],
    queryFn: () => edgeApi.listOnCallRotations({ limit: 50 }),
    enabled: canOncallRead && tab === "oncall",
  });

  const sloQ = useQuery({
    queryKey: ["p9", "slo"],
    queryFn: () => edgeApi.listSloDefinitions({ limit: 50 }),
    enabled: canSloRead && tab === "reliability",
  });

  const capacityQ = useQuery({
    queryKey: ["p9", "capacity"],
    queryFn: () => edgeApi.listCapacityMeasurements({ limit: 50 }),
    enabled: canCapacityRead && tab === "reliability",
  });

  const recoveryQ = useQuery({
    queryKey: ["p9", "recovery"],
    queryFn: () => edgeApi.listRecoveryOperations({ limit: 50 }),
    enabled: canRecoveryRead && tab === "recovery",
  });

  const runbooksQ = useQuery({
    queryKey: ["p9", "runbooks"],
    queryFn: () => edgeApi.listRunbooks({ limit: 50 }),
    enabled: canRunbooksRead && tab === "runbooks",
  });

  const statusQ = useQuery({
    queryKey: ["p9", "status"],
    queryFn: () => edgeApi.listStatusComponents({ limit: 50 }),
    enabled: canStatusRead && tab === "status",
  });

  const risksQ = useQuery({
    queryKey: ["p9", "risks"],
    queryFn: () => edgeApi.listOperationalRisks({ limit: 50 }),
    enabled: canRisksRead && tab === "risks",
  });

  const exceptionsQ = useQuery({
    queryKey: ["p9", "exceptions"],
    queryFn: () => edgeApi.listOperationalExceptions({ limit: 50 }),
    enabled: canRisksRead && tab === "risks",
  });

  const registerService = useMutation({
    mutationFn: () =>
      edgeApi.registerPlatformService({
        serviceCode: serviceForm.serviceCode.trim(),
        displayName: serviceForm.displayName.trim(),
        category: serviceForm.category,
        environment: serviceForm.environment,
        observationStatus: "CONFIGURED",
      }),
    onSuccess: () => {
      setServiceForm({
        serviceCode: "",
        displayName: "",
        category: "CONTROL_PLANE",
        environment: "PRODUCTION",
      });
      invalidateOps();
    },
  });

  const ingestAlert = useMutation({
    mutationFn: () =>
      edgeApi.ingestOperationalAlert({
        fingerprint: alertForm.fingerprint.trim(),
        title: alertForm.title.trim(),
        sourceSystem: alertForm.sourceSystem.trim(),
        severity: alertForm.severity,
      }),
    onSuccess: () => {
      setAlertForm({ fingerprint: "", title: "", sourceSystem: "", severity: "SEV3" });
      invalidateOps();
    },
  });

  const createIncident = useMutation({
    mutationFn: () =>
      edgeApi.createIncident({
        title: incidentForm.title.trim(),
        severity: incidentForm.severity,
        category: incidentForm.category,
      }),
    onSuccess: () => {
      setIncidentForm({ title: "", severity: "SEV3", category: "AVAILABILITY" });
      invalidateOps();
    },
  });

  const createChange = useMutation({
    mutationFn: () =>
      edgeApi.createChange({
        title: changeForm.title.trim(),
        changeType: changeForm.changeType,
        riskLevel: changeForm.riskLevel,
      }),
    onSuccess: () => {
      setChangeForm({ title: "", changeType: "NORMAL", riskLevel: "MEDIUM" });
      invalidateOps();
    },
  });

  const createMaint = useMutation({
    mutationFn: () =>
      edgeApi.createMaintenanceWindow({
        title: maintForm.title.trim(),
        reason: maintForm.reason.trim(),
        startsAt: new Date(maintForm.startsAt).toISOString(),
        endsAt: new Date(maintForm.endsAt).toISOString(),
      }),
    onSuccess: () => {
      setMaintForm({ title: "", reason: "", startsAt: "", endsAt: "" });
      invalidateOps();
    },
  });

  const createTask = useMutation({
    mutationFn: () =>
      edgeApi.createOperationalTask({
        title: taskForm.title.trim(),
        priority: taskForm.priority,
      }),
    onSuccess: () => {
      setTaskForm({ title: "", priority: "P3" });
      invalidateOps();
    },
  });

  const overview = unwrapOverview(overviewQ.data);
  const servicesPage = unwrapCatalog(servicesQ.data);
  const alerts = unwrapPage(alertsQ.data);
  const incidents = unwrapPage(incidentsQ.data);
  const problems = unwrapPage(problemsQ.data);
  const changes = unwrapPage(changesQ.data);
  const maintenance = unwrapPage(maintQ.data);
  const requests = unwrapPage(requestsQ.data);
  const tasks = unwrapPage(tasksQ.data);
  const oncall = unwrapPage(oncallQ.data);
  const slos = unwrapPage(sloQ.data);
  const capacity = unwrapPage(capacityQ.data);
  const recovery = unwrapPage(recoveryQ.data);
  const runbooks = unwrapPage(runbooksQ.data);
  const statusComponents = unwrapPage(statusQ.data);
  const risks = unwrapPage(risksQ.data);
  const exceptions = unwrapPage(exceptionsQ.data);

  const analyticsRaw = analyticsQ.data as
    | { data?: Record<string, unknown> }
    | Record<string, unknown>
    | undefined;
  const analytics =
    analyticsRaw && typeof analyticsRaw === "object" && "catalog" in analyticsRaw
      ? analyticsRaw
      : analyticsRaw && typeof analyticsRaw === "object" && "data" in analyticsRaw
        ? (analyticsRaw as { data?: Record<string, unknown> }).data
        : null;

  if (!hasAnyEdgePermission(permissions, READ_PERMS)) {
    return <EdgeForbiddenState />;
  }

  if (visibleTabs.length === 0) {
    return (
      <EdgeEmptyState
        title="Operations access required"
        description="Missing platform:operations:* or platform:service_catalog:* permissions"
      />
    );
  }

  const activeTab = visibleTabs.some((t) => t.id === tab) ? tab : visibleTabs[0].id;

  const actionError =
    registerService.error ??
    ingestAlert.error ??
    createIncident.error ??
    createChange.error ??
    createMaint.error ??
    createTask.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="edge-operations-module">
      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {errMsg(actionError)}
        </p>
      ) : null}

      <Tabs
        tabs={visibleTabs.map((t) => ({ id: t.id, label: t.label }))}
        value={activeTab}
        onChange={(id) => setTab(id as TabId)}
      />

      {activeTab === "overview" && canOverview ? (
        <section className="space-y-4" data-testid="ops-overview">
          <h2 className="type-md font-medium">Operations overview</h2>
          {overviewQ.isLoading ? <EdgeLoadingState /> : null}
          {overviewQ.isError ? (
            <EdgeErrorState title="Overview unavailable" description={errMsg(overviewQ.error)} />
          ) : null}
          {overview ? (
            <div className="space-y-3 type-sm">
              <p className="text-[var(--text-muted)]">{overview.note}</p>
              <div className="flex flex-wrap gap-2">
                <Badge>Availability: {overview.availability}</Badge>
                <Badge>Catalog services: {overview.catalog.totalServices}</Badge>
                <Badge tone="warning">
                  Incidents: {overview.activeIncidents.availability}
                </Badge>
                <Badge tone="warning">Alerts: {overview.activeAlerts.availability}</Badge>
              </div>
              <p className="text-[var(--text-muted)]">
                Observation: {overview.catalog.observation} · computed{" "}
                {formatWhen(overview.computedAt)}
              </p>
            </div>
          ) : null}

          {canAnalytics ? (
            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Analytics</h3>
              {analyticsQ.isLoading ? <EdgeLoadingState label="Loading analytics…" /> : null}
              {analyticsQ.isError ? (
                <EdgeErrorState
                  title="Analytics unavailable"
                  description={errMsg(analyticsQ.error)}
                />
              ) : null}
              {analytics && typeof analytics === "object" ? (
                <div className="flex flex-wrap gap-2 type-sm">
                  {"note" in analytics && analytics.note ? (
                    <p className="w-full text-[var(--text-muted)]">{String(analytics.note)}</p>
                  ) : null}
                  <Badge>
                    Catalog:{" "}
                    {String(
                      (analytics.catalog as { totalServices?: number } | undefined)
                        ?.totalServices ?? "—",
                    )}
                  </Badge>
                  {"alerts" in analytics ? (
                    <Badge>
                      Alerts total:{" "}
                      {String(
                        (analytics.alerts as { totalCount?: number } | undefined)?.totalCount ??
                          "—",
                      )}
                    </Badge>
                  ) : null}
                  {"incidents" in analytics ? (
                    <Badge>
                      Incidents open:{" "}
                      {String(
                        (analytics.incidents as { openCount?: number } | undefined)?.openCount ??
                          "—",
                      )}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "services" && canReadServices ? (
        <section className="space-y-4" data-testid="ops-services">
          <div className="grow max-w-md">
            <label className="type-xs text-[var(--text-muted)]" htmlFor="p9-service-q">
              Search services
            </label>
            <input
              id="p9-service-q"
              className={fieldControlClass}
              value={serviceQ}
              onChange={(e) => setServiceQ(e.target.value)}
              placeholder="code, name…"
            />
          </div>
          <QueryShell
            loading={servicesQ.isLoading}
            error={servicesQ.isError ? servicesQ.error : null}
            empty={!servicesQ.isLoading && servicesPage.items.length === 0}
            emptyTitle="No platform services registered"
            emptyDescription="Register configured Edge services. Observation status stays honest (UNKNOWN never becomes healthy silently)."
          >
            <DenseTable
              headers={["Name", "Code", "Category", "Lifecycle", "Observation", "Env"]}
              testId="ops-services-table"
            >
              {servicesPage.items.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{s.displayName}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{s.serviceCode}</td>
                  <td className="px-3 py-2">
                    <Badge>{s.category}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge>{s.lifecycleStatus}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(s.observationStatus)}>{s.observationStatus}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {s.environment}
                    {s.region ? ` · ${s.region}` : ""}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {canManageServices ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Register service</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="serviceCode"
                  aria-label="serviceCode"
                  value={serviceForm.serviceCode}
                  onChange={(e) =>
                    setServiceForm((f) => ({ ...f, serviceCode: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="displayName"
                  aria-label="displayName"
                  value={serviceForm.displayName}
                  onChange={(e) =>
                    setServiceForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="category"
                  aria-label="category"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm((f) => ({ ...f, category: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="environment"
                  aria-label="environment"
                  value={serviceForm.environment}
                  onChange={(e) =>
                    setServiceForm((f) => ({ ...f, environment: e.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                disabled={
                  registerService.isPending ||
                  serviceForm.serviceCode.trim().length < 2 ||
                  serviceForm.displayName.trim().length < 2
                }
                onClick={() => registerService.mutate()}
              >
                Register configured service
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "alerts" && canAlertsRead ? (
        <section className="space-y-4" data-testid="ops-alerts">
          <QueryShell
            loading={alertsQ.isLoading}
            error={alertsQ.isError ? alertsQ.error : null}
            empty={!alertsQ.isLoading && alerts.items.length === 0}
            emptyTitle="No alerts"
            emptyDescription="No operational alerts ingested yet. Live provider health remains UNAVAILABLE until configured."
          >
            <DenseTable
              headers={["Title", "Severity", "Status", "Source", "First seen"]}
              testId="ops-alerts-table"
            >
              {alerts.items.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-medium">{a.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(a.severity)}>{a.severity}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{a.sourceSystem}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(a.firstSeenAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {canAlertsManage ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Ingest alert</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="fingerprint"
                  aria-label="fingerprint"
                  value={alertForm.fingerprint}
                  onChange={(e) => setAlertForm((f) => ({ ...f, fingerprint: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="title"
                  aria-label="alert title"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="sourceSystem"
                  aria-label="sourceSystem"
                  value={alertForm.sourceSystem}
                  onChange={(e) => setAlertForm((f) => ({ ...f, sourceSystem: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="severity"
                  aria-label="severity"
                  value={alertForm.severity}
                  onChange={(e) => setAlertForm((f) => ({ ...f, severity: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                disabled={
                  ingestAlert.isPending ||
                  alertForm.fingerprint.trim().length < 2 ||
                  alertForm.title.trim().length < 2 ||
                  alertForm.sourceSystem.trim().length < 2
                }
                onClick={() => ingestAlert.mutate()}
              >
                Ingest alert
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "incidents" && canIncidentsRead ? (
        <section className="space-y-4" data-testid="ops-incidents">
          <QueryShell
            loading={incidentsQ.isLoading}
            error={incidentsQ.isError ? incidentsQ.error : null}
            empty={!incidentsQ.isLoading && incidents.items.length === 0}
            emptyTitle="No incidents"
            emptyDescription="No incidents recorded. Counts stay honest — empty is not healthy."
          >
            <DenseTable
              headers={["Number", "Title", "Severity", "Status", "Major", "Detected"]}
              testId="ops-incidents-table"
            >
              {incidents.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{i.incidentNumber}</td>
                  <td className="px-3 py-2 font-medium">{i.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(i.severity)}>{i.severity}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{i.isMajor ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(i.detectedAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {canIncidentsManage ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create incident</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="title"
                  aria-label="incident title"
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="severity"
                  aria-label="incident severity"
                  value={incidentForm.severity}
                  onChange={(e) => setIncidentForm((f) => ({ ...f, severity: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="category"
                  aria-label="incident category"
                  value={incidentForm.category}
                  onChange={(e) => setIncidentForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                disabled={createIncident.isPending || incidentForm.title.trim().length < 2}
                onClick={() => createIncident.mutate()}
              >
                Create incident
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "problems" && canProblemsRead ? (
        <section className="space-y-4" data-testid="ops-problems">
          <QueryShell
            loading={problemsQ.isLoading}
            error={problemsQ.isError ? problemsQ.error : null}
            empty={!problemsQ.isLoading && problems.items.length === 0}
            emptyTitle="No problems"
            emptyDescription="No problem records. Root cause stays unconfirmed until reviewed."
          >
            <DenseTable
              headers={["Number", "Title", "Status", "Priority", "RCA confirmed"]}
              testId="ops-problems-table"
            >
              {problems.items.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{p.problemNumber}</td>
                  <td className="px-3 py-2 font-medium">{p.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{p.priority}</td>
                  <td className="px-3 py-2">{p.rootCauseConfirmed ? "Yes" : "No"}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "changes" && canChangesRead ? (
        <section className="space-y-4" data-testid="ops-changes">
          <QueryShell
            loading={changesQ.isLoading}
            error={changesQ.isError ? changesQ.error : null}
            empty={!changesQ.isLoading && changes.items.length === 0}
            emptyTitle="No change requests"
            emptyDescription="No change drafts or approvals on record."
          >
            <DenseTable
              headers={["Number", "Title", "Type", "Status", "Risk"]}
              testId="ops-changes-table"
            >
              {changes.items.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{c.changeNumber}</td>
                  <td className="px-3 py-2 font-medium">{c.title}</td>
                  <td className="px-3 py-2">{c.changeType}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(c.riskLevel)}>{c.riskLevel}</Badge>
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {canChangesManage ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Draft change</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="title"
                  aria-label="change title"
                  value={changeForm.title}
                  onChange={(e) => setChangeForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="changeType"
                  aria-label="changeType"
                  value={changeForm.changeType}
                  onChange={(e) => setChangeForm((f) => ({ ...f, changeType: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="riskLevel"
                  aria-label="riskLevel"
                  value={changeForm.riskLevel}
                  onChange={(e) => setChangeForm((f) => ({ ...f, riskLevel: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                disabled={createChange.isPending || changeForm.title.trim().length < 2}
                onClick={() => createChange.mutate()}
              >
                Create draft change
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "maintenance" && canMaintRead ? (
        <section className="space-y-4" data-testid="ops-maintenance">
          <QueryShell
            loading={maintQ.isLoading}
            error={maintQ.isError ? maintQ.error : null}
            empty={!maintQ.isLoading && maintenance.items.length === 0}
            emptyTitle="No maintenance windows"
            emptyDescription="No scheduled maintenance windows."
          >
            <DenseTable
              headers={["Title", "Type", "Status", "Starts", "Ends"]}
              testId="ops-maintenance-table"
            >
              {maintenance.items.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-medium">{m.title}</td>
                  <td className="px-3 py-2">{m.maintenanceType}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(m.startsAt)}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{formatWhen(m.endsAt)}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {canMaintManage ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Schedule maintenance</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="title"
                  aria-label="maintenance title"
                  value={maintForm.title}
                  onChange={(e) => setMaintForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="reason"
                  aria-label="maintenance reason"
                  value={maintForm.reason}
                  onChange={(e) => setMaintForm((f) => ({ ...f, reason: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  type="datetime-local"
                  aria-label="startsAt"
                  value={maintForm.startsAt}
                  onChange={(e) => setMaintForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  type="datetime-local"
                  aria-label="endsAt"
                  value={maintForm.endsAt}
                  onChange={(e) => setMaintForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                disabled={
                  createMaint.isPending ||
                  maintForm.title.trim().length < 2 ||
                  maintForm.reason.trim().length < 2 ||
                  !maintForm.startsAt ||
                  !maintForm.endsAt
                }
                onClick={() => createMaint.mutate()}
              >
                Schedule maintenance
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "requests" && canRequestsRead ? (
        <section className="space-y-4" data-testid="ops-requests">
          <QueryShell
            loading={requestsQ.isLoading}
            error={requestsQ.isError ? requestsQ.error : null}
            empty={!requestsQ.isLoading && requests.items.length === 0}
            emptyTitle="No service requests"
            emptyDescription="No platform service requests."
          >
            <DenseTable
              headers={["Number", "Title", "Category", "Status", "Priority"]}
              testId="ops-requests-table"
            >
              {requests.items.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.requestNumber}</td>
                  <td className="px-3 py-2 font-medium">{r.title}</td>
                  <td className="px-3 py-2">{r.category}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{r.priority}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "tasks" && canTasksRead ? (
        <section className="space-y-4" data-testid="ops-tasks">
          <QueryShell
            loading={tasksQ.isLoading}
            error={tasksQ.isError ? tasksQ.error : null}
            empty={!tasksQ.isLoading && tasks.items.length === 0}
            emptyTitle="No operational tasks"
            emptyDescription="No tasks assigned."
          >
            <DenseTable
              headers={["Title", "Status", "Priority", "Assigned", "Due"]}
              testId="ops-tasks-table"
            >
              {tasks.items.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 font-medium">{t.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </td>
                  <td className="px-3 py-2">{t.priority}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {t.assignedTo ?? t.assignedTeam ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{formatWhen(t.dueAt)}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {canTasksManage ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create task</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="title"
                  aria-label="task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="priority"
                  aria-label="task priority"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                disabled={createTask.isPending || taskForm.title.trim().length < 2}
                onClick={() => createTask.mutate()}
              >
                Create task
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "oncall" && canOncallRead ? (
        <section className="space-y-4" data-testid="ops-oncall">
          <QueryShell
            loading={oncallQ.isLoading}
            error={oncallQ.isError ? oncallQ.error : null}
            empty={!oncallQ.isLoading && oncall.items.length === 0}
            emptyTitle="No on-call rotations"
            emptyDescription="No rotations configured."
          >
            <DenseTable
              headers={["Team", "Primary", "Secondary", "Starts", "Ends"]}
              testId="ops-oncall-table"
            >
              {oncall.items.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.teamId}</td>
                  <td className="px-3 py-2 font-medium">{r.primaryResponderId}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {r.secondaryResponderId ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(r.startsAt)}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{formatWhen(r.endsAt)}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "reliability" && (canSloRead || canCapacityRead) ? (
        <section className="space-y-6" data-testid="ops-reliability">
          {canSloRead ? (
            <div className="space-y-3">
              <h3 className="type-sm font-medium">SLO definitions</h3>
              <QueryShell
                loading={sloQ.isLoading}
                error={sloQ.isError ? sloQ.error : null}
                empty={!sloQ.isLoading && slos.items.length === 0}
                emptyTitle="No SLO definitions"
                emptyDescription="No SLI/SLO definitions. Error budgets are not fabricated."
              >
                <DenseTable
                  headers={["Name", "SLI", "Target", "Window", "Status"]}
                  testId="ops-slo-table"
                >
                  {slos.items.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-medium">{s.name}</td>
                      <td className="px-3 py-2">{s.sliType}</td>
                      <td className="px-3 py-2">{s.targetValue}</td>
                      <td className="px-3 py-2">{s.windowDays}d</td>
                      <td className="px-3 py-2">
                        <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </DenseTable>
              </QueryShell>
            </div>
          ) : null}

          {canCapacityRead ? (
            <div className="space-y-3">
              <h3 className="type-sm font-medium">Capacity measurements</h3>
              <QueryShell
                loading={capacityQ.isLoading}
                error={capacityQ.isError ? capacityQ.error : null}
                empty={!capacityQ.isLoading && capacity.items.length === 0}
                emptyTitle="No capacity measurements"
                emptyDescription="No recorded capacity samples from trusted sources."
              >
                <DenseTable
                  headers={["Metric", "Value", "Unit", "Source", "Observed"]}
                  testId="ops-capacity-table"
                >
                  {capacity.items.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-medium">{c.metricName}</td>
                      <td className="px-3 py-2">{c.metricValue}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{c.unit ?? "—"}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{c.sourceSystem}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">
                        {formatWhen(c.observedAt)}
                      </td>
                    </tr>
                  ))}
                </DenseTable>
              </QueryShell>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "recovery" && canRecoveryRead ? (
        <section className="space-y-4" data-testid="ops-recovery">
          <QueryShell
            loading={recoveryQ.isLoading}
            error={recoveryQ.isError ? recoveryQ.error : null}
            empty={!recoveryQ.isLoading && recovery.items.length === 0}
            emptyTitle="No recovery operations"
            emptyDescription="No backup/restore/DR coordination records. VERIFIED requires external evidence."
          >
            <DenseTable
              headers={["Type", "Status", "Requester", "Evidence", "Created"]}
              testId="ops-recovery-table"
            >
              {recovery.items.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{r.operationType}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.requesterId}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {r.externalEvidenceRef ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(r.createdAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "runbooks" && canRunbooksRead ? (
        <section className="space-y-4" data-testid="ops-runbooks">
          <QueryShell
            loading={runbooksQ.isLoading}
            error={runbooksQ.isError ? runbooksQ.error : null}
            empty={!runbooksQ.isLoading && runbooks.items.length === 0}
            emptyTitle="No runbooks"
            emptyDescription="No runbook catalog entries."
          >
            <DenseTable
              headers={["Code", "Title", "Version", "Service"]}
              testId="ops-runbooks-table"
            >
              {runbooks.items.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.code}</td>
                  <td className="px-3 py-2 font-medium">{r.title}</td>
                  <td className="px-3 py-2">v{r.currentVersion}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{r.serviceId ?? "—"}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "status" && canStatusRead ? (
        <section className="space-y-4" data-testid="ops-status">
          <QueryShell
            loading={statusQ.isLoading}
            error={statusQ.isError ? statusQ.error : null}
            empty={!statusQ.isLoading && statusComponents.items.length === 0}
            emptyTitle="No status components"
            emptyDescription="Public status defaults to UNKNOWN until published with SoD approval."
          >
            <DenseTable
              headers={["Code", "Name", "Public status", "Updated"]}
              testId="ops-status-table"
            >
              {statusComponents.items.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{c.code}</td>
                  <td className="px-3 py-2 font-medium">{c.displayName}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(c.publicStatus)}>{c.publicStatus}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(c.updatedAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "risks" && canRisksRead ? (
        <section className="space-y-6" data-testid="ops-risks">
          <div className="space-y-3">
            <h3 className="type-sm font-medium">Operational risks</h3>
            <QueryShell
              loading={risksQ.isLoading}
              error={risksQ.isError ? risksQ.error : null}
              empty={!risksQ.isLoading && risks.items.length === 0}
              emptyTitle="No operational risks"
              emptyDescription="No risk register entries."
            >
              <DenseTable
                headers={["Title", "Category", "Status", "Probability", "Impact"]}
                testId="ops-risks-table"
              >
                {risks.items.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-medium">{r.title}</td>
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-3 py-2">{r.probability}</td>
                    <td className="px-3 py-2">{r.impact}</td>
                  </tr>
                ))}
              </DenseTable>
            </QueryShell>
          </div>
          <div className="space-y-3">
            <h3 className="type-sm font-medium">Exceptions</h3>
            <QueryShell
              loading={exceptionsQ.isLoading}
              error={exceptionsQ.isError ? exceptionsQ.error : null}
              empty={!exceptionsQ.isLoading && exceptions.items.length === 0}
              emptyTitle="No operational exceptions"
              emptyDescription="No active or expired exceptions."
            >
              <DenseTable
                headers={["Title", "Status", "Owner", "Expires"]}
                testId="ops-exceptions-table"
              >
                {exceptions.items.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 font-medium">{e.title}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{e.ownerId}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">
                      {formatWhen(e.expiresAt)}
                    </td>
                  </tr>
                ))}
              </DenseTable>
            </QueryShell>
          </div>
        </section>
      ) : null}

      {activeTab === "automation" && canAutomationRead ? (
        <section className="space-y-4" data-testid="ops-automation">
          <EdgeEmptyState
            title="Automation console"
            description="Request / approve / execute flows are available via API (platform:operations:automation:*). Destructive automations require SoD approval before execution — no silent runs."
          />
        </section>
      ) : null}
    </div>
  );
}
