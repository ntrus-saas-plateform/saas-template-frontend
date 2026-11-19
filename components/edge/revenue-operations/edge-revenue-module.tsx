"use client";

/**
 * P11 — Edge Admin Console: SaaS Business & Revenue Operations.
 * Studio control plane — API state only; never invent financial amounts.
 * contracted ≠ invoiced ≠ collected; GRR excludes expansion.
 */
import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
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
import { edgeApi } from "@/lib/api/edge";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  CommissionCalculation,
  DataQuality,
  MetricDefinition,
  RevenueForecast,
  RevenueOverview,
  RevenueOverviewMetric,
} from "@/types/edge-revenue-operations";

type TabId =
  | "overview"
  | "metrics"
  | "mrr"
  | "cash"
  | "retention"
  | "renewals"
  | "forecasts"
  | "assurance"
  | "commissions"
  | "alerts"
  | "reports";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "overview", label: "Overview", permission: "platform:revenue:read" },
  { id: "metrics", label: "Metrics", permission: "platform:revenue:read" },
  { id: "mrr", label: "MRR", permission: "platform:revenue:read" },
  { id: "cash", label: "Cash", permission: "platform:revenue:read" },
  { id: "retention", label: "Retention", permission: "platform:revenue:read" },
  { id: "renewals", label: "Renewals", permission: "platform:revenue:read" },
  { id: "forecasts", label: "Forecasts", permission: "platform:revenue:forecast" },
  { id: "assurance", label: "Assurance", permission: "platform:revenue:reconcile" },
  { id: "commissions", label: "Commissions", permission: "platform:commission:read" },
  { id: "alerts", label: "Alerts", permission: "platform:business:read" },
  { id: "reports", label: "Reports", permission: "platform:business:governance:manage" },
];

const REV_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const REV_STUDIO_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "Overview", itemIds: ["overview", "metrics"] },
  {
    title: "Revenue",
    itemIds: ["mrr", "cash", "retention", "renewals", "forecasts"],
  },
  { title: "Assurance", itemIds: ["assurance", "commissions"] },
  { title: "Ops", itemIds: ["alerts", "reports"] },
];

const READ_ANY = [
  "platform:revenue:read",
  "platform:business:read",
  "platform:commission:read",
  "platform:revenue:forecast",
  "platform:revenue:reconcile",
  "platform:business:governance:manage",
  "platform:business:reports:manage",
];

function unwrapData<T>(data: unknown): T | null {
  if (!data) return null;
  if (typeof data === "object" && data !== null && "data" in data) {
    return ((data as { data: T }).data ?? null) as T | null;
  }
  return data as T;
}

function unwrapPage<T>(data: unknown): { items: T[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length };
  }
  const raw = data as
    | { data?: { items?: T[]; total?: number } | T[] }
    | { items?: T[]; total?: number }
    | undefined;
  if (raw && typeof raw === "object" && "items" in raw && Array.isArray(raw.items)) {
    return { items: raw.items, total: raw.total ?? raw.items.length };
  }
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    const inner = raw.data;
    if (Array.isArray(inner)) return { items: inner as T[], total: inner.length };
    if (inner && typeof inner === "object" && "items" in inner && Array.isArray(inner.items)) {
      return { items: inner.items, total: inner.total ?? inner.items.length };
    }
  }
  return { items: [] as T[], total: 0 };
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function qualityTone(
  q: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  const s = String(q ?? "").toUpperCase();
  if (s === "MEASURED") return "success";
  if (s === "ESTIMATED") return "warning";
  if (s === "UNAVAILABLE") return "danger";
  return "default";
}

function DataQualityBadge({ quality }: { quality: DataQuality | string | undefined }) {
  const q = String(quality ?? "UNAVAILABLE").toUpperCase();
  return (
    <span data-testid={`dq-${q.toLowerCase()}`}>
      <Badge tone={qualityTone(q)}>{q}</Badge>
    </span>
  );
}

function formatAmount(
  value: number | null | undefined,
  currency: string | null | undefined,
  quality: string | undefined,
): string {
  if (String(quality ?? "").toUpperCase() === "UNAVAILABLE" || value == null) {
    return "—";
  }
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: currency ? "currency" : "decimal",
      currency: currency || undefined,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value}${currency ? ` ${currency}` : ""}`;
  }
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
      <table className="w-full type-sm text-left">
        <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
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
    return <EdgeErrorState title="Unavailable" description={errMsg(error)} />;
  }
  if (empty) {
    return <EdgeEmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return <>{children}</>;
}

function MetricRow({ m }: { m: RevenueOverviewMetric }) {
  return (
    <tr data-testid={`metric-row-${m.metricCode}`}>
      <td className="px-3 py-2 font-medium">{m.metricCode}</td>
      <td className="px-3 py-2">
        {formatAmount(m.value, m.currency, String(m.dataQuality))}
      </td>
      <td className="px-3 py-2">
        <DataQualityBadge quality={m.dataQuality} />
      </td>
      <td className="px-3 py-2 text-[var(--text-muted)]">{formatWhen(m.asOf)}</td>
      <td className="px-3 py-2 text-[var(--text-muted)]">
        {m.definitionVersion ?? "—"}
      </td>
      <td className="px-3 py-2 text-[var(--text-muted)]">{m.note ?? "—"}</td>
    </tr>
  );
}

export function EdgeRevenueModule() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading revenue studio…" />}>
      <EdgeRevenueStudio />
    </Suspense>
  );
}

function EdgeRevenueStudio() {
  const { permissions, activeVerticalId } = useEdgePlatform();
  const qc = useQueryClient();
  const canRead = hasAnyEdgePermission(permissions, READ_ANY);
  const canManageMetrics = hasEdgePermission(
    permissions,
    "platform:business:metrics:manage",
  );
  const canForecast = hasEdgePermission(permissions, "platform:revenue:forecast");
  const canReconcile = hasEdgePermission(permissions, "platform:revenue:reconcile");
  const canCommissionCalc = hasEdgePermission(
    permissions,
    "platform:commission:calculate",
  );
  const canCommissionApprove = hasEdgePermission(
    permissions,
    "platform:commission:approve",
  );

  // F-P11-010: Overview requires platform:revenue:read (aligned with BE) — no business:read bypass.
  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasEdgePermission(permissions, t.permission)),
    [permissions],
  );

  const [tab, setTab] = useStudioSectionParam<TabId>("overview", REV_SECTION_IDS);
  const activeTab = visibleTabs.some((t) => t.id === tab)
    ? tab
    : (visibleTabs[0]?.id ?? "overview");

  const overviewQuery = useQuery({
    queryKey: ["edge", "revenue", "overview", activeVerticalId],
    queryFn: () =>
      edgeApi.getRevenueOverview({ verticalId: activeVerticalId ?? undefined }),
    enabled: canRead && (activeTab === "overview" || activeTab === "metrics"),
  });

  const metricsQuery = useQuery({
    queryKey: ["edge", "revenue", "metrics"],
    queryFn: () => edgeApi.listRevenueMetricDefinitions({ limit: 100 }),
    enabled: canRead && activeTab === "metrics",
  });

  const retentionQuery = useQuery({
    queryKey: ["edge", "revenue", "retention", activeVerticalId],
    queryFn: async () => {
      try {
        return await edgeApi.getRevenueRetentionOverview({
          verticalId: activeVerticalId ?? undefined,
        });
      } catch (err) {
        // Fallback: derive GRR/NRR cells from revenue overview (no invented numbers)
        const ov = await edgeApi.getRevenueOverview({
          verticalId: activeVerticalId ?? undefined,
        });
        const overview = unwrapData<RevenueOverview>(ov) ?? (ov as { data?: RevenueOverview }).data;
        const metrics = overview?.metrics ?? [];
        const grr = metrics.find((m) => m.metricCode === "GRR") ?? null;
        const nrr = metrics.find((m) => m.metricCode === "NRR") ?? null;
        const allUnavailable =
          (!grr || String(grr.dataQuality).toUpperCase() === "UNAVAILABLE") &&
          (!nrr || String(nrr.dataQuality).toUpperCase() === "UNAVAILABLE");
        return {
          data: {
            availability: allUnavailable
              ? ("UNAVAILABLE" as const)
              : grr && nrr
                ? ("AVAILABLE" as const)
                : ("PARTIAL" as const),
            asOf: overview?.asOf ?? new Date().toISOString(),
            grr,
            nrr,
            snapshots: [],
            note:
              err instanceof Error
                ? `Retention endpoint unavailable (${err.message}); showing overview GRR/NRR only — GRR excludes expansion.`
                : "Showing overview GRR/NRR only — GRR excludes expansion.",
          },
        };
      }
    },
    enabled: canRead && activeTab === "retention",
  });

  const commissionQuery = useQuery({
    queryKey: ["edge", "revenue", "commission", "plans"],
    queryFn: () => edgeApi.listCommissionPlans(),
    enabled:
      hasEdgePermission(permissions, "platform:commission:read") &&
      activeTab === "commissions",
  });

  const renewalsQuery = useQuery({
    queryKey: ["edge", "revenue", "renewals", activeVerticalId],
    queryFn: () =>
      edgeApi.getRenewalIntelligence({
        withinDays: 90,
        limit: 50,
        verticalId: activeVerticalId ?? undefined,
      }),
    enabled: canRead && activeTab === "renewals",
  });

  const forecastsQuery = useQuery({
    queryKey: ["edge", "revenue", "forecasts", activeVerticalId],
    queryFn: () =>
      edgeApi.listRevenueForecasts({
        verticalId: activeVerticalId ?? undefined,
      }),
    enabled: canRead && canForecast && activeTab === "forecasts",
  });
  const forecastItems: RevenueForecast[] =
    unwrapData<RevenueForecast[]>(forecastsQuery.data) ?? [];

  const alertsQuery = useQuery({
    queryKey: ["edge", "business", "alerts"],
    queryFn: () => edgeApi.listBusinessAlerts({ limit: 50 }),
    enabled:
      hasAnyEdgePermission(permissions, [
        "platform:business:read",
        "platform:business:manage",
      ]) && activeTab === "alerts",
  });

  const reportsQuery = useQuery({
    queryKey: ["edge", "business", "reports"],
    queryFn: () => edgeApi.listBusinessReports({ limit: 50 }),
    enabled:
      hasAnyEdgePermission(permissions, [
        "platform:business:reports:manage",
        "platform:business:read",
        "platform:business:governance:manage",
      ]) && activeTab === "reports",
  });

  const auditQuery = useQuery({
    queryKey: ["edge", "business", "audit"],
    queryFn: () => edgeApi.listBusinessAudit({ limit: 50 }),
    enabled:
      hasEdgePermission(permissions, "platform:business:governance:manage") &&
      activeTab === "reports",
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => edgeApi.publishRevenueMetricDefinition(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["edge", "revenue", "metrics"] });
    },
  });

  const [mrrPeriodStart, setMrrPeriodStart] = useState("");
  const [mrrPeriodEnd, setMrrPeriodEnd] = useState("");
  const [mrrCurrency, setMrrCurrency] = useState("USD");
  const [mrrResult, setMrrResult] = useState<unknown>(null);
  const [mrrError, setMrrError] = useState<string | null>(null);

  const computeMrrMutation = useMutation({
    mutationFn: () =>
      edgeApi.computeRevenueMrrMovement({
        periodStart: mrrPeriodStart,
        periodEnd: mrrPeriodEnd,
        currency: mrrCurrency || undefined,
        persistSnapshots: false,
      }),
    onSuccess: (res) => {
      setMrrError(null);
      setMrrResult(unwrapData(res) ?? res);
    },
    onError: (e) => {
      setMrrResult(null);
      setMrrError(errMsg(e));
    },
  });

  const [cashPeriodStart, setCashPeriodStart] = useState("");
  const [cashPeriodEnd, setCashPeriodEnd] = useState("");
  const [cashCurrency, setCashCurrency] = useState("USD");
  const [cashResult, setCashResult] = useState<unknown>(null);
  const [cashError, setCashError] = useState<string | null>(null);

  const computeCashMutation = useMutation({
    mutationFn: () =>
      edgeApi.computeRevenueCash({
        periodStart: cashPeriodStart,
        periodEnd: cashPeriodEnd,
        currency: cashCurrency || undefined,
        persistSnapshots: false,
      }),
    onSuccess: (res) => {
      setCashError(null);
      setCashResult(unwrapData(res) ?? res);
    },
    onError: (e) => {
      setCashResult(null);
      setCashError(errMsg(e));
    },
  });

  const [forecastCode, setForecastCode] = useState("");
  const [forecastName, setForecastName] = useState("");
  const [forecastStart, setForecastStart] = useState("");
  const [forecastEnd, setForecastEnd] = useState("");
  const [forecastCurrency, setForecastCurrency] = useState("USD");
  const [forecastMsg, setForecastMsg] = useState<string | null>(null);

  const createForecastMutation = useMutation({
    mutationFn: () =>
      edgeApi.createRevenueForecast({
        code: forecastCode,
        name: forecastName,
        horizonStart: forecastStart,
        horizonEnd: forecastEnd,
        currency: forecastCurrency,
        verticalId: activeVerticalId ?? undefined,
      }),
    onSuccess: (res) => {
      const f = unwrapData<{ id: string; code: string; status: string }>(res);
      setForecastMsg(
        f
          ? `Forecast ${f.code} created (${f.status}) — full models deferred.`
          : "Forecast created.",
      );
      void qc.invalidateQueries({ queryKey: ["edge", "revenue", "forecasts"] });
    },
    onError: (e) => setForecastMsg(errMsg(e)),
  });

  const [leakTitle, setLeakTitle] = useState("");
  const [leakSource, setLeakSource] = useState("manual.console");
  const [leakMsg, setLeakMsg] = useState<string | null>(null);

  const createLeakMutation = useMutation({
    mutationFn: () =>
      edgeApi.createRevenueLeakageCase({
        title: leakTitle,
        detectionSource: leakSource,
        dataQuality: "ESTIMATED",
        sourceProvenance: { origin: "edge-console", invented: false },
      }),
    onSuccess: (res) => {
      const c = unwrapData<{ caseNumber: string; status: string }>(res);
      setLeakMsg(
        c
          ? `Case ${c.caseNumber} opened (${c.status}). No duplicate ledger — refs only.`
          : "Leakage case created.",
      );
      setLeakTitle("");
    },
    onError: (e) => setLeakMsg(errMsg(e)),
  });

  const [planCode, setPlanCode] = useState("");
  const [planName, setPlanName] = useState("");
  const [planFrom, setPlanFrom] = useState("");
  const [planMsg, setPlanMsg] = useState<string | null>(null);
  const [calcPlanId, setCalcPlanId] = useState("");
  const [calcKey, setCalcKey] = useState("");
  const [calcStart, setCalcStart] = useState("");
  const [calcEnd, setCalcEnd] = useState("");
  const [calcBasis, setCalcBasis] = useState("");
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(
    null,
  );
  const [calcMsg, setCalcMsg] = useState<string | null>(null);
  const [approveMsg, setApproveMsg] = useState<string | null>(null);

  const [churnStart, setChurnStart] = useState("");
  const [churnEnd, setChurnEnd] = useState("");
  const [churnResult, setChurnResult] = useState<string | null>(null);
  const [uePeriodStart, setUePeriodStart] = useState("");
  const [uePeriodEnd, setUePeriodEnd] = useState("");
  const [ueCurrency, setUeCurrency] = useState("USD");
  const [ueSpend, setUeSpend] = useState("");
  const [ueCustomers, setUeCustomers] = useState("");
  const [ueMsg, setUeMsg] = useState<string | null>(null);
  const [ppPeriodStart, setPpPeriodStart] = useState("");
  const [ppPeriodEnd, setPpPeriodEnd] = useState("");
  const [ppRevenue, setPpRevenue] = useState("");
  const [ppCurrency, setPpCurrency] = useState("USD");
  const [ppMsg, setPpMsg] = useState<string | null>(null);
  const [decisionCode, setDecisionCode] = useState("");
  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionMsg, setDecisionMsg] = useState<string | null>(null);

  const computeChurnMutation = useMutation({
    mutationFn: () =>
      edgeApi.computeRevenueChurnRates({
        periodStart: churnStart,
        periodEnd: churnEnd,
        persistSnapshots: false,
      }),
    onSuccess: (res) => {
      setChurnResult(JSON.stringify(unwrapData(res) ?? res, null, 2));
    },
    onError: (e) => setChurnResult(errMsg(e)),
  });

  const recordUeMutation = useMutation({
    mutationFn: () =>
      edgeApi.recordRevenueUnitEconomicsSnapshot({
        periodStart: uePeriodStart,
        periodEnd: uePeriodEnd,
        currency: ueCurrency,
        acquisitionSpend: ueSpend ? Number(ueSpend) : null,
        newCustomers: ueCustomers ? Number(ueCustomers) : null,
      }),
    onSuccess: () => {
      setUeMsg("Unit-economics snapshot recorded (costs absent → UNAVAILABLE).");
    },
    onError: (e) => setUeMsg(errMsg(e)),
  });

  const recordPpMutation = useMutation({
    mutationFn: () =>
      edgeApi.recordRevenueProductProfitabilitySnapshot({
        periodStart: ppPeriodStart,
        periodEnd: ppPeriodEnd,
        revenueAmount: Number(ppRevenue),
        currency: ppCurrency,
        revenueDataQuality: "MEASURED",
      }),
    onSuccess: () => {
      setPpMsg("Product profitability snapshot recorded.");
    },
    onError: (e) => setPpMsg(errMsg(e)),
  });

  const createDecisionMutation = useMutation({
    mutationFn: () =>
      edgeApi.createBusinessDecision({
        code: decisionCode.trim(),
        title: decisionTitle.trim(),
      }),
    onSuccess: () => {
      setDecisionMsg("Business decision recorded.");
      setDecisionCode("");
      setDecisionTitle("");
    },
    onError: (e) => setDecisionMsg(errMsg(e)),
  });

  const createPlanMutation = useMutation({
    mutationFn: () =>
      edgeApi.createCommissionPlan({
        code: planCode,
        name: planName,
        effectiveFrom: planFrom,
        currency: "USD",
      }),
    onSuccess: (res) => {
      const p = unwrapData<{ code: string; status: string }>(res);
      setPlanMsg(
        p
          ? `Plan ${p.code} (${p.status}) — partner payouts deferred.`
          : "Commission plan created.",
      );
      void qc.invalidateQueries({ queryKey: ["edge", "revenue", "commission"] });
    },
    onError: (e) => setPlanMsg(errMsg(e)),
  });

  const calculateMutation = useMutation({
    mutationFn: () =>
      edgeApi.calculateCommission({
        planId: calcPlanId.trim(),
        calculationKey: calcKey.trim(),
        periodStart: calcStart,
        periodEnd: calcEnd,
        basisAmount: calcBasis ? Number(calcBasis) : null,
      }),
    onSuccess: (res) => {
      const c = unwrapData<CommissionCalculation>(res);
      setCalculation(c);
      setCalcMsg(
        c
          ? `Snapshot ${c.id.slice(0, 8)} — ${c.status} (${c.dataQuality}).`
          : "Calculation recorded.",
      );
      setApproveMsg(null);
    },
    onError: (e) => setCalcMsg(errMsg(e)),
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!calculation) throw new Error("No calculation selected.");
      return edgeApi.approveCommissionCalculation(calculation.id, {
        expectedVersion: calculation.version,
      });
    },
    onSuccess: (res) => {
      const c = unwrapData<CommissionCalculation>(res);
      if (c) setCalculation(c);
      setApproveMsg(c ? `Calculation ${c.status.toLowerCase()}.` : "Approved.");
      void qc.invalidateQueries({ queryKey: ["edge", "revenue", "commission"] });
    },
    onError: (e) => setApproveMsg(errMsg(e)),
  });

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    const visibleIds = new Set(visibleTabs.map((t) => t.id));
    return REV_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .filter((id) => visibleIds.has(id))
        .map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return { id: t.id, label: t.label };
        }),
    })).filter((g) => g.items.length > 0);
  }, [visibleTabs]);

  if (!canRead) {
    return (
      <EdgeForbiddenState description="Requires platform:revenue:read (or a scoped revenue/business permission for other tabs)." />
    );
  }

  const overview = unwrapData<RevenueOverview>(overviewQuery.data);
  const overviewUnavailable =
    overview?.availability === "UNAVAILABLE" ||
    (overview?.metrics?.length
      ? overview.metrics.every(
          (m) => String(m.dataQuality).toUpperCase() === "UNAVAILABLE",
        )
      : false);

  const metricDefs = unwrapPage<MetricDefinition>(metricsQuery.data);

  return (
    <EdgeStudioShell
      title="Revenue studio"
      description="Analytics & workflows only — no invoice/payment/subscription writes. Contracted ≠ invoiced ≠ collected. GRR excludes expansion."
      groups={studioGroups}
      section={activeTab}
      onSectionChange={(id) => setTab(id as TabId)}
      testId="edge-revenue-module"
    >
      {activeTab === "overview" ? (
        <section className="space-y-3" data-testid="rev-overview">
          <h2 className="type-md font-semibold">Revenue overview</h2>
          <QueryShell
            loading={overviewQuery.isLoading}
            error={overviewQuery.error}
            empty={!overview || overviewUnavailable}
            emptyTitle="No measured revenue snapshots"
            emptyDescription={
              overview?.note ??
              "Overview is UNAVAILABLE — stored snapshots only; amounts are never invented."
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{overview?.availability ?? "—"}</Badge>
              <span className="type-xs text-[var(--text-muted)]">
                as of {formatWhen(overview?.asOf)}
              </span>
              {overview?.note ? (
                <span className="type-xs text-[var(--text-muted)]">{overview.note}</span>
              ) : null}
            </div>
            <DenseTable
              headers={[
                "Metric",
                "Value",
                "Data quality",
                "As of",
                "Def. ver.",
                "Note",
              ]}
              testId="rev-overview-table"
            >
              {(overview?.metrics ?? []).map((m) => (
                <MetricRow key={m.metricCode} m={m} />
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "metrics" ? (
        <section className="space-y-3" data-testid="rev-metrics">
          <h2 className="type-md font-semibold">Metric definitions</h2>
          <QueryShell
            loading={metricsQuery.isLoading}
            error={metricsQuery.error}
            empty={metricDefs.items.length === 0}
            emptyTitle="No metric definitions"
            emptyDescription="Register and publish definitions before recording snapshots."
          >
            <DenseTable
              headers={["Code", "Name", "Status", "Version", "Actions"]}
              testId="rev-metrics-table"
            >
              {metricDefs.items.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2 font-medium">{d.code}</td>
                  <td className="px-3 py-2">{d.name}</td>
                  <td className="px-3 py-2">
                    <Badge
                      tone={
                        String(d.status).toUpperCase() === "PUBLISHED"
                          ? "success"
                          : "warning"
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{d.version}</td>
                  <td className="px-3 py-2">
                    {canManageMetrics &&
                    String(d.status).toUpperCase() !== "PUBLISHED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate(d.id)}
                        data-testid={`publish-metric-${d.code}`}
                      >
                        Publish
                      </Button>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          {overview && !overviewUnavailable ? (
            <div className="space-y-2">
              <h3 className="type-sm font-semibold">Latest snapshot cells</h3>
              <DenseTable headers={["Code", "Value", "Quality"]}>
                {overview.metrics.map((m) => (
                  <tr key={`snap-${m.metricCode}`}>
                    <td className="px-3 py-2">{m.metricCode}</td>
                    <td className="px-3 py-2">
                      {formatAmount(m.value, m.currency, String(m.dataQuality))}
                    </td>
                    <td className="px-3 py-2">
                      <DataQualityBadge quality={m.dataQuality} />
                    </td>
                  </tr>
                ))}
              </DenseTable>
            </div>
          ) : null}
          {hasEdgePermission(permissions, "platform:business:metrics:manage") ? (
            <div className="space-y-3 border-t border-[var(--border)] pt-[var(--space-4)]">
              <h3 className="type-sm font-semibold">Unit economics & profitability</h3>
              <p className="type-xs text-[var(--text-muted)]">
                CAC/LTV and margin stay UNAVAILABLE when costs are not supplied.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  className={fieldControlClass}
                  type="date"
                  aria-label="UE period start"
                  value={uePeriodStart}
                  onChange={(e) => setUePeriodStart(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  type="date"
                  aria-label="UE period end"
                  value={uePeriodEnd}
                  onChange={(e) => setUePeriodEnd(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  maxLength={3}
                  aria-label="UE currency"
                  value={ueCurrency}
                  onChange={(e) => setUeCurrency(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  placeholder="Acquisition spend"
                  value={ueSpend}
                  onChange={(e) => setUeSpend(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  placeholder="New customers"
                  value={ueCustomers}
                  onChange={(e) => setUeCustomers(e.target.value)}
                />
                <Button
                  disabled={
                    !uePeriodStart ||
                    !uePeriodEnd ||
                    recordUeMutation.isPending
                  }
                  onClick={() => recordUeMutation.mutate()}
                >
                  Record unit economics
                </Button>
              </div>
              {ueMsg ? (
                <p className="type-xs text-[var(--text-secondary)]">{ueMsg}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <input
                  className={fieldControlClass}
                  type="date"
                  aria-label="PP period start"
                  value={ppPeriodStart}
                  onChange={(e) => setPpPeriodStart(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  type="date"
                  aria-label="PP period end"
                  value={ppPeriodEnd}
                  onChange={(e) => setPpPeriodEnd(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  placeholder="Revenue amount"
                  value={ppRevenue}
                  onChange={(e) => setPpRevenue(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  maxLength={3}
                  value={ppCurrency}
                  onChange={(e) => setPpCurrency(e.target.value)}
                />
                <Button
                  disabled={
                    !ppPeriodStart ||
                    !ppPeriodEnd ||
                    !ppRevenue ||
                    recordPpMutation.isPending
                  }
                  onClick={() => recordPpMutation.mutate()}
                >
                  Record product profitability
                </Button>
              </div>
              {ppMsg ? (
                <p className="type-xs text-[var(--text-secondary)]">{ppMsg}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "mrr" ? (
        <section className="space-y-3" data-testid="rev-mrr">
          <h2 className="type-md font-semibold">MRR movement compute</h2>
          <p className="type-sm text-[var(--text-secondary)]">
            Empty projection lines yield UNAVAILABLE buckets — never fabricated
            collected cash. Annual amounts normalize by /12.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className={fieldControlClass}
              type="datetime-local"
              aria-label="Period start"
              value={mrrPeriodStart}
              onChange={(e) => setMrrPeriodStart(e.target.value)}
            />
            <input
              className={fieldControlClass}
              type="datetime-local"
              aria-label="Period end"
              value={mrrPeriodEnd}
              onChange={(e) => setMrrPeriodEnd(e.target.value)}
            />
            <input
              className={fieldControlClass}
              aria-label="Currency"
              value={mrrCurrency}
              onChange={(e) => setMrrCurrency(e.target.value)}
              maxLength={3}
            />
            <Button
              disabled={
                !mrrPeriodStart || !mrrPeriodEnd || computeMrrMutation.isPending
              }
              onClick={() => computeMrrMutation.mutate()}
              data-testid="compute-mrr"
            >
              Compute
            </Button>
          </div>
          {mrrError ? (
            <EdgeErrorState title="Compute failed" description={mrrError} />
          ) : null}
          {mrrResult ? (
            <pre
              className="overflow-x-auto border border-[var(--border)] bg-[var(--surface-muted)] p-3 type-xs"
              data-testid="mrr-result"
            >
              {JSON.stringify(mrrResult, null, 2)}
            </pre>
          ) : (
            <EdgeEmptyState
              title="No MRR result yet"
              description="Provide a period and compute. Without source lines, buckets stay UNAVAILABLE."
            />
          )}
        </section>
      ) : null}

      {activeTab === "cash" ? (
        <section className="space-y-3" data-testid="rev-cash">
          <h2 className="type-md font-semibold">
            Invoiced / collected / receivables
          </h2>
          <p className="type-sm text-[var(--text-secondary)]">
            Contracted ≠ invoiced ≠ collected. Engine reads P6 invoice and
            payment refs only — unpaid never becomes collected. Manual cash
            snapshots require source=engine.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className={fieldControlClass}
              type="datetime-local"
              aria-label="Cash period start"
              value={cashPeriodStart}
              onChange={(e) => setCashPeriodStart(e.target.value)}
            />
            <input
              className={fieldControlClass}
              type="datetime-local"
              aria-label="Cash period end"
              value={cashPeriodEnd}
              onChange={(e) => setCashPeriodEnd(e.target.value)}
            />
            <input
              className={fieldControlClass}
              aria-label="Cash currency"
              value={cashCurrency}
              onChange={(e) => setCashCurrency(e.target.value)}
              maxLength={3}
            />
            <Button
              disabled={
                !cashPeriodStart ||
                !cashPeriodEnd ||
                computeCashMutation.isPending
              }
              onClick={() => computeCashMutation.mutate()}
              data-testid="compute-cash"
            >
              Compute cash
            </Button>
          </div>
          {cashError ? (
            <EdgeErrorState title="Cash compute failed" description={cashError} />
          ) : null}
          {cashResult ? (
            <pre
              className="overflow-x-auto border border-[var(--border)] bg-[var(--surface-muted)] p-3 type-xs"
              data-testid="cash-result"
            >
              {JSON.stringify(cashResult, null, 2)}
            </pre>
          ) : (
            <EdgeEmptyState
              title="No cash result yet"
              description="Provide a period. Empty P6 feeds stay UNAVAILABLE — never silent zero."
            />
          )}
        </section>
      ) : null}

      {activeTab === "retention" ? (
        <section className="space-y-3" data-testid="rev-retention">
          <h2 className="type-md font-semibold">Retention (GRR / NRR)</h2>
          <p className="type-sm text-[var(--text-secondary)]">
            GRR excludes expansion and reactivation. Missing snapshots →
            UNAVAILABLE — never invent 100%.
          </p>
          <div className="space-y-2 border-b border-[var(--border)] pb-[var(--space-4)]">
            <h3 className="type-sm font-semibold">Churn compute</h3>
            <p className="type-xs text-[var(--text-muted)]">
              Denominators must be supplied — never invented.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                className={fieldControlClass}
                type="date"
                value={churnStart}
                onChange={(e) => setChurnStart(e.target.value)}
              />
              <input
                className={fieldControlClass}
                type="date"
                value={churnEnd}
                onChange={(e) => setChurnEnd(e.target.value)}
              />
              <Button
                disabled={
                  !churnStart || !churnEnd || computeChurnMutation.isPending
                }
                onClick={() => computeChurnMutation.mutate()}
              >
                Compute churn
              </Button>
            </div>
            {churnResult ? (
              <pre className="type-xs overflow-auto rounded border border-[var(--border)] p-2">
                {churnResult}
              </pre>
            ) : null}
          </div>
          <QueryShell
            loading={retentionQuery.isLoading}
            error={null}
            empty={
              !retentionQuery.data ||
              unwrapData<{ availability: string }>(retentionQuery.data)
                ?.availability === "UNAVAILABLE"
            }
            emptyTitle="Retention unavailable"
            emptyDescription={
              unwrapData<{ note?: string }>(retentionQuery.data)?.note ??
              "No GRR/NRR retention snapshots stored — values not invented."
            }
          >
            {(() => {
              const r = unwrapData<{
                availability: string;
                asOf: string;
                grr: RevenueOverviewMetric | null;
                nrr: RevenueOverviewMetric | null;
                note?: string;
              }>(retentionQuery.data);
              if (!r) return null;
              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">{r.availability}</Badge>
                    <span className="type-xs text-[var(--text-muted)]">
                      as of {formatWhen(r.asOf)}
                    </span>
                    {r.note ? (
                      <span className="type-xs text-[var(--text-muted)]">
                        {r.note}
                      </span>
                    ) : null}
                  </div>
                  <DenseTable headers={["Metric", "Value", "Quality", "Note"]}>
                    {[r.grr, r.nrr].filter(Boolean).map((m) => (
                      <MetricRow key={m!.metricCode} m={m!} />
                    ))}
                  </DenseTable>
                </div>
              );
            })()}
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "forecasts" ? (
        <section className="space-y-3" data-testid="rev-forecasts">
          <h2 className="type-md font-semibold">Forecasts</h2>
          <p className="type-sm text-[var(--text-secondary)]">
            Draft forecasts only — full scenario models &amp; SoD approve deferred.
          </p>
          {!canForecast ? (
            <EdgeForbiddenState description="Requires platform:revenue:forecast." />
          ) : (
            <div className="flex flex-wrap gap-2">
              <input
                className={fieldControlClass}
                placeholder="Code"
                aria-label="Forecast code"
                value={forecastCode}
                onChange={(e) => setForecastCode(e.target.value)}
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                aria-label="Forecast name"
                value={forecastName}
                onChange={(e) => setForecastName(e.target.value)}
              />
              <input
                className={fieldControlClass}
                type="datetime-local"
                aria-label="Horizon start"
                value={forecastStart}
                onChange={(e) => setForecastStart(e.target.value)}
              />
              <input
                className={fieldControlClass}
                type="datetime-local"
                aria-label="Horizon end"
                value={forecastEnd}
                onChange={(e) => setForecastEnd(e.target.value)}
              />
              <input
                className={fieldControlClass}
                aria-label="Currency"
                value={forecastCurrency}
                onChange={(e) => setForecastCurrency(e.target.value)}
                maxLength={3}
              />
              <Button
                disabled={
                  !forecastCode ||
                  !forecastName ||
                  !forecastStart ||
                  !forecastEnd ||
                  createForecastMutation.isPending
                }
                onClick={() => createForecastMutation.mutate()}
                data-testid="create-forecast"
              >
                Create draft
              </Button>
            </div>
          )}
          {forecastMsg ? (
            <p className="type-sm text-[var(--text-secondary)]">{forecastMsg}</p>
          ) : null}
          {forecastsQuery.isLoading ? (
            <EdgeLoadingState label="Loading forecasts..." />
          ) : forecastItems.length === 0 ? (
            <EdgeEmptyState
              title="No forecasts yet"
              description="Create a DRAFT forecast below. Publish/approve and rich models are deferred."
            />
          ) : (
            <ul className="space-y-2" data-testid="forecasts-list">
              {forecastItems.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border-subtle)] px-3 py-2"
                >
                  <span className="type-sm font-medium">
                    {f.code} — {f.name}
                  </span>
                  <span className="type-xs text-[var(--text-tertiary)]">
                    {f.status} · {f.currency} ·{" "}
                    {String(f.verticalId ?? "platform-wide")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === "renewals" ? (
        <section className="space-y-3" data-testid="rev-renewals">
          <h2 className="type-md font-semibold">Renewal intelligence</h2>
          <p className="type-sm text-[var(--text-secondary)]">
            Read-only P5 signals — P11 does not mutate renewal contracts.
          </p>
          <QueryShell
            loading={renewalsQuery.isLoading}
            error={renewalsQuery.error}
            empty={
              unwrapPage<{ id?: string }>(renewalsQuery.data).items.length === 0 &&
              !unwrapData<{ items?: unknown[]; note?: string }>(renewalsQuery.data)
                ?.items?.length
            }
            emptyTitle="No upcoming renewals scored"
            emptyDescription="PARTIAL when P5 fields are missing — scores are never invented."
          >
            <DenseTable
              headers={["Subscription", "Days", "Score", "Severity", "Reasons"]}
              testId="rev-renewals-table"
            >
              {(
                unwrapData<{
                  items?: Array<{
                    subscriptionId: string;
                    daysToRenewal: number | null;
                    score: number;
                    severity: string;
                    reasons: string[];
                  }>;
                }>(renewalsQuery.data)?.items ??
                unwrapPage<{
                  subscriptionId: string;
                  daysToRenewal: number | null;
                  score: number;
                  severity: string;
                  reasons: string[];
                }>(renewalsQuery.data).items
              ).map((r) => (
                <tr key={r.subscriptionId}>
                  <td className="px-3 py-2 font-mono type-xs">
                    {r.subscriptionId.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">{r.daysToRenewal ?? "—"}</td>
                  <td className="px-3 py-2">{r.score}</td>
                  <td className="px-3 py-2">
                    <Badge tone="warning">{r.severity}</Badge>
                  </td>
                  <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                    {(r.reasons ?? []).join("; ") || "—"}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "assurance" ? (
        <section className="space-y-3" data-testid="rev-assurance">
          <h2 className="type-md font-semibold">Revenue assurance</h2>
          <p className="type-sm text-[var(--text-secondary)]">
            Leakage cases store soft refs to P5/P6 only — P11 is not a second
            ledger. Evidence-driven detectors never invent missing fields.
          </p>
          {!canReconcile ? (
            <EdgeForbiddenState description="Requires platform:revenue:reconcile." />
          ) : (
            <div className="flex flex-wrap gap-2">
              <input
                className={fieldControlClass}
                placeholder="Case title"
                aria-label="Leakage title"
                value={leakTitle}
                onChange={(e) => setLeakTitle(e.target.value)}
              />
              <input
                className={fieldControlClass}
                placeholder="Detection source"
                aria-label="Detection source"
                value={leakSource}
                onChange={(e) => setLeakSource(e.target.value)}
              />
              <Button
                disabled={!leakTitle || createLeakMutation.isPending}
                onClick={() => createLeakMutation.mutate()}
                data-testid="create-leakage"
              >
                Open case
              </Button>
              <Button
                variant="secondary"
                disabled={createLeakMutation.isPending}
                onClick={() => {
                  void edgeApi
                    .runRevenueAssuranceScan()
                    .then(() => setLeakMsg("Assurance scan requested."))
                    .catch((e) => setLeakMsg(errMsg(e)));
                }}
                data-testid="run-assurance-scan"
              >
                Run scan
              </Button>
            </div>
          )}
          {leakMsg ? (
            <p className="type-sm text-[var(--text-secondary)]">{leakMsg}</p>
          ) : (
            <EdgeEmptyState
              title="No leakage list endpoint yet"
              description="Open a DETECTED case manually. Case inventory UI deferred — no fabricated leakage totals."
            />
          )}
        </section>
      ) : null}

      {activeTab === "commissions" ? (
        <section className="space-y-3" data-testid="rev-commissions">
          <h2 className="type-md font-semibold">Commissions</h2>
          <QueryShell
            loading={commissionQuery.isLoading}
            error={commissionQuery.error}
            empty={false}
            emptyTitle=""
            emptyDescription=""
          >
            {(() => {
              const placeholder = unwrapData<{
                availability?: string;
                note?: string;
              }>(commissionQuery.data);
              return (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="warning">
                      {placeholder?.availability ?? "PARTIAL"}
                    </Badge>
                    <span className="type-sm text-[var(--text-secondary)]">
                      {placeholder?.note ??
                        "List deferred; create + calculate available. No fabricated totals."}
                    </span>
                  </div>
                </div>
              );
            })()}
          </QueryShell>
          {canCommissionCalc ? (
            <div className="flex flex-wrap gap-2">
              <input
                className={fieldControlClass}
                placeholder="Plan code"
                aria-label="Plan code"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
              />
              <input
                className={fieldControlClass}
                placeholder="Plan name"
                aria-label="Plan name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
              <input
                className={fieldControlClass}
                type="datetime-local"
                aria-label="Effective from"
                value={planFrom}
                onChange={(e) => setPlanFrom(e.target.value)}
              />
              <Button
                disabled={
                  !planCode ||
                  !planName ||
                  !planFrom ||
                  createPlanMutation.isPending
                }
                onClick={() => createPlanMutation.mutate()}
                data-testid="create-commission-plan"
              >
                Create plan
              </Button>
            </div>
          ) : null}
          {canCommissionCalc ? (
            <div
              className="space-y-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-3)]"
              data-testid="commission-calc-panel"
            >
              <p className="type-sm font-semibold">Calculate snapshot</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className={fieldControlClass}
                  placeholder="Plan id (uuid)"
                  aria-label="Calculation plan id"
                  value={calcPlanId}
                  onChange={(e) => setCalcPlanId(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  placeholder="Calculation key"
                  aria-label="Calculation key"
                  value={calcKey}
                  onChange={(e) => setCalcKey(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  type="date"
                  aria-label="Calculation period start"
                  value={calcStart}
                  onChange={(e) => setCalcStart(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  type="date"
                  aria-label="Calculation period end"
                  value={calcEnd}
                  onChange={(e) => setCalcEnd(e.target.value)}
                />
                <input
                  className={fieldControlClass}
                  type="number"
                  placeholder="Basis amount (optional)"
                  aria-label="Basis amount"
                  value={calcBasis}
                  onChange={(e) => setCalcBasis(e.target.value)}
                />
                <Button
                  disabled={
                    !calcPlanId.trim() ||
                    !calcKey.trim() ||
                    !calcStart ||
                    !calcEnd ||
                    calculateMutation.isPending
                  }
                  onClick={() => calculateMutation.mutate()}
                  data-testid="calculate-commission"
                >
                  {calculateMutation.isPending ? "Calculating..." : "Calculate"}
                </Button>
              </div>
              {calcMsg ? (
                <p className="type-sm text-[var(--text-secondary)]">{calcMsg}</p>
              ) : null}
              {calculation ? (
                <div
                  className="space-y-[var(--space-2)] rounded-[var(--radius-sm)] border border-[var(--border)] p-[var(--space-3)]"
                  data-testid="commission-calc-result"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        calculation.status === "APPROVED"
                          ? "success"
                          : calculation.status === "REJECTED" ||
                              calculation.status === "SUPERSEDED"
                            ? "danger"
                            : "info"
                      }
                    >
                      {calculation.status}
                    </Badge>
                    <span className="type-sm font-mono">
                      {calculation.totalAmount != null
                        ? `${calculation.totalAmount} ${calculation.currency}`
                        : "Amount unavailable — no basis (never invented)"}
                    </span>
                    <span className="type-xs text-[var(--text-muted)]">
                      quality {calculation.dataQuality} · v
                      {calculation.version}
                    </span>
                  </div>
                  {canCommissionApprove &&
                  (calculation.status === "CALCULATED" ||
                    calculation.status === "PENDING_APPROVAL") ? (
                    <Button
                      variant="outline"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                      data-testid="approve-commission"
                    >
                      {approveMutation.isPending
                        ? "Approving..."
                        : "Approve (SoD)"}
                    </Button>
                  ) : null}
                  {approveMsg ? (
                    <p className="type-sm text-[var(--text-secondary)]">
                      {approveMsg}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {planMsg ? (
            <p className="type-sm text-[var(--text-secondary)]">{planMsg}</p>
          ) : null}
        </section>
      ) : null}

      {activeTab === "alerts" ? (
        <section className="space-y-3" data-testid="rev-alerts">
          <h2 className="type-md font-semibold">Business alerts</h2>
          <QueryShell
            loading={alertsQuery.isLoading}
            error={alertsQuery.error}
            empty={unwrapPage(alertsQuery.data).items.length === 0}
            emptyTitle="No open alerts"
            emptyDescription="Threshold policies evaluate stored snapshots only — no invented breaches."
          >
            <DenseTable
              headers={["Code", "Title", "Severity", "Status", "Metric"]}
              testId="rev-alerts-table"
            >
              {unwrapPage<{
                id: string;
                code: string;
                title: string;
                severity: string;
                status: string;
                metricCode?: string | null;
              }>(alertsQuery.data).items.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-medium">{a.code}</td>
                  <td className="px-3 py-2">{a.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone="warning">{a.severity}</Badge>
                  </td>
                  <td className="px-3 py-2">{a.status}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {a.metricCode ?? "—"}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}

      {activeTab === "reports" ? (
        <section className="space-y-3" data-testid="rev-reports">
          <h2 className="type-md font-semibold">Business reports &amp; audit</h2>
          {hasEdgePermission(permissions, "platform:business:manage") ? (
            <form
              className="flex flex-wrap gap-2 rounded border border-[var(--border)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                createDecisionMutation.mutate();
              }}
            >
              <input
                className={fieldControlClass}
                placeholder="Decision code"
                value={decisionCode}
                onChange={(e) => setDecisionCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Title"
                value={decisionTitle}
                onChange={(e) => setDecisionTitle(e.target.value)}
                required
              />
              <Button type="submit" disabled={createDecisionMutation.isPending}>
                Record decision
              </Button>
              {decisionMsg ? (
                <p className="w-full type-xs text-[var(--text-secondary)]">
                  {decisionMsg}
                </p>
              ) : null}
            </form>
          ) : null}
          <QueryShell
            loading={reportsQuery.isLoading}
            error={reportsQuery.error}
            empty={unwrapPage(reportsQuery.data).items.length === 0}
            emptyTitle="No generated reports"
            emptyDescription="Report generation freezes metric definition versions — no live fabricated totals."
          >
            <DenseTable
              headers={["Code", "Title", "Type", "As of", "Status"]}
              testId="rev-reports-table"
            >
              {unwrapPage<{
                id: string;
                code: string;
                title: string;
                reportType: string;
                asOf: string;
                status: string;
              }>(reportsQuery.data).items.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{r.code}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">{r.reportType}</td>
                  <td className="px-3 py-2">{formatWhen(r.asOf)}</td>
                  <td className="px-3 py-2">{r.status}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          <QueryShell
            loading={auditQuery.isLoading}
            error={auditQuery.error}
            empty={unwrapPage(auditQuery.data).items.length === 0}
            emptyTitle="No audit events"
            emptyDescription="P11 business audit trail is empty — nothing fabricated for reporting."
          >
            <DenseTable
              headers={["When", "Type", "Aggregate", "Actor"]}
              testId="rev-audit-table"
            >
              {unwrapPage<{
                id: string;
                createdAt: string;
                eventType: string;
                aggregateType: string;
                aggregateId: string;
                actorId: string | null;
              }>(auditQuery.data).items.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2">{formatWhen(e.createdAt)}</td>
                  <td className="px-3 py-2">{e.eventType}</td>
                  <td className="px-3 py-2">
                    {e.aggregateType}/{e.aggregateId.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">{e.actorId ?? "—"}</td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
        </section>
      ) : null}
    </EdgeStudioShell>
  );
}
