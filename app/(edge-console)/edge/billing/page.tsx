"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
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
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
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
  const [paymentForm, setPaymentForm] = useState({
    billingAccountId: "",
    invoiceId: "",
    amount: "",
    currency: "USD",
  });
  const [confirmIntentId, setConfirmIntentId] = useState("");
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
    queryKey: ["edge", "billing", "overview"],
    queryFn: () => edgeApi.getBillingOverview(),
    enabled:
      (tab === "overview" || tab === "reports") && canReadAny,
  });

  const analyticsQuery = useQuery({
    queryKey: ["edge", "billing", "analytics"],
    queryFn: () => edgeApi.getBillingAnalytics(),
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
        tab === "collections") &&
      canReadAny,
  });

  const commercialAccountsQuery = useQuery({
    queryKey: ["edge", "sales", "accounts", "billing-picker"],
    queryFn: () => edgeApi.listSalesAccounts({ limit: 100 }),
    enabled: tab === "accounts" && canReadAny,
  });

  const invoicesQuery = useQuery({
    queryKey: ["edge", "billing", "invoices"],
    queryFn: () => edgeApi.listBillingInvoices({ limit: 50 }),
    enabled: (tab === "invoices" || tab === "collections") && canReadAny,
  });

  const paymentsQuery = useQuery({
    queryKey: ["edge", "billing", "payments"],
    queryFn: () => edgeApi.listBillingPayments({ limit: 50 }),
    enabled: tab === "payments" && canReadAny,
  });

  const collectionsQuery = useQuery({
    queryKey: ["edge", "billing", "collections"],
    queryFn: () => edgeApi.listCollectionCases(),
    enabled: tab === "collections" && canReadAny,
  });

  const reconRunsQuery = useQuery({
    queryKey: ["edge", "billing", "recon-runs"],
    queryFn: () => edgeApi.listReconciliationRuns(),
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
        setRecentInvoices((prev) => [inv, ...prev].slice(0, 20));
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
  const commercialAccounts = asRows(commercialAccountsQuery.data);
  const serverInvoices = asRows(invoicesQuery.data);
  const collections = asRows(collectionsQuery.data);
  const reconRuns = asRows(reconRunsQuery.data);
  const reconExceptions = asRows(reconExceptionsQuery.data);
  const policies = asRows(policiesQuery.data);
  const fxRates = asRows(fxRatesQuery.data);
  const serverPayments = asRows(paymentsQuery.data);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Billing &amp; Financial Operations
        </p>
        <h1 className="font-display text-3xl tracking-tight">
          Okapi Edge Billing
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Billing accounts, invoicing, payment intents, and financial reporting.
          Collected = succeeded intents; recognized revenue follows the active
          policy (default CASH_BASED_NET after migrate 094).
        </p>
        <p className="text-sm">
          <Link
            href="/edge/billing/portal"
            className="text-primary underline-offset-2 hover:underline"
          >
            Open customer billing portal →
          </Link>
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {TABS.map((t) =>
          hasEdgePermission(permissions, t.permission) ? (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "ghost"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ) : null,
        )}
      </nav>

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
            {tab === "reports" ? (
              <p className="text-sm text-muted-foreground">
                Billed ≠ collected ≠ recognized. Refunds are subtracted under
                CASH_BASED_NET. DEFERRED_MANUAL leaves recognized null.
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
                <select
                  className={fieldControlClass}
                  value={accountForm.commercialAccountId}
                  onChange={(e) =>
                    setAccountForm((s) => ({
                      ...s,
                      commercialAccountId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select commercial account…</option>
                  {commercialAccounts.map((ca) => (
                    <option key={String(ca.id)} value={String(ca.id)}>
                      {String(ca.name ?? ca.legalName ?? ca.accountNumber ?? ca.id)}
                    </option>
                  ))}
                </select>
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
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "invoices" ? (
        <EdgePermissionGate permission="platform:billing:invoices:read">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invoice registry list is not exposed on{" "}
              <code className="text-xs">EdgeBillingController</code>; this tab
              shows drafts you create in-session and lifecycle actions by ID.
              Amount due / paid on issued invoices comes from the API — we do
              not mark invoices paid unless status says so.
            </p>

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
                <input
                  className={fieldControlClass}
                  placeholder="Subscription ID"
                  value={draftInvoiceForm.subscriptionId}
                  onChange={(e) =>
                    setDraftInvoiceForm((s) => ({
                      ...s,
                      subscriptionId: e.target.value,
                    }))
                  }
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
              <input
                className={fieldControlClass + " sm:col-span-2"}
                placeholder="Invoice ID"
                value={invoiceOps.invoiceId}
                onChange={(e) =>
                  setInvoiceOps((s) => ({ ...s, invoiceId: e.target.value }))
                }
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
            </div>

            {recentInvoices.length ? (
              <ul className="divide-y rounded-xl border border-border/70 text-sm">
                {recentInvoices.map((inv) => (
                  <li key={String(inv.id)} className="p-3">
                    <p className="font-medium">
                      {String(inv.invoiceNumber ?? inv.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status <Badge tone="default">{String(inv.status)}</Badge>
                      · Total {String(inv.total)} {String(inv.currency)} · Due{" "}
                      {String(inv.amountDue)} · Paid{" "}
                      {String(inv.amountPaid ?? "0")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EdgeEmptyState
                title="No session invoices"
                description="Draft an invoice from a subscription or run lifecycle actions by ID."
              />
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "payments" ? (
        <EdgePermissionGate permission="platform:billing:payments:read">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Payment list endpoints are not on P6 controller; collected totals
              in overview count only intents with status{" "}
              <code className="text-xs">SUCCEEDED</code>.
            </p>

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
                <input
                  className={fieldControlClass}
                  placeholder="Billing account ID"
                  value={paymentForm.billingAccountId}
                  onChange={(e) =>
                    setPaymentForm((s) => ({
                      ...s,
                      billingAccountId: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Invoice ID (optional)"
                  value={paymentForm.invoiceId}
                  onChange={(e) =>
                    setPaymentForm((s) => ({
                      ...s,
                      invoiceId: e.target.value,
                    }))
                  }
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
                <input
                  className={fieldControlClass + " min-w-[16rem] flex-1"}
                  placeholder="Payment intent ID to confirm"
                  value={confirmIntentId}
                  onChange={(e) => setConfirmIntentId(e.target.value)}
                />
                <Button
                  disabled={!confirmIntentId || confirmPayment.isPending}
                  onClick={() => confirmPayment.mutate()}
                >
                  Confirm capture
                </Button>
              </div>
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
              <select
                className={fieldControlClass}
                value={collectionForm.billingAccountId}
                onChange={(e) =>
                  setCollectionForm((s) => ({
                    ...s,
                    billingAccountId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Billing account…</option>
                {accounts.map((a) => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {String(a.accountNumber ?? a.id)}
                  </option>
                ))}
              </select>
              <select
                className={fieldControlClass}
                value={collectionForm.invoiceId}
                onChange={(e) =>
                  setCollectionForm((s) => ({
                    ...s,
                    invoiceId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Invoice…</option>
                {serverInvoices.map((inv) => (
                  <option key={String(inv.id)} value={String(inv.id)}>
                    {String(inv.invoiceNumber ?? inv.id)} ·{" "}
                    {String(inv.status)}
                  </option>
                ))}
              </select>
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void edgeApi
                            .escalateCollectionCase(String(c.id))
                            .then(() => collectionsQuery.refetch())
                        }
                      >
                        Escalate
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          void edgeApi
                            .resolveCollectionCase(String(c.id))
                            .then(() => collectionsQuery.refetch())
                        }
                      >
                        Resolve
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
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
              <code>BILLING_PAYMENT_ADAPTER</code> (not Hyperswitch).
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h2 className="mb-2 text-sm font-medium">Policies</h2>
                {!policies.length ? (
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
