"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListOrUuidField } from "@/components/edge/list-or-uuid-field";
import { fieldControlClass } from "@/components/ui/field-control";
import { LiveCompleteAdapterStatusBadge } from "@/components/edge/live-complete/adapter-status-badge";
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
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type Tab =
  | "overview"
  | "accounts"
  | "invoices"
  | "payments"
  | "collections"
  | "reconciliation"
  | "reports"
  | "configuration";

const TABS: { id: Tab; label: string; permission: string }[] = [
  {
    id: "overview",
    label: "Overview",
    permission: "platform:billing:reports:read",
  },
  {
    id: "accounts",
    label: "Accounts",
    permission: "platform:billing:accounts:read",
  },
  {
    id: "invoices",
    label: "Invoices",
    permission: "platform:billing:invoices:read",
  },
  {
    id: "payments",
    label: "Payments",
    permission: "platform:billing:payments:read",
  },
  {
    id: "collections",
    label: "Collections",
    permission: "platform:billing:collections:manage",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    permission: "platform:billing:reconciliation:execute",
  },
  {
    id: "reports",
    label: "Reports",
    permission: "platform:billing:reports:read",
  },
  {
    id: "configuration",
    label: "Configuration",
    permission: "platform:billing:policies:manage",
  },
];

const BILLING_SECTION_IDS = TABS.map((t) => t.id) as Tab[];

const BILLING_STUDIO_GROUPS: {
  title: string;
  itemIds: Tab[];
}[] = [
  { title: "Overview", itemIds: ["overview", "reports"] },
  { title: "Accounts", itemIds: ["accounts"] },
  { title: "Invoices & payments", itemIds: ["invoices", "payments"] },
  {
    title: "Collections & disputes",
    itemIds: ["collections", "reconciliation"],
  },
  { title: "Schedules & tax", itemIds: ["configuration"] },
];

function unwrap<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function asRows(payload: unknown): Record<string, unknown>[] {
  const inner = unwrap<unknown>(payload);
  if (Array.isArray(inner)) {
    return inner as Record<string, unknown>[];
  }
  const items = (inner as { items?: unknown[] } | undefined)?.items;
  return (items as Record<string, unknown>[] | undefined) ?? [];
}

export default function EdgeBillingPage() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading billing studio…" />}>
      <EdgeBillingStudio />
    </Suspense>
  );
}

function EdgeBillingStudio() {
  const { permissions, isLoading: platformLoading, activeVerticalId } =
    useEdgePlatform();
  const queryClient = useQueryClient();
  const [tab, setTab] = useStudioSectionParam<Tab>(
    "overview",
    BILLING_SECTION_IDS,
  );
  const [accountForm, setAccountForm] = useState({
    commercialAccountId: "",
    currency: "USD",
    paymentTermsDays: "30",
  });
  const [lookupAccountId, setLookupAccountId] = useState("");
  const [draftInvoiceForm, setDraftInvoiceForm] = useState({
    subscriptionId: "",
    periodId: "",
  });
  const [invoiceOps, setInvoiceOps] = useState({
    invoiceId: "",
    voidReason: "",
  });
  const [previewForm, setPreviewForm] = useState({
    currency: "USD",
    description: "Line item",
    quantity: "1",
    unitPrice: "100",
  });
  const [previewResult, setPreviewResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    billingAccountId: "",
    invoiceId: "",
    amount: "",
    currency: "USD",
  });
  const [confirmIntentId, setConfirmIntentId] = useState("");
  const [cadenceForm, setCadenceForm] = useState({
    subscriptionId: "",
    billingFrequency: "MONTHLY",
    setupFeeAmount: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    subscriptionId: "",
    billingAccountId: "",
    frequency: "MONTHLY",
  });
  const [scheduleLookupSubId, setScheduleLookupSubId] = useState("");
  const [partyForm, setPartyForm] = useState({
    partyRole: "BILL_TO",
    legalName: "",
    email: "",
  });
  const [disputeForm, setDisputeForm] = useState({
    billingAccountId: "",
    amount: "",
    currency: "USD",
    provider: "sandbox",
    invoiceId: "",
  });
  const [collectionInspectId, setCollectionInspectId] = useState("");
  const [refundForm, setRefundForm] = useState({
    paymentIntentId: "",
    amount: "",
    currency: "USD",
    reason: "",
  });
  const [geoFilter, setGeoFilter] = useState({ country: "CI", currency: "XOF" });
  const [pmForm, setPmForm] = useState({
    billingAccountId: "",
    provider: "sandbox",
    providerMethodRef: "",
    methodType: "MOBILE_MONEY",
    brand: "MTN",
    country: "CI",
    currency: "XOF",
  });
  const [recentInvoices, setRecentInvoices] = useState<
    Record<string, unknown>[]
  >([]);
  const [recentIntents, setRecentIntents] = useState<
    Record<string, unknown>[]
  >([]);

  const canReadAny = useMemo(
    () =>
      TABS.some((t) => hasEdgePermission(permissions, t.permission)) ||
      hasEdgePermission(permissions, "platform:billing:accounts:read"),
    [permissions],
  );

  const overviewQuery = useQuery({
    queryKey: ["edge", "billing", "overview", activeVerticalId],
    queryFn: () =>
      edgeApi.getBillingOverview({ verticalId: activeVerticalId ?? undefined }),
    enabled:
      (tab === "overview" || tab === "reports") && canReadAny,
  });

  const analyticsQuery = useQuery({
    queryKey: ["edge", "billing", "analytics", activeVerticalId],
    queryFn: () =>
      edgeApi.getBillingAnalytics({ verticalId: activeVerticalId ?? undefined }),
    enabled:
      (tab === "overview" || tab === "reports") && canReadAny,
  });

  const cashTruthQuery = useQuery({
    queryKey: ["edge", "billing", "cash-truth", activeVerticalId],
    queryFn: async () => {
      const res = await edgeApi.getBillingCashTruth({
        currency: "USD",
        verticalId: activeVerticalId ?? undefined,
      });
      return (
        unwrap<Record<string, unknown>>(res) ??
        (res as { data?: Record<string, unknown> })?.data ??
        (res as Record<string, unknown>)
      );
    },
    enabled:
      (tab === "overview" || tab === "reports") && canReadAny,
  });

  const accountsQuery = useQuery({
    queryKey: ["edge", "billing", "accounts"],
    queryFn: () => edgeApi.listBillingAccounts(),
    enabled:
      (tab === "accounts" ||
        tab === "payments" ||
        tab === "invoices" ||
        tab === "collections" ||
        tab === "configuration" ||
        tab === "reconciliation") &&
      canReadAny,
  });

  const commercialAccountsQuery = useQuery({
    queryKey: ["edge", "sales", "accounts", "billing-picker"],
    queryFn: () => edgeApi.listSalesAccounts({ limit: 100 }),
    enabled: tab === "accounts" && canReadAny,
  });

  const invoicesQuery = useQuery({
    queryKey: ["edge", "billing", "invoices", activeVerticalId],
    queryFn: () =>
      edgeApi.listBillingInvoices({
        limit: 50,
        verticalId: activeVerticalId ?? undefined,
      }),
    enabled:
      (tab === "invoices" ||
        tab === "collections" ||
        tab === "payments" ||
        tab === "reconciliation") &&
      canReadAny,
  });

  const creditNotesQuery = useQuery({
    queryKey: ["edge", "billing", "credit-notes"],
    queryFn: () => edgeApi.listBillingCreditNotes(),
    enabled: tab === "invoices" && canReadAny,
  });

  const paymentsQuery = useQuery({
    queryKey: ["edge", "billing", "payments"],
    queryFn: () => edgeApi.listBillingPayments({ limit: 50 }),
    enabled: tab === "payments" && canReadAny,
  });

  const geoMethodsQuery = useQuery({
    queryKey: ["edge", "billing", "geo-payment-methods", geoFilter],
    queryFn: async () => {
      const res = await edgeApi.listGeoPaymentMethods(geoFilter);
      return unwrap<Record<string, unknown>>(res) ?? res;
    },
    enabled: tab === "payments" && canReadAny,
  });

  const collectionsQuery = useQuery({
    queryKey: ["edge", "billing", "collections"],
    queryFn: () => edgeApi.listCollectionCases(),
    enabled: tab === "collections" && canReadAny,
  });

  const reconRunsQuery = useQuery({
    queryKey: ["edge", "billing", "recon-runs"],
    queryFn: () => edgeApi.listBillingReconciliationRuns(),
    enabled: tab === "reconciliation" && canReadAny,
  });

  const reconExceptionsQuery = useQuery({
    queryKey: ["edge", "billing", "recon-exceptions"],
    queryFn: () => edgeApi.listReconciliationExceptions({ status: "OPEN" }),
    enabled: tab === "reconciliation" && canReadAny,
  });

  const policiesQuery = useQuery({
    queryKey: ["edge", "billing", "policies"],
    queryFn: () => edgeApi.listBillingPolicies(),
    enabled: tab === "configuration" && canReadAny,
  });

  const taxJurisdictionsQuery = useQuery({
    queryKey: ["edge", "billing", "tax-jurisdictions"],
    queryFn: () => edgeApi.listTaxJurisdictions(),
    enabled: tab === "configuration" && canReadAny,
  });

  const fxRatesQuery = useQuery({
    queryKey: ["edge", "billing", "fx"],
    queryFn: () => edgeApi.listBillingFxRates(),
    enabled: tab === "configuration" && canReadAny,
  });

  const accountDetailQuery = useQuery({
    queryKey: ["edge", "billing", "account", lookupAccountId],
    queryFn: () => edgeApi.getBillingAccount(lookupAccountId),
    enabled: Boolean(lookupAccountId) && tab === "accounts" && canReadAny,
  });

  const accountJournalQuery = useQuery({
    queryKey: ["edge", "billing", "journal", lookupAccountId],
    queryFn: () => edgeApi.listBillingAccountJournal(lookupAccountId, 40),
    enabled:
      Boolean(lookupAccountId) && tab === "accounts" && canReadAny,
  });

  const accountPartiesQuery = useQuery({
    queryKey: ["edge", "billing", "parties", lookupAccountId],
    queryFn: () => edgeApi.listBillingAccountParties(lookupAccountId),
    enabled:
      Boolean(lookupAccountId) && tab === "accounts" && canReadAny,
  });

  const billingSchedulesQuery = useQuery({
    queryKey: ["edge", "billing", "schedules", scheduleLookupSubId],
    queryFn: () => edgeApi.listBillingSchedules(scheduleLookupSubId.trim()),
    enabled:
      tab === "configuration" &&
      Boolean(scheduleLookupSubId.trim()) &&
      canReadAny,
  });

  const disputesQuery = useQuery({
    queryKey: ["edge", "billing", "disputes"],
    queryFn: () => edgeApi.listBillingDisputes(),
    enabled: tab === "reconciliation" && canReadAny,
  });

  const collectionDetailQuery = useQuery({
    queryKey: ["edge", "billing", "collection", collectionInspectId],
    queryFn: () => edgeApi.getBillingCollectionCase(collectionInspectId),
    enabled:
      tab === "collections" &&
      Boolean(collectionInspectId.trim()) &&
      canReadAny,
  });

  const subscriptionsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "billing-picker"],
    queryFn: () => edgeApi.listSubscriptions({ limit: 100 }),
    enabled: (tab === "invoices" || tab === "configuration") && canReadAny,
  });

  const billingAccountPickOptions = useMemo(
    () =>
      asRows(accountsQuery.data).map((a) => ({
        id: String(a.id),
        label: `${String(a.accountNumber ?? a.id)} · ${String(a.currency ?? "")}`,
      })),
    [accountsQuery.data],
  );

  const commercialAccountPickOptions = useMemo(
    () =>
      asRows(commercialAccountsQuery.data).map((ca) => ({
        id: String(ca.id),
        label: String(ca.name ?? ca.legalName ?? ca.accountNumber ?? ca.id),
      })),
    [commercialAccountsQuery.data],
  );

  const invoicePickOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const inv of [...asRows(invoicesQuery.data), ...recentInvoices]) {
      const id = String(inv.id);
      if (!map.has(id)) {
        map.set(id, {
          id,
          label: `${String(inv.invoiceNumber ?? id.slice(0, 8))} · ${String(inv.status ?? "")}`,
        });
      }
    }
    return [...map.values()];
  }, [invoicesQuery.data, recentInvoices]);

  const subscriptionPickOptions = useMemo(
    () =>
      asRows(subscriptionsQuery.data).map((s) => ({
        id: String(s.id),
        label: `${String(s.subscriptionNumber ?? s.id).slice(0, 16)} · ${String(s.status ?? "")}`,
      })),
    [subscriptionsQuery.data],
  );

  const collectionCasePickOptions = useMemo(
    () =>
      asRows(collectionsQuery.data).map((c) => ({
        id: String(c.id),
        label: `Case ${String(c.id).slice(0, 8)} · ${String(c.status ?? "")}`,
      })),
    [collectionsQuery.data],
  );

  const paymentIntentPickOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const pi of [...asRows(paymentsQuery.data), ...recentIntents]) {
      if (!pi.id) continue;
      const id = String(pi.id);
      map.set(id, {
        id,
        label: `${id.slice(0, 8)}… · ${String(pi.status)} · ${String(pi.amount)} ${String(pi.currency)}`,
      });
    }
    return [...map.values()];
  }, [paymentsQuery.data, recentIntents]);

  const [collectionForm, setCollectionForm] = useState({
    billingAccountId: "",
    invoiceId: "",
  });
  const [reconProvider, setReconProvider] = useState("http_webhook");

  const createAccount = useMutation({
    mutationFn: () =>
      edgeApi.createBillingAccount({
        commercialAccountId: accountForm.commercialAccountId,
        currency: accountForm.currency || undefined,
        paymentTermsDays: accountForm.paymentTermsDays
          ? Number(accountForm.paymentTermsDays)
          : undefined,
      }),
    onSuccess: () => {
      setAccountForm({
        commercialAccountId: "",
        currency: "USD",
        paymentTermsDays: "30",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "accounts"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "overview"],
      });
    },
  });

  const draftInvoice = useMutation({
    mutationFn: () =>
      edgeApi.createDraftInvoiceFromSubscription({
        subscriptionId: draftInvoiceForm.subscriptionId,
        periodId: draftInvoiceForm.periodId || null,
      }),
    onSuccess: (res) => {
      const inv = unwrap<Record<string, unknown>>(res);
      if (inv) {
        const withSub = {
          ...inv,
          subscriptionId:
            inv.subscriptionId ?? draftInvoiceForm.subscriptionId ?? null,
        };
        setRecentInvoices((prev) => [withSub, ...prev].slice(0, 20));
      }
      setDraftInvoiceForm({ subscriptionId: "", periodId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "overview"],
      });
    },
  });

  const approveInvoice = useMutation({
    mutationFn: () => edgeApi.approveBillingInvoice(invoiceOps.invoiceId),
    onSuccess: (res) => {
      const inv = unwrap<Record<string, unknown>>(res);
      if (inv?.id) {
        setRecentInvoices((prev) =>
          prev.map((r) =>
            String(r.id) === String(inv.id) ? { ...r, ...inv } : r,
          ),
        );
      }
    },
  });

  const issueInvoice = useMutation({
    mutationFn: () => edgeApi.issueBillingInvoice(invoiceOps.invoiceId),
    onSuccess: (res) => {
      const inv = unwrap<Record<string, unknown>>(res);
      if (inv?.id) {
        setRecentInvoices((prev) =>
          prev.map((r) =>
            String(r.id) === String(inv.id) ? { ...r, ...inv } : r,
          ),
        );
      }
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "overview"],
      });
    },
  });

  const voidInvoice = useMutation({
    mutationFn: () =>
      edgeApi.voidBillingInvoice(invoiceOps.invoiceId, {
        reason: invoiceOps.voidReason,
      }),
    onSuccess: (res) => {
      const inv = unwrap<Record<string, unknown>>(res);
      if (inv?.id) {
        setRecentInvoices((prev) =>
          prev.map((r) =>
            String(r.id) === String(inv.id) ? { ...r, ...inv } : r,
          ),
        );
      }
      setInvoiceOps((s) => ({ ...s, voidReason: "" }));
    },
  });

  const previewInvoice = useMutation({
    mutationFn: () =>
      edgeApi.previewBillingInvoice({
        currency: previewForm.currency,
        lines: [
          {
            description: previewForm.description,
            quantity: previewForm.quantity,
            unitPrice: previewForm.unitPrice,
          },
        ],
      }),
    onSuccess: (res) => {
      setPreviewResult(
        unwrap<Record<string, unknown>>(res) ??
          (res as Record<string, unknown>),
      );
    },
  });

  const markOverdue = useMutation({
    mutationFn: () => edgeApi.markOverdueBillingInvoices(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "invoices"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "overview"],
      });
    },
  });

  const createPaymentIntent = useMutation({
    mutationFn: () =>
      edgeApi.createBillingPaymentIntent({
        billingAccountId: paymentForm.billingAccountId,
        invoiceId: paymentForm.invoiceId || null,
        amount: paymentForm.amount,
        currency: paymentForm.currency,
      }),
    onSuccess: (res) => {
      const intent = unwrap<Record<string, unknown>>(res);
      if (intent) {
        setRecentIntents((prev) => [intent, ...prev].slice(0, 20));
      }
      setPaymentForm((s) => ({ ...s, amount: "", invoiceId: "" }));
    },
  });

  const confirmPayment = useMutation({
    mutationFn: () =>
      edgeApi.confirmBillingPaymentIntent(confirmIntentId),
    onSuccess: (res) => {
      const intent = unwrap<Record<string, unknown>>(res);
      if (intent?.id) {
        setRecentIntents((prev) =>
          prev.map((r) =>
            String(r.id) === String(intent.id) ? { ...r, ...intent } : r,
          ),
        );
      }
      setConfirmIntentId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "overview"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "analytics"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "payments"],
      });
    },
  });

  const openCollection = useMutation({
    mutationFn: () => edgeApi.openCollectionCase(collectionForm),
    onSuccess: () => {
      setCollectionForm({ billingAccountId: "", invoiceId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "collections"],
      });
    },
  });

  const runRecon = useMutation({
    mutationFn: () =>
      edgeApi.runBillingReconciliation({ provider: reconProvider }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "recon-runs"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "billing", "recon-exceptions"],
      });
    },
  });

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    return BILLING_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .map((id) => TABS.find((t) => t.id === id))
        .filter((t): t is (typeof TABS)[number] => Boolean(t))
        .filter((t) => hasEdgePermission(permissions, t.permission))
        .map((t) => ({ id: t.id, label: t.label })),
    })).filter((g) => g.items.length > 0);
  }, [permissions]);

  if (platformLoading) {
    return <EdgeLoadingState label="Loading billing…" />;
  }
  if (!canReadAny) return <EdgeForbiddenState />;

  const overview = unwrap<{
    accounts?: number;
    openInvoices?: number;
    issuedUnpaidTotal?: string;
    collectedTotal?: string;
    refundedTotal?: string;
    recognizedRevenue?: string | null;
    recognitionMethod?: string;
    disclaimer?: string;
  }>(overviewQuery.data);

  const analytics = unwrap<{
    billedTotal?: string;
    collectedTotal?: string;
    refundedTotal?: string;
    recognizedRevenue?: string | null;
    recognitionMethod?: string;
    currency?: string;
    disclaimer?: string;
  }>(analyticsQuery.data);

  const accounts = asRows(accountsQuery.data);
  const serverInvoices = asRows(invoicesQuery.data);
  const creditNotes = asRows(creditNotesQuery.data);
  const collections = asRows(collectionsQuery.data);
  const reconRuns = asRows(reconRunsQuery.data);
  const reconExceptions = asRows(reconExceptionsQuery.data);
  const policies = asRows(policiesQuery.data);
  const taxJurisdictions = asRows(taxJurisdictionsQuery.data);
  const fxRates = asRows(fxRatesQuery.data);
  const serverPayments = asRows(paymentsQuery.data);

  return (
    <EdgeStudioShell
      title="Billing studio"
      description="Billing accounts, invoicing, payment intents, and financial reporting. Collected = succeeded intents; recognized revenue follows the active policy (default CASH_BASED_NET after migrate 094)."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => setTab(id as Tab)}
      actions={
        <>
          <LiveCompleteAdapterStatusBadge />
          <Link
            href="/edge/subscriptions"
            className="type-sm text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Subscriptions →
          </Link>
          <Link
            href="/edge/billing/portal"
            className="type-sm text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Customer portal →
          </Link>
        </>
      }
    >
      {tab === "overview" || tab === "reports" ? (
        overviewQuery.isLoading && analyticsQuery.isLoading ? (
          <EdgeLoadingState label="Loading financial snapshot…" />
        ) : overviewQuery.isError ? (
          <EdgeErrorState
            description={
              (overviewQuery.error as EdgeApiError)?.message ?? "Overview failed"
            }
            onRetry={() => void overviewQuery.refetch()}
          />
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Billing accounts" value={overview?.accounts ?? 0} />
              <MetricCard
                label="Open invoices"
                value={overview?.openInvoices ?? 0}
              />
              <MoneyCard
                label="Issued unpaid (AR)"
                amount={overview?.issuedUnpaidTotal ?? "0"}
              />
              <MoneyCard
                label="Collected (succeeded intents)"
                amount={overview?.collectedTotal ?? "0"}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <MoneyCard
                label={`Billed (${analytics?.currency ?? "USD"})`}
                amount={analytics?.billedTotal ?? "—"}
              />
              <MoneyCard
                label={`Collected (${analytics?.currency ?? "USD"})`}
                amount={analytics?.collectedTotal ?? "—"}
              />
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recognized ({overview?.recognitionMethod ?? analytics?.recognitionMethod ?? "—"})
                </p>
                <p className="mt-2 font-display text-3xl tabular-nums">
                  {overview?.recognizedRevenue ??
                    analytics?.recognizedRevenue ??
                    "—"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {overview?.disclaimer ??
                    analytics?.disclaimer ??
                    "Policy-driven recognition; not equated to billed revenue."}
                </p>
              </div>
            </div>
            <CashTruthPanel
              truth={cashTruthQuery.data as Record<string, unknown> | undefined}
              loading={cashTruthQuery.isLoading}
              error={cashTruthQuery.isError ? cashTruthQuery.error : null}
              onRetry={() => void cashTruthQuery.refetch()}
            />
            {tab === "reports" ? (
              <p className="text-sm text-muted-foreground">
                Contracted ≠ invoiced ≠ collected ≠ recognized. Refunds are
                subtracted under CASH_BASED_NET. DEFERRED_MANUAL leaves recognized
                null.
              </p>
            ) : null}
          </section>
        )
      ) : null}

      {tab === "accounts" ? (
        <EdgePermissionGate permission="platform:billing:accounts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:billing:accounts:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createAccount.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Create billing account
                </h2>
                <ListOrUuidField
                  value={accountForm.commercialAccountId}
                  onChange={(commercialAccountId) =>
                    setAccountForm((s) => ({ ...s, commercialAccountId }))
                  }
                  options={commercialAccountPickOptions}
                  placeholder="Select commercial account…"
                  fallbackPlaceholder="Commercial account ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={accountForm.currency}
                  onChange={(e) =>
                    setAccountForm((s) => ({ ...s, currency: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Payment terms (days)"
                  value={accountForm.paymentTermsDays}
                  onChange={(e) =>
                    setAccountForm((s) => ({
                      ...s,
                      paymentTermsDays: e.target.value,
                    }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createAccount.isPending}>
                    Create account
                  </Button>
                  {createAccount.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(createAccount.error as EdgeApiError)?.message ??
                        "Create failed"}
                    </p>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>

            <ListOrUuidField
              className="max-w-md"
              value={lookupAccountId}
              onChange={setLookupAccountId}
              options={billingAccountPickOptions}
              placeholder="Inspect billing account…"
              fallbackPlaceholder="Billing account ID"
            />

            {accountsQuery.isLoading ? (
              <EdgeLoadingState label="Loading accounts…" />
            ) : accountsQuery.isError ? (
              <EdgeErrorState
                description={
                  (accountsQuery.error as EdgeApiError)?.message ??
                  "Accounts failed"
                }
                onRetry={() => void accountsQuery.refetch()}
              />
            ) : !accounts.length ? (
              <EdgeEmptyState
                title="No billing accounts"
                description="Create a billing account linked to a commercial account to start invoicing."
              />
            ) : (
              <ul className="divide-y rounded-xl border border-border/70 text-sm">
                {accounts.map((a) => (
                  <li
                    key={String(a.id)}
                    className="flex flex-wrap items-center justify-between gap-2 p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {String(a.accountNumber ?? a.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Commercial · {String(a.commercialAccountId)} ·{" "}
                        {String(a.currency)} ·{" "}
                        <Badge tone="default">{String(a.status)}</Badge>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLookupAccountId(String(a.id))}
                    >
                      Inspect
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {lookupAccountId ? (
              accountDetailQuery.isLoading ? (
                <EdgeLoadingState label="Loading account…" />
              ) : accountDetailQuery.isError ? (
                <EdgeErrorState
                  description={
                    (accountDetailQuery.error as EdgeApiError)?.message ??
                    "Account lookup failed"
                  }
                  onRetry={() => void accountDetailQuery.refetch()}
                />
              ) : (
                <pre className="max-h-64 overflow-auto rounded-xl border border-border/70 bg-muted/30 p-3 text-xs">
                  {JSON.stringify(unwrap(accountDetailQuery.data), null, 2)}
                </pre>
              )
            ) : null}

            {lookupAccountId ? (
              <div className="space-y-4 rounded-xl border border-border/70 p-4">
                <h2 className="text-sm font-medium">Journal &amp; parties</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Ledger journal</p>
                    {accountJournalQuery.isLoading ? (
                      <EdgeLoadingState label="Journal…" />
                    ) : (
                      <pre className="max-h-48 overflow-auto rounded-lg bg-muted/30 p-2 text-xs">
                        {JSON.stringify(
                          unwrap(accountJournalQuery.data) ?? [],
                          null,
                          2,
                        )}
                      </pre>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Parties</p>
                    {accountPartiesQuery.isLoading ? (
                      <EdgeLoadingState label="Parties…" />
                    ) : (
                      <pre className="max-h-48 overflow-auto rounded-lg bg-muted/30 p-2 text-xs">
                        {JSON.stringify(
                          unwrap(accountPartiesQuery.data) ?? [],
                          null,
                          2,
                        )}
                      </pre>
                    )}
                  </div>
                </div>
                <EdgePermissionGate permission="platform:billing:accounts:update">
                  <form
                    className="grid gap-3 sm:grid-cols-4"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      void edgeApi
                        .upsertBillingAccountParty(lookupAccountId, {
                          partyRole: partyForm.partyRole,
                          legalName: partyForm.legalName,
                          email: partyForm.email || null,
                        })
                        .then(() => accountPartiesQuery.refetch());
                    }}
                  >
                    <select
                      className={fieldControlClass}
                      value={partyForm.partyRole}
                      onChange={(e) =>
                        setPartyForm((f) => ({
                          ...f,
                          partyRole: e.target.value,
                        }))
                      }
                    >
                      <option value="BILL_TO">BILL_TO</option>
                      <option value="SHIP_TO">SHIP_TO</option>
                      <option value="LEGAL_ENTITY">LEGAL_ENTITY</option>
                    </select>
                    <input
                      className={fieldControlClass}
                      placeholder="Legal name"
                      value={partyForm.legalName}
                      onChange={(e) =>
                        setPartyForm((f) => ({
                          ...f,
                          legalName: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      className={fieldControlClass}
                      placeholder="Email"
                      value={partyForm.email}
                      onChange={(e) =>
                        setPartyForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                    <Button type="submit">Upsert party</Button>
                  </form>
                </EdgePermissionGate>
              </div>
            ) : null}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "invoices" ? (
        <EdgePermissionGate permission="platform:billing:invoices:read">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Preview totals, draft from subscription, lifecycle actions by ID,
              mark overdue batch, and credit notes. Amount due / paid comes from
              the API — we do not invent paid status.
            </p>

            <EdgePermissionGate permission="platform:billing:invoices:preview">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  previewInvoice.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Invoice preview
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={previewForm.currency}
                  onChange={(e) =>
                    setPreviewForm((s) => ({ ...s, currency: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Description"
                  value={previewForm.description}
                  onChange={(e) =>
                    setPreviewForm((s) => ({
                      ...s,
                      description: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Quantity"
                  value={previewForm.quantity}
                  onChange={(e) =>
                    setPreviewForm((s) => ({ ...s, quantity: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Unit price"
                  value={previewForm.unitPrice}
                  onChange={(e) =>
                    setPreviewForm((s) => ({ ...s, unitPrice: e.target.value }))
                  }
                  required
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={previewInvoice.isPending}>
                    Preview totals
                  </Button>
                  {previewInvoice.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(previewInvoice.error as EdgeApiError)?.message ??
                        "Preview failed"}
                    </p>
                  ) : null}
                  {previewResult ? (
                    <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-2 text-xs">
                      {JSON.stringify(previewResult, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>

            <EdgePermissionGate permission="platform:billing:invoices:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  draftInvoice.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Draft invoice from subscription
                </h2>
                <ListOrUuidField
                  value={draftInvoiceForm.subscriptionId}
                  onChange={(subscriptionId) =>
                    setDraftInvoiceForm((s) => ({ ...s, subscriptionId }))
                  }
                  options={subscriptionPickOptions}
                  placeholder="Select subscription"
                  fallbackPlaceholder="Subscription ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Period ID (optional)"
                  value={draftInvoiceForm.periodId}
                  onChange={(e) =>
                    setDraftInvoiceForm((s) => ({
                      ...s,
                      periodId: e.target.value,
                    }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={draftInvoice.isPending}>
                    Create draft
                  </Button>
                  {draftInvoice.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(draftInvoice.error as EdgeApiError)?.message ??
                        "Draft failed"}
                    </p>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>

            <div className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2">
              <h2 className="sm:col-span-2 text-sm font-medium">
                Invoice lifecycle (by ID)
              </h2>
              <ListOrUuidField
                className="sm:col-span-2"
                value={invoiceOps.invoiceId}
                onChange={(invoiceId) =>
                  setInvoiceOps((s) => ({ ...s, invoiceId }))
                }
                options={invoicePickOptions}
                placeholder="Select invoice"
                fallbackPlaceholder="Invoice ID"
              />
              <EdgePermissionGate permission="platform:billing:invoices:approve">
                <Button
                  disabled={!invoiceOps.invoiceId || approveInvoice.isPending}
                  onClick={() => approveInvoice.mutate()}
                >
                  Approve
                </Button>
              </EdgePermissionGate>
              <EdgePermissionGate permission="platform:billing:invoices:issue">
                <Button
                  disabled={!invoiceOps.invoiceId || issueInvoice.isPending}
                  onClick={() => issueInvoice.mutate()}
                >
                  Issue
                </Button>
              </EdgePermissionGate>
              <input
                className={fieldControlClass + " sm:col-span-2"}
                placeholder="Void reason"
                value={invoiceOps.voidReason}
                onChange={(e) =>
                  setInvoiceOps((s) => ({ ...s, voidReason: e.target.value }))
                }
              />
              <EdgePermissionGate permission="platform:billing:invoices:void">
                <Button
                  variant="danger"
                  disabled={
                    !invoiceOps.invoiceId ||
                    !invoiceOps.voidReason ||
                    voidInvoice.isPending
                  }
                  onClick={() => voidInvoice.mutate()}
                >
                  Void
                </Button>
              </EdgePermissionGate>
              <EdgePermissionGate permission="platform:billing:invoices:issue">
                <Button
                  variant="secondary"
                  disabled={markOverdue.isPending}
                  onClick={() => markOverdue.mutate()}
                >
                  Mark overdue invoices
                </Button>
                {markOverdue.isError ? (
                  <p className="sm:col-span-2 text-sm text-destructive">
                    {(markOverdue.error as EdgeApiError)?.message ??
                      "Mark overdue failed"}
                  </p>
                ) : null}
                {markOverdue.isSuccess ? (
                  <p className="sm:col-span-2 text-xs text-muted-foreground">
                    Overdue batch completed — invoice list refreshed.
                  </p>
                ) : null}
              </EdgePermissionGate>
            </div>

            {invoicesQuery.isLoading ? (
              <EdgeLoadingState label="Loading invoices…" />
            ) : serverInvoices.length ? (
              <ul className="divide-y rounded-xl border border-border/70 text-sm">
                {serverInvoices.map((inv) => (
                  <li key={String(inv.id)} className="p-3">
                    <p className="font-medium">
                      {String(inv.invoiceNumber ?? inv.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status <Badge tone="default">{String(inv.status)}</Badge>
                      · Total {String(inv.total ?? "—")}{" "}
                      {String(inv.currency ?? "")} · Due{" "}
                      {String(inv.amountDue ?? "—")} · Paid{" "}
                      {String(inv.amountPaid ?? "0")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : recentInvoices.length ? (
              <ul className="divide-y rounded-xl border border-border/70 text-sm">
                {recentInvoices.map((inv) => {
                  const subId =
                    inv.subscriptionId != null &&
                    String(inv.subscriptionId).trim()
                      ? String(inv.subscriptionId).trim()
                      : null;
                  return (
                    <li key={String(inv.id)} className="p-3">
                      <p className="font-medium">
                        {String(inv.invoiceNumber ?? inv.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status <Badge tone="default">{String(inv.status)}</Badge>
                        · Total {String(inv.total)} {String(inv.currency)} · Due{" "}
                        {String(inv.amountDue)} · Paid{" "}
                        {String(inv.amountPaid ?? "0")}
                        {subId ? (
                          <>
                            {" "}
                            ·{" "}
                            <Link
                              href={`/edge/subscriptions/${encodeURIComponent(subId)}`}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              Subscription
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EdgeEmptyState
                title="No invoices"
                description="Draft an invoice from a subscription or run lifecycle actions by ID."
              />
            )}

            <div>
              <h2 className="mb-2 text-sm font-medium">Credit notes</h2>
              {creditNotesQuery.isLoading ? (
                <EdgeLoadingState label="Loading credit notes…" />
              ) : creditNotesQuery.isError ? (
                <EdgeErrorState
                  description={
                    (creditNotesQuery.error as EdgeApiError)?.message ??
                    "Credit notes failed"
                  }
                  onRetry={() => void creditNotesQuery.refetch()}
                />
              ) : !creditNotes.length ? (
                <EdgeEmptyState
                  title="No credit notes"
                  description="Credit notes appear after void/credit actions on issued invoices."
                />
              ) : (
                <ul className="divide-y rounded-xl border border-border/70 text-sm">
                  {creditNotes.map((cn) => (
                    <li key={String(cn.id)} className="p-3">
                      <p className="font-medium">
                        {String(cn.creditNoteNumber ?? cn.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invoice {String(cn.invoiceId ?? "—")} · Amount{" "}
                        {String(cn.amount ?? cn.total ?? "—")}{" "}
                        {String(cn.currency ?? "")} ·{" "}
                        {String(cn.reason ?? "—")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "payments" ? (
        <EdgePermissionGate permission="platform:billing:payments:read">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Collected totals count only intents with status{" "}
              <code className="text-xs">SUCCEEDED</code>. Geo methods are
              beachhead availability — not cash proof.
            </p>

            <div className="space-y-3 rounded-xl border border-border/70 p-4">
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-sm">
                  Country
                  <input
                    className={fieldControlClass}
                    value={geoFilter.country}
                    onChange={(e) =>
                      setGeoFilter((s) => ({ ...s, country: e.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Currency
                  <input
                    className={fieldControlClass}
                    value={geoFilter.currency}
                    onChange={(e) =>
                      setGeoFilter((s) => ({ ...s, currency: e.target.value }))
                    }
                  />
                </label>
              </div>
              {geoMethodsQuery.isLoading ? (
                <EdgeLoadingState label="Loading geo methods…" />
              ) : (
                <ul className="divide-y rounded-xl border border-border/60 text-sm">
                  {(
                    ((geoMethodsQuery.data as { methods?: Record<string, unknown>[] })
                      ?.methods ?? []) as Record<string, unknown>[]
                  ).map((m) => (
                    <li key={String(m.code)} className="p-2">
                      <span className="font-medium">{String(m.code)}</span> ·{" "}
                      <Badge>{String(m.methodType)}</Badge>
                      {m.brand ? ` · ${String(m.brand)}` : ""} ·{" "}
                      {String(m.status)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <EdgePermissionGate permission="platform:billing:payments:initiate">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void edgeApi.registerBillingPaymentMethod(
                    pmForm.billingAccountId,
                    {
                      provider: pmForm.provider,
                      providerMethodRef: pmForm.providerMethodRef,
                      methodType: pmForm.methodType,
                      brand: pmForm.brand || null,
                      country: pmForm.country,
                      currency: pmForm.currency,
                    },
                  );
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Register tokenized payment method (geo-gated)
                </h2>
                <ListOrUuidField
                  value={pmForm.billingAccountId}
                  onChange={(billingAccountId) =>
                    setPmForm((s) => ({ ...s, billingAccountId }))
                  }
                  options={billingAccountPickOptions}
                  placeholder="Select billing account"
                  fallbackPlaceholder="Billing account ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Provider method ref (token)"
                  value={pmForm.providerMethodRef}
                  onChange={(e) =>
                    setPmForm((s) => ({
                      ...s,
                      providerMethodRef: e.target.value,
                    }))
                  }
                  required
                />
                <select
                  className={fieldControlClass}
                  value={pmForm.methodType}
                  onChange={(e) =>
                    setPmForm((s) => ({ ...s, methodType: e.target.value }))
                  }
                >
                  <option value="MOBILE_MONEY">MOBILE_MONEY</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="MANUAL">MANUAL</option>
                </select>
                <input
                  className={fieldControlClass}
                  placeholder="Brand (MTN/ORANGE/WAVE/MOOV)"
                  value={pmForm.brand}
                  onChange={(e) =>
                    setPmForm((s) => ({ ...s, brand: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Country"
                  value={pmForm.country}
                  onChange={(e) =>
                    setPmForm((s) => ({ ...s, country: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={pmForm.currency}
                  onChange={(e) =>
                    setPmForm((s) => ({ ...s, currency: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit">Register method</Button>
                </div>
              </form>
            </EdgePermissionGate>

            <EdgePermissionGate permission="platform:billing:payments:initiate">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createPaymentIntent.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Create payment intent
                </h2>
                <ListOrUuidField
                  value={paymentForm.billingAccountId}
                  onChange={(billingAccountId) =>
                    setPaymentForm((s) => ({ ...s, billingAccountId }))
                  }
                  options={billingAccountPickOptions}
                  placeholder="Select billing account"
                  fallbackPlaceholder="Billing account ID"
                  required
                />
                <ListOrUuidField
                  value={paymentForm.invoiceId}
                  onChange={(invoiceId) =>
                    setPaymentForm((s) => ({ ...s, invoiceId }))
                  }
                  options={invoicePickOptions}
                  placeholder="Select invoice (optional)"
                  fallbackPlaceholder="Invoice ID (optional)"
                />
                <input
                  className={fieldControlClass}
                  placeholder="Amount (decimal string)"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((s) => ({ ...s, amount: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={paymentForm.currency}
                  onChange={(e) =>
                    setPaymentForm((s) => ({ ...s, currency: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={createPaymentIntent.isPending}
                  >
                    Initiate
                  </Button>
                </div>
              </form>
            </EdgePermissionGate>

            <EdgePermissionGate permission="platform:billing:payments:confirm">
              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 p-4">
                <ListOrUuidField
                  className="min-w-[16rem] flex-1"
                  value={confirmIntentId}
                  onChange={setConfirmIntentId}
                  options={paymentIntentPickOptions}
                  placeholder="Select payment intent"
                  fallbackPlaceholder="Payment intent ID to confirm"
                />
                <Button
                  disabled={!confirmIntentId || confirmPayment.isPending}
                  onClick={() => confirmPayment.mutate()}
                >
                  Confirm capture
                </Button>
              </div>
            </EdgePermissionGate>

            <EdgePermissionGate permission="platform:billing:refunds:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void edgeApi
                    .createBillingRefund({
                      paymentIntentId: refundForm.paymentIntentId,
                      amount: refundForm.amount,
                      currency: refundForm.currency,
                      reason: refundForm.reason || undefined,
                    })
                    .then(() => paymentsQuery.refetch());
                }}
              >
                <p className="sm:col-span-2 text-sm text-muted-foreground">
                  Refunds require a SUCCEEDED intent — never invent collected
                  cash.
                </p>
                <ListOrUuidField
                  value={refundForm.paymentIntentId}
                  onChange={(paymentIntentId) =>
                    setRefundForm((s) => ({ ...s, paymentIntentId }))
                  }
                  options={paymentIntentPickOptions}
                  placeholder="Select payment intent"
                  fallbackPlaceholder="Payment intent ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Amount"
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm((s) => ({ ...s, amount: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={refundForm.currency}
                  onChange={(e) =>
                    setRefundForm((s) => ({ ...s, currency: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Reason"
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm((s) => ({ ...s, reason: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit">Request refund</Button>
                </div>
              </form>
            </EdgePermissionGate>

            {recentIntents.length ? (
              <ul className="divide-y rounded-xl border border-border/70 text-sm">
                {recentIntents.map((pi) => (
                  <li key={String(pi.id)} className="p-3">
                    <p className="font-medium">{String(pi.id)}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge tone="default">{String(pi.status)}</Badge> ·{" "}
                      {String(pi.amount)} {String(pi.currency)}
                      {pi.status === "SUCCEEDED"
                        ? " · captured"
                        : " · not counted in collected until SUCCEEDED"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EdgeEmptyState
                title="No session payment intents"
                description="Initiate a payment intent; only SUCCEEDED intents count toward collected totals."
              />
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "collections" ? (
        <EdgePermissionGate permission="platform:billing:collections:manage">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                openCollection.mutate();
              }}
            >
              <h2 className="sm:col-span-2 text-sm font-medium">
                Open collection case
              </h2>
              <ListOrUuidField
                value={collectionForm.billingAccountId}
                onChange={(billingAccountId) =>
                  setCollectionForm((s) => ({ ...s, billingAccountId }))
                }
                options={billingAccountPickOptions}
                placeholder="Billing account…"
                fallbackPlaceholder="Billing account ID"
                required
              />
              <ListOrUuidField
                value={collectionForm.invoiceId}
                onChange={(invoiceId) =>
                  setCollectionForm((s) => ({ ...s, invoiceId }))
                }
                options={invoicePickOptions}
                placeholder="Invoice…"
                fallbackPlaceholder="Invoice ID"
                required
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={openCollection.isPending}>
                  Open case
                </Button>
              </div>
            </form>
            {collectionsQuery.isLoading ? (
              <EdgeLoadingState label="Loading collections…" />
            ) : !collections.length ? (
              <EdgeEmptyState
                title="No collection cases"
                description="Open a case for an overdue issued invoice to start dunning."
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void edgeApi
                        .processDunningScan({ limit: 50 })
                        .then(() => collectionsQuery.refetch())
                    }
                  >
                    Run dunning scan
                  </Button>
                </div>
                <ul className="divide-y rounded-xl border border-border/70 text-sm">
                  {collections.map((c) => (
                    <li
                      key={String(c.id)}
                      className="flex flex-wrap items-center justify-between gap-2 p-3"
                    >
                      <div>
                        <p className="font-medium">
                          Case {String(c.id).slice(0, 8)} ·{" "}
                          <Badge>{String(c.status)}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invoice {String(c.invoiceId)} · policy{" "}
                          {String(c.policyCode ?? "—")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void edgeApi
                              .applyCollectionDunningPolicy(String(c.id))
                              .then(() => collectionsQuery.refetch())
                          }
                        >
                          Apply policy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void edgeApi
                              .dispatchDunningNotification(String(c.id))
                              .then(() => collectionsQuery.refetch())
                          }
                        >
                          Notify
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void edgeApi
                              .escalateCollectionCase(String(c.id))
                              .then(() => collectionsQuery.refetch())
                          }
                        >
                          Escalate → suspend
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            void edgeApi
                              .resolveCollectionCase(String(c.id))
                              .then(() => collectionsQuery.refetch())
                          }
                        >
                          Resolve → reactivate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCollectionInspectId(String(c.id))}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void edgeApi
                              .recordBillingCollectionDunning(String(c.id), {
                                channel: "EMAIL",
                              })
                              .then(() => collectionsQuery.refetch())
                          }
                        >
                          Log dunning
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                <ListOrUuidField
                  className="max-w-md"
                  value={collectionInspectId}
                  onChange={setCollectionInspectId}
                  options={collectionCasePickOptions}
                  placeholder="Inspect collection case…"
                  fallbackPlaceholder="Collection case ID"
                />
                {collectionInspectId ? (
                  <pre className="max-h-56 overflow-auto rounded-xl border border-border/70 bg-muted/30 p-3 text-xs">
                    {collectionDetailQuery.isLoading
                      ? "Loading…"
                      : JSON.stringify(
                          unwrap(collectionDetailQuery.data),
                          null,
                          2,
                        )}
                  </pre>
                ) : null}
              </>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "reconciliation" ? (
        <EdgePermissionGate permission="platform:billing:reconciliation:execute">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 p-4">
              <label className="grid gap-1 text-sm">
                Provider
                <select
                  className={fieldControlClass}
                  value={reconProvider}
                  onChange={(e) => setReconProvider(e.target.value)}
                >
                  <option value="http_webhook">http_webhook</option>
                  <option value="unavailable">unavailable</option>
                </select>
              </label>
              <Button
                onClick={() => runRecon.mutate()}
                disabled={runRecon.isPending}
              >
                Run reconciliation
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h2 className="mb-2 text-sm font-medium">Runs</h2>
                {!reconRuns.length ? (
                  <EdgeEmptyState
                    title="No runs"
                    description="Execute a reconciliation run against provider transaction mirrors."
                  />
                ) : (
                  <ul className="divide-y rounded-xl border border-border/70 text-sm">
                    {reconRuns.map((r) => (
                      <li key={String(r.id)} className="p-3">
                        <p className="font-medium">
                          {String(r.provider)} ·{" "}
                          <Badge>{String(r.status)}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {JSON.stringify(r.summary ?? {})}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className="mb-2 text-sm font-medium">Open exceptions</h2>
                {!reconExceptions.length ? (
                  <EdgeEmptyState
                    title="No open exceptions"
                    description="Matched runs produce no open exceptions."
                  />
                ) : (
                  <ul className="divide-y rounded-xl border border-border/70 text-sm">
                    {reconExceptions.map((ex) => (
                      <li
                        key={String(ex.id)}
                        className="flex items-center justify-between gap-2 p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {String(ex.exceptionType)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {String(ex.internalRef ?? "—")} /{" "}
                            {String(ex.providerRef ?? "—")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            void edgeApi
                              .resolveReconciliationException(String(ex.id))
                              .then(() => reconExceptionsQuery.refetch())
                          }
                        >
                          Resolve
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border/70 p-4">
              <h2 className="text-sm font-medium">Payment disputes</h2>
              <form
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void edgeApi
                    .createBillingDispute({
                      billingAccountId: disputeForm.billingAccountId,
                      amount: disputeForm.amount,
                      currency: disputeForm.currency,
                      provider: disputeForm.provider,
                      invoiceId: disputeForm.invoiceId || null,
                    })
                    .then(() => disputesQuery.refetch());
                }}
              >
                <ListOrUuidField
                  value={disputeForm.billingAccountId}
                  onChange={(billingAccountId) =>
                    setDisputeForm((f) => ({ ...f, billingAccountId }))
                  }
                  options={billingAccountPickOptions}
                  placeholder="Billing account…"
                  fallbackPlaceholder="Billing account ID"
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Amount"
                  value={disputeForm.amount}
                  onChange={(e) =>
                    setDisputeForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={disputeForm.currency}
                  onChange={(e) =>
                    setDisputeForm((f) => ({ ...f, currency: e.target.value }))
                  }
                />
                <ListOrUuidField
                  value={disputeForm.invoiceId}
                  onChange={(invoiceId) =>
                    setDisputeForm((f) => ({ ...f, invoiceId }))
                  }
                  options={invoicePickOptions}
                  placeholder="Invoice (optional)"
                  fallbackPlaceholder="Invoice ID (optional)"
                />
                <Button type="submit">Open dispute</Button>
              </form>
              {disputesQuery.isLoading ? (
                <EdgeLoadingState label="Disputes…" />
              ) : (
                <ul className="divide-y rounded-lg border border-border/70 text-sm">
                  {asRows(disputesQuery.data).map((d) => (
                    <li
                      key={String(d.id)}
                      className="flex flex-wrap items-center justify-between gap-2 p-3"
                    >
                      <span>
                        {String(d.amount)} {String(d.currency)} ·{" "}
                        <Badge>{String(d.status)}</Badge>
                      </span>
                      {String(d.status) === "OPEN" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            void edgeApi
                              .resolveBillingDispute(String(d.id), {
                                status: "RESOLVED",
                              })
                              .then(() => disputesQuery.refetch())
                          }
                        >
                          Resolve
                        </Button>
                      ) : null}
                    </li>
                  ))}
                  {!asRows(disputesQuery.data).length ? (
                    <li className="p-3 text-xs text-muted-foreground">
                      No disputes
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "configuration" ? (
        <EdgePermissionGate permission="platform:billing:policies:manage">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  void edgeApi.generateBillingExport({ exportType: "FULL" })
                }
              >
                Generate accounting export
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void edgeApi.processDueBillingSchedules()}
              >
                Process due billing schedules
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Billing policies, FX registry, revenue recognition, and ERP export
              snapshots. Payment engine is pluggable via{" "}
              <code>BILLING_PAYMENT_ADAPTER</code> (
              <code>hyperswitch</code> = orchestration only, never catalogue
              SoT).
            </p>
            <EdgePermissionGate permission="platform:billing:schedules:manage">
              <form
                className="mb-4 grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void edgeApi
                    .createBillingSchedule({
                      subscriptionId: scheduleForm.subscriptionId,
                      billingAccountId: scheduleForm.billingAccountId,
                      frequency: scheduleForm.frequency,
                    })
                    .then(() => {
                      setScheduleLookupSubId(scheduleForm.subscriptionId);
                    });
                }}
              >
                <p className="sm:col-span-2 lg:col-span-4 text-sm font-medium">
                  Create billing schedule
                </p>
                <ListOrUuidField
                  value={scheduleForm.subscriptionId}
                  onChange={(subscriptionId) =>
                    setScheduleForm((s) => ({ ...s, subscriptionId }))
                  }
                  options={subscriptionPickOptions}
                  placeholder="Select subscription"
                  fallbackPlaceholder="Subscription ID"
                  required
                />
                <ListOrUuidField
                  value={scheduleForm.billingAccountId}
                  onChange={(billingAccountId) =>
                    setScheduleForm((s) => ({ ...s, billingAccountId }))
                  }
                  options={billingAccountPickOptions}
                  placeholder="Billing account…"
                  fallbackPlaceholder="Billing account ID"
                  required
                />
                <select
                  className={fieldControlClass}
                  value={scheduleForm.frequency}
                  onChange={(e) =>
                    setScheduleForm((s) => ({ ...s, frequency: e.target.value }))
                  }
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="ANNUAL">ANNUAL</option>
                </select>
                <Button type="submit">Create schedule</Button>
              </form>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <ListOrUuidField
                  value={scheduleLookupSubId}
                  onChange={setScheduleLookupSubId}
                  options={subscriptionPickOptions}
                  placeholder="List schedules for subscription"
                  fallbackPlaceholder="Subscription ID"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!scheduleLookupSubId.trim()}
                  onClick={() => void billingSchedulesQuery.refetch()}
                >
                  List schedules
                </Button>
              </div>
              {billingSchedulesQuery.data ? (
                <pre className="mb-4 max-h-40 overflow-auto rounded-lg bg-muted/30 p-2 text-xs">
                  {JSON.stringify(
                    unwrap(billingSchedulesQuery.data) ?? [],
                    null,
                    2,
                  )}
                </pre>
              ) : null}
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void edgeApi.configureBillingCadence({
                    subscriptionId: cadenceForm.subscriptionId,
                    billingFrequency: cadenceForm.billingFrequency,
                    setupFeeAmount: cadenceForm.setupFeeAmount || null,
                  });
                }}
              >
                <p className="sm:col-span-2 text-sm font-medium">
                  Cadence &amp; setup fee
                </p>
                <ListOrUuidField
                  value={cadenceForm.subscriptionId}
                  onChange={(subscriptionId) =>
                    setCadenceForm((s) => ({ ...s, subscriptionId }))
                  }
                  options={subscriptionPickOptions}
                  placeholder="Select subscription"
                  fallbackPlaceholder="Subscription ID"
                  required
                />
                <select
                  className={fieldControlClass}
                  value={cadenceForm.billingFrequency}
                  onChange={(e) =>
                    setCadenceForm((s) => ({
                      ...s,
                      billingFrequency: e.target.value,
                    }))
                  }
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="SEMI_ANNUAL">SEMI_ANNUAL</option>
                  <option value="ANNUAL">ANNUAL</option>
                  <option value="ENTERPRISE_CONTRACT">ENTERPRISE_CONTRACT</option>
                  <option value="ONE_TIME">ONE_TIME</option>
                </select>
                <input
                  className={fieldControlClass}
                  placeholder="Setup fee (optional, one-time)"
                  value={cadenceForm.setupFeeAmount}
                  onChange={(e) =>
                    setCadenceForm((s) => ({
                      ...s,
                      setupFeeAmount: e.target.value,
                    }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit">Save cadence</Button>
                </div>
              </form>
            </EdgePermissionGate>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h2 className="mb-2 text-sm font-medium">Policies</h2>
                {policiesQuery.isLoading ? (
                  <EdgeLoadingState label="Loading policies…" />
                ) : !policies.length ? (
                  <EdgeEmptyState
                    title="No policies"
                    description="Seed includes DUNNING_DEFAULT after migrate 092+."
                  />
                ) : (
                  <ul className="divide-y rounded-xl border border-border/70 text-sm">
                    {policies.map((p) => (
                      <li key={String(p.id)} className="p-3">
                        <p className="font-medium">
                          {String(p.code)} · {String(p.policyType)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {JSON.stringify(p.rules ?? {})}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className="mb-2 text-sm font-medium">FX rates</h2>
                {!fxRates.length ? (
                  <EdgeEmptyState
                    title="No FX rates"
                    description="Identity rates seed after migrate 093."
                  />
                ) : (
                  <ul className="divide-y rounded-xl border border-border/70 text-sm">
                    {fxRates.map((fx) => (
                      <li key={String(fx.id)} className="p-3">
                        {String(fx.baseCurrency)}→{String(fx.quoteCurrency)} ={" "}
                        {String(fx.rate)} ({String(fx.source)} v
                        {String(fx.version)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="lg:col-span-2">
                <h2 className="mb-2 text-sm font-medium">Tax jurisdictions</h2>
                {taxJurisdictionsQuery.isLoading ? (
                  <EdgeLoadingState label="Loading tax jurisdictions…" />
                ) : !taxJurisdictions.length ? (
                  <EdgeEmptyState
                    title="No tax jurisdictions"
                    description="Jurisdictions appear after tax seed/migrate."
                  />
                ) : (
                  <ul className="divide-y rounded-xl border border-border/70 text-sm">
                    {taxJurisdictions.map((j) => (
                      <li key={String(j.id ?? j.code)} className="p-3">
                        <p className="font-medium">
                          {String(j.code ?? j.name ?? j.id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {String(j.country ?? "—")} ·{" "}
                          {String(j.category ?? j.taxType ?? "—")} ·{" "}
                          {String(j.rate ?? j.status ?? "")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <p className="text-sm">
              <Link
                href="/edge/subscriptions"
                className="text-primary underline-offset-2 hover:underline"
              >
                Open Subscriptions console
              </Link>
            </p>
          </section>
        </EdgePermissionGate>
      ) : null}
    </EdgeStudioShell>
  );
}

function formatCashBucket(bucket: unknown): string {
  if (!bucket || typeof bucket !== "object") return "—";
  const b = bucket as { amount?: number | null; dataQuality?: string };
  if (b.dataQuality === "UNAVAILABLE" || b.amount == null) {
    return "UNAVAILABLE";
  }
  return String(b.amount);
}

function CashTruthPanel({
  truth,
  loading,
  error,
  onRetry,
}: {
  truth?: Record<string, unknown>;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (loading) {
    return <EdgeLoadingState label="Loading cash truth…" />;
  }
  if (error) {
    return (
      <EdgeErrorState
        description={(error as EdgeApiError)?.message ?? "Cash truth failed"}
        onRetry={onRetry}
      />
    );
  }
  if (!truth) return null;
  const currency = String(truth.currency ?? "USD");
  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-4">
      <div>
        <h2 className="text-sm font-medium">Cash truth</h2>
        <p className="text-xs text-muted-foreground">
          Contracted ≠ invoiced ≠ collected ({currency})
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MoneyCard
          label="Contracted (MRR)"
          amount={formatCashBucket(truth.contracted)}
        />
        <MoneyCard
          label="Invoiced"
          amount={formatCashBucket(truth.invoiced)}
        />
        <MoneyCard
          label="Collected"
          amount={formatCashBucket(truth.collected)}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}

function MoneyCard({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl tabular-nums">{amount}</p>
    </div>
  );
}
