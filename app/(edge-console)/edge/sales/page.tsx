"use client";

import { useMemo, useState, type FormEvent } from "react";
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
  | "contacts"
  | "leads"
  | "opportunities"
  | "pipeline"
  | "activities"
  | "quotes"
  | "dealdesk"
  | "contracts"
  | "orders"
  | "performance"
  | "teams"
  | "tasks";

const TABS: { id: Tab; label: string; permission: string }[] = [
  {
    id: "overview",
    label: "Overview",
    permission: "platform:sales:analytics:read",
  },
  {
    id: "accounts",
    label: "Accounts",
    permission: "platform:sales:accounts:read",
  },
  {
    id: "contacts",
    label: "Contacts",
    permission: "platform:sales:contacts:read",
  },
  { id: "leads", label: "Lead Inbox", permission: "platform:sales:leads:read" },
  {
    id: "opportunities",
    label: "Opportunities",
    permission: "platform:sales:opportunities:read",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    permission: "platform:sales:opportunities:read",
  },
  {
    id: "activities",
    label: "Activities",
    permission: "platform:sales:activities:manage",
  },
  {
    id: "quotes",
    label: "Quotes",
    permission: "platform:sales:quotes:read",
  },
  {
    id: "dealdesk",
    label: "Deal Desk",
    permission: "platform:sales:discounts:request",
  },
  {
    id: "contracts",
    label: "Contracts",
    permission: "platform:sales:contracts:read",
  },
  {
    id: "orders",
    label: "Orders",
    permission: "platform:sales:orders:manage",
  },
  {
    id: "performance",
    label: "Performance",
    permission: "platform:sales:analytics:read",
  },
  { id: "teams", label: "Teams", permission: "platform:sales:teams:read" },
  {
    id: "tasks",
    label: "Tasks",
    permission: "platform:sales:activities:manage",
  },
];

export default function EdgeSalesPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [accountForm, setAccountForm] = useState({
    legalName: "",
    country: "",
    emailDomain: "",
    industry: "",
  });
  const [contactForm, setContactForm] = useState({
    accountId: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [receiveLeadId, setReceiveLeadId] = useState("");
  const [rejectReason, setRejectReason] = useState("NO_FIT");
  const [teamForm, setTeamForm] = useState({ code: "", name: "" });
  const [taskTitle, setTaskTitle] = useState("");
  const [oppForm, setOppForm] = useState({
    name: "",
    accountId: "",
    estimatedValue: "",
    needSummary: "",
  });
  const [activityForm, setActivityForm] = useState({
    activityType: "CALL",
    subject: "",
    opportunityId: "",
  });
  const [quoteForm, setQuoteForm] = useState({
    opportunityId: "",
    description: "Plan subscription",
    quantity: "1",
    unitPrice: "1000",
  });
  const [discountForm, setDiscountForm] = useState({
    opportunityId: "",
    listAmount: "1000",
    requestedAmount: "850",
    justification: "",
  });
  const [contractForm, setContractForm] = useState({
    opportunityId: "",
    contractValue: "",
  });
  const [orderForm, setOrderForm] = useState({
    contractId: "",
    opportunityId: "",
  });

  const canReadAny = useMemo(
    () =>
      TABS.some((t) => hasEdgePermission(permissions, t.permission)) ||
      hasEdgePermission(permissions, "platform:sales:accounts:read"),
    [permissions],
  );

  const overviewQuery = useQuery({
    queryKey: ["edge", "sales", "overview"],
    queryFn: () => edgeApi.getSalesOverview(),
    enabled: tab === "overview" && canReadAny,
  });

  const accountsQuery = useQuery({
    queryKey: ["edge", "sales", "accounts"],
    queryFn: () => edgeApi.listSalesAccounts({ limit: 50 }),
    enabled:
      (tab === "accounts" ||
        tab === "contacts" ||
        tab === "opportunities") &&
      canReadAny,
  });

  const contactsQuery = useQuery({
    queryKey: ["edge", "sales", "contacts"],
    queryFn: () => edgeApi.listSalesContacts({}),
    enabled: tab === "contacts" && canReadAny,
  });

  const leadsQuery = useQuery({
    queryKey: ["edge", "sales", "leads"],
    queryFn: () => edgeApi.listSalesLeads({ limit: 50 }),
    enabled: tab === "leads" && canReadAny,
  });

  const teamsQuery = useQuery({
    queryKey: ["edge", "sales", "teams"],
    queryFn: () => edgeApi.listSalesTeams(),
    enabled: tab === "teams" && canReadAny,
  });

  const tasksQuery = useQuery({
    queryKey: ["edge", "sales", "tasks"],
    queryFn: () => edgeApi.listSalesTasks({ status: "OPEN" }),
    enabled: tab === "tasks" && canReadAny,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ["edge", "sales", "opportunities"],
    queryFn: () => edgeApi.listSalesOpportunities({ limit: 50 }),
    enabled:
      (tab === "opportunities" || tab === "pipeline") && canReadAny,
  });

  const pipelineQuery = useQuery({
    queryKey: ["edge", "sales", "pipeline-board"],
    queryFn: () => edgeApi.getSalesPipelineBoard(),
    enabled: tab === "pipeline" && canReadAny,
  });

  const activitiesQuery = useQuery({
    queryKey: ["edge", "sales", "activities"],
    queryFn: () => edgeApi.listSalesActivities({}),
    enabled: tab === "activities" && canReadAny,
  });

  const quotesQuery = useQuery({
    queryKey: ["edge", "sales", "quotes"],
    queryFn: () => edgeApi.listSalesQuotes({}),
    enabled: tab === "quotes" && canReadAny,
  });

  const discountsQuery = useQuery({
    queryKey: ["edge", "sales", "discounts"],
    queryFn: () => edgeApi.listSalesDiscountRequests({}),
    enabled: tab === "dealdesk" && canReadAny,
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "sales", "contracts"],
    queryFn: () => edgeApi.listSalesContracts({}),
    enabled: (tab === "contracts" || tab === "orders") && canReadAny,
  });

  const ordersQuery = useQuery({
    queryKey: ["edge", "sales", "orders"],
    queryFn: () => edgeApi.listSalesOrders({}),
    enabled: tab === "orders" && canReadAny,
  });

  const performanceQuery = useQuery({
    queryKey: ["edge", "sales", "performance"],
    queryFn: () => edgeApi.getSalesPerformance(),
    enabled: tab === "performance" && canReadAny,
  });

  const forecastQuery = useQuery({
    queryKey: ["edge", "sales", "forecast"],
    queryFn: () => edgeApi.getSalesForecast({ model: "WEIGHTED" }),
    enabled: tab === "performance" && canReadAny,
  });

  const createAccount = useMutation({
    mutationFn: () =>
      edgeApi.createSalesAccount({
        legalName: accountForm.legalName,
        country: accountForm.country || null,
        emailDomain: accountForm.emailDomain || null,
        industry: accountForm.industry || null,
      }),
    onSuccess: () => {
      setAccountForm({
        legalName: "",
        country: "",
        emailDomain: "",
        industry: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "accounts"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "overview"],
      });
    },
  });

  const createContact = useMutation({
    mutationFn: () =>
      edgeApi.createSalesContact({
        accountId: contactForm.accountId,
        firstName: contactForm.firstName,
        lastName: contactForm.lastName,
        email: contactForm.email || null,
      }),
    onSuccess: () => {
      setContactForm({
        accountId: "",
        firstName: "",
        lastName: "",
        email: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "contacts"],
      });
    },
  });

  const receiveLead = useMutation({
    mutationFn: () =>
      edgeApi.receiveSalesLead({ marketingLeadId: receiveLeadId }),
    onSuccess: () => {
      setReceiveLeadId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "overview"],
      });
    },
  });

  const acceptLead = useMutation({
    mutationFn: (id: string) => edgeApi.acceptSalesLead(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      }),
  });

  const rejectLead = useMutation({
    mutationFn: (id: string) =>
      edgeApi.rejectSalesLead(id, {
        reasonCode: rejectReason,
        reasonText: "Rejected from Sales console",
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      }),
  });

  const qualifyLead = useMutation({
    mutationFn: (id: string) =>
      edgeApi.qualifySalesLead(id, {
        needConfirmed: true,
        productFit: true,
        decisionCapacity: true,
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "leads"],
      }),
  });

  const createTeam = useMutation({
    mutationFn: () =>
      edgeApi.createSalesTeam({
        code: teamForm.code,
        name: teamForm.name,
      }),
    onSuccess: () => {
      setTeamForm({ code: "", name: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "teams"],
      });
    },
  });

  const createTask = useMutation({
    mutationFn: () => edgeApi.createSalesTask({ title: taskTitle }),
    onSuccess: () => {
      setTaskTitle("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "tasks"],
      });
    },
  });

  const createOpportunity = useMutation({
    mutationFn: () =>
      edgeApi.createSalesOpportunity({
        name: oppForm.name,
        accountId: oppForm.accountId,
        estimatedValue: oppForm.estimatedValue
          ? Number(oppForm.estimatedValue)
          : null,
        needSummary: oppForm.needSummary || null,
      }),
    onSuccess: () => {
      setOppForm({
        name: "",
        accountId: "",
        estimatedValue: "",
        needSummary: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "opportunities"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "pipeline-board"],
      });
    },
  });

  const createActivity = useMutation({
    mutationFn: () =>
      edgeApi.createSalesActivity({
        activityType: activityForm.activityType,
        subject: activityForm.subject,
        opportunityId: activityForm.opportunityId || null,
      }),
    onSuccess: () => {
      setActivityForm({ activityType: "CALL", subject: "", opportunityId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "activities"],
      });
    },
  });

  const createQuote = useMutation({
    mutationFn: () =>
      edgeApi.createSalesQuote({
        opportunityId: quoteForm.opportunityId,
        lines: [
          {
            lineNumber: 1,
            description: quoteForm.description,
            quantity: Number(quoteForm.quantity),
            unitPrice: Number(quoteForm.unitPrice),
          },
        ],
      }),
    onSuccess: () => {
      setQuoteForm({
        opportunityId: "",
        description: "Plan subscription",
        quantity: "1",
        unitPrice: "1000",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "quotes"],
      });
    },
  });

  const createDiscount = useMutation({
    mutationFn: () =>
      edgeApi.createSalesDiscountRequest({
        opportunityId: discountForm.opportunityId,
        listAmount: Number(discountForm.listAmount),
        requestedAmount: Number(discountForm.requestedAmount),
        justification: discountForm.justification,
      }),
    onSuccess: () => {
      setDiscountForm({
        opportunityId: "",
        listAmount: "1000",
        requestedAmount: "850",
        justification: "",
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "discounts"],
      });
    },
  });

  const createContract = useMutation({
    mutationFn: () =>
      edgeApi.createSalesContract({
        opportunityId: contractForm.opportunityId,
        contractValue: contractForm.contractValue
          ? Number(contractForm.contractValue)
          : null,
      }),
    onSuccess: () => {
      setContractForm({ opportunityId: "", contractValue: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "contracts"],
      });
    },
  });

  const createOrder = useMutation({
    mutationFn: () =>
      edgeApi.createSalesOrder({
        contractId: orderForm.contractId || null,
        opportunityId: orderForm.opportunityId || null,
      }),
    onSuccess: () => {
      setOrderForm({ contractId: "", opportunityId: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "orders"],
      });
    },
  });

  const requestHandoff = useMutation({
    mutationFn: (orderId: string) =>
      edgeApi.requestSalesHandoff(orderId, { requireContract: true }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["edge", "sales", "orders"],
      }),
  });

  if (platformLoading) return <EdgeLoadingState label="Loading sales…" />;
  if (!canReadAny) return <EdgeForbiddenState />;

  const accounts = (accountsQuery.data as { items?: unknown[] } | undefined)
    ?.items;
  const contacts = (contactsQuery.data as { items?: unknown[] } | undefined)
    ?.items;
  const leads = (leadsQuery.data as { items?: unknown[] } | undefined)?.items;
  const opportunities = (
    opportunitiesQuery.data as { items?: unknown[] } | undefined
  )?.items;
  const pipelineBoard = pipelineQuery.data as
    | {
        pipeline?: { name?: string };
        board?: {
          stage: { id: string; name: string; code: string };
          opportunities: Record<string, unknown>[];
        }[];
      }
    | undefined;
  const teams = (teamsQuery.data as unknown[] | undefined) ?? [];
  const tasks = (tasksQuery.data as unknown[] | undefined) ?? [];
  const activities = (activitiesQuery.data as unknown[] | undefined) ?? [];
  const quotes = (quotesQuery.data as unknown[] | undefined) ?? [];
  const discounts = (discountsQuery.data as unknown[] | undefined) ?? [];
  const contracts = (contractsQuery.data as unknown[] | undefined) ?? [];
  const orders = (ordersQuery.data as unknown[] | undefined) ?? [];
  const performance = performanceQuery.data as
    | Record<string, unknown>
    | undefined;
  const forecast = forecastQuery.data as
    | { amount?: number; currency?: string; opportunityCount?: number }
    | undefined;
  const overview = overviewQuery.data as
    | {
        accountsTotal?: number;
        leadsTotal?: number;
        openTasks?: number;
        inboxPending?: number;
        note?: string;
        dataQuality?: string;
      }
    | undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Sales &amp; Commercial Operations
        </p>
        <h1 className="font-display text-3xl tracking-tight">Okapi Edge Sales</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          End-to-end commercial cycle: CRM, pipeline, quotes, deal desk,
          contracts, orders and handoff. Accounts are not tenants; provisioning
          stays outside P4.
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

      {tab === "overview" ? (
        overviewQuery.isLoading ? (
          <EdgeLoadingState label="Loading overview…" />
        ) : overviewQuery.isError ? (
          <EdgeErrorState
            error={overviewQuery.error}
            onRetry={() => void overviewQuery.refetch()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Accounts" value={overview?.accountsTotal ?? 0} />
            <MetricCard label="Sales leads" value={overview?.leadsTotal ?? 0} />
            <MetricCard
              label="Inbox pending"
              value={overview?.inboxPending ?? 0}
            />
            <MetricCard label="Open tasks" value={overview?.openTasks ?? 0} />
            <p className="sm:col-span-2 lg:col-span-4 text-sm text-muted-foreground">
              {overview?.note}{" "}
              <Badge tone="default">{overview?.dataQuality ?? "PARTIAL"}</Badge>
            </p>
          </div>
        )
      ) : null}

      {tab === "accounts" ? (
        <EdgePermissionGate permission="platform:sales:accounts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:accounts:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createAccount.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  New commercial account
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Legal name"
                  value={accountForm.legalName}
                  onChange={(e) =>
                    setAccountForm((s) => ({
                      ...s,
                      legalName: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Country"
                  value={accountForm.country}
                  onChange={(e) =>
                    setAccountForm((s) => ({ ...s, country: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Email domain"
                  value={accountForm.emailDomain}
                  onChange={(e) =>
                    setAccountForm((s) => ({
                      ...s,
                      emailDomain: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Industry"
                  value={accountForm.industry}
                  onChange={(e) =>
                    setAccountForm((s) => ({ ...s, industry: e.target.value }))
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
                error={accountsQuery.error}
                onRetry={() => void accountsQuery.refetch()}
              />
            ) : !accounts?.length ? (
              <EdgeEmptyState title="No commercial accounts yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(accounts as Record<string, unknown>[]).map((a) => (
                  <li key={String(a.id)} className="flex flex-wrap gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{String(a.legalName)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(a.accountNumber)} · {String(a.accountType)}
                      </p>
                    </div>
                    <Badge tone="default">{String(a.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "contacts" ? (
        <EdgePermissionGate permission="platform:sales:contacts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:contacts:manage">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createContact.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  New contact
                </h2>
                <select
                  className={fieldControlClass}
                  value={contactForm.accountId}
                  onChange={(e) =>
                    setContactForm((s) => ({
                      ...s,
                      accountId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select account</option>
                  {((accounts as Record<string, unknown>[]) ?? []).map((a) => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {String(a.legalName)}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldControlClass}
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm((s) => ({ ...s, email: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="First name"
                  value={contactForm.firstName}
                  onChange={(e) =>
                    setContactForm((s) => ({
                      ...s,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Last name"
                  value={contactForm.lastName}
                  onChange={(e) =>
                    setContactForm((s) => ({ ...s, lastName: e.target.value }))
                  }
                  required
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createContact.isPending}>
                    Create contact
                  </Button>
                </div>
              </form>
            </EdgePermissionGate>
            {contactsQuery.isLoading ? (
              <EdgeLoadingState label="Loading contacts…" />
            ) : !contacts?.length ? (
              <EdgeEmptyState title="No contacts yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(contacts as Record<string, unknown>[]).map((c) => (
                  <li key={String(c.id)} className="p-4">
                    <p className="font-medium">
                      {String(c.firstName)} {String(c.lastName)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(c.stakeholderType)} ·{" "}
                      {String(c.emailNormalized ?? "—")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "leads" ? (
        <EdgePermissionGate permission="platform:sales:leads:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:leads:accept">
              <form
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 p-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  receiveLead.mutate();
                }}
              >
                <div className="min-w-[16rem] flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Marketing lead ID (P3)
                  </label>
                  <input
                    className={fieldControlClass}
                    value={receiveLeadId}
                    onChange={(e) => setReceiveLeadId(e.target.value)}
                    placeholder="UUID from marketing lead"
                    required
                  />
                </div>
                <Button type="submit" disabled={receiveLead.isPending}>
                  Receive into inbox
                </Button>
                {receiveLead.isError ? (
                  <p className="w-full text-sm text-destructive">
                    {(receiveLead.error as EdgeApiError)?.message ??
                      "Receive failed"}
                  </p>
                ) : null}
              </form>
            </EdgePermissionGate>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">
                Reject reason
              </label>
              <input
                className={fieldControlClass + " max-w-xs"}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            {leadsQuery.isLoading ? (
              <EdgeLoadingState label="Loading lead inbox…" />
            ) : !leads?.length ? (
              <EdgeEmptyState title="Sales lead inbox is empty" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(leads as Record<string, unknown>[]).map((l) => (
                  <li
                    key={String(l.id)}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">
                        Lead {String(l.id).slice(0, 8)}…
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Marketing {String(l.marketingLeadId).slice(0, 8)}… ·{" "}
                        {String(l.salesPriority)}
                      </p>
                    </div>
                    <Badge tone="default">{String(l.status)}</Badge>
                    <EdgePermissionGate permission="platform:sales:leads:accept">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acceptLead.isPending}
                        onClick={() => acceptLead.mutate(String(l.id))}
                      >
                        Accept
                      </Button>
                    </EdgePermissionGate>
                    <EdgePermissionGate permission="platform:sales:leads:reject">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={rejectLead.isPending}
                        onClick={() => rejectLead.mutate(String(l.id))}
                      >
                        Reject
                      </Button>
                    </EdgePermissionGate>
                    <EdgePermissionGate permission="platform:sales:leads:qualify">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={qualifyLead.isPending}
                        onClick={() => qualifyLead.mutate(String(l.id))}
                      >
                        Qualify
                      </Button>
                    </EdgePermissionGate>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "opportunities" ? (
        <EdgePermissionGate permission="platform:sales:opportunities:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:opportunities:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createOpportunity.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  New opportunity
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Opportunity name"
                  value={oppForm.name}
                  onChange={(e) =>
                    setOppForm((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
                <select
                  className={fieldControlClass}
                  value={oppForm.accountId}
                  onChange={(e) =>
                    setOppForm((s) => ({ ...s, accountId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select account</option>
                  {((accounts as Record<string, unknown>[]) ?? []).map((a) => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {String(a.legalName)}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldControlClass}
                  placeholder="Estimated value"
                  value={oppForm.estimatedValue}
                  onChange={(e) =>
                    setOppForm((s) => ({
                      ...s,
                      estimatedValue: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Need summary"
                  value={oppForm.needSummary}
                  onChange={(e) =>
                    setOppForm((s) => ({ ...s, needSummary: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createOpportunity.isPending}>
                    Create opportunity
                  </Button>
                  {createOpportunity.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(createOpportunity.error as EdgeApiError)?.message ??
                        "Create failed"}
                    </p>
                  ) : null}
                </div>
              </form>
            </EdgePermissionGate>
            {opportunitiesQuery.isLoading ? (
              <EdgeLoadingState label="Loading opportunities…" />
            ) : !opportunities?.length ? (
              <EdgeEmptyState title="No opportunities yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(opportunities as Record<string, unknown>[]).map((o) => (
                  <li key={String(o.id)} className="flex flex-wrap gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{String(o.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(o.opportunityNumber)} ·{" "}
                        {String(o.estimatedValue ?? "—")} {String(o.currency)}
                      </p>
                    </div>
                    <Badge tone="default">{String(o.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "pipeline" ? (
        <EdgePermissionGate permission="platform:sales:opportunities:read">
          <section className="space-y-4">
            {pipelineQuery.isLoading ? (
              <EdgeLoadingState label="Loading pipeline…" />
            ) : pipelineQuery.isError ? (
              <EdgeErrorState
                error={pipelineQuery.error}
                onRetry={() => void pipelineQuery.refetch()}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {pipelineBoard?.pipeline?.name ?? "Pipeline"} — stage moves
                  are validated server-side; Closed Won is gated.
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {(pipelineBoard?.board ?? []).map((col) => (
                    <div
                      key={col.stage.id}
                      className="w-64 shrink-0 rounded-xl border border-border/70 bg-[var(--surface-muted)]/40 p-3"
                    >
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {col.stage.name}
                      </p>
                      <ul className="space-y-2">
                        {col.opportunities.map((o) => (
                          <li
                            key={String(o.id)}
                            className="rounded-lg border border-border/60 bg-[var(--surface)] p-2 text-sm"
                          >
                            <p className="font-medium">{String(o.name)}</p>
                            <p className="text-xs text-muted-foreground">
                              {String(o.estimatedValue ?? "—")}{" "}
                              {String(o.currency)}
                            </p>
                          </li>
                        ))}
                        {!col.opportunities.length ? (
                          <li className="text-xs text-muted-foreground">Empty</li>
                        ) : null}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "teams" ? (
        <EdgePermissionGate permission="platform:sales:teams:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:teams:manage">
              <form
                className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createTeam.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Code"
                  value={teamForm.code}
                  onChange={(e) =>
                    setTeamForm((s) => ({ ...s, code: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Name"
                  value={teamForm.name}
                  onChange={(e) =>
                    setTeamForm((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
                <Button type="submit" disabled={createTeam.isPending}>
                  Create team
                </Button>
              </form>
            </EdgePermissionGate>
            {!teams.length ? (
              <EdgeEmptyState title="No sales teams yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(teams as Record<string, unknown>[]).map((t) => (
                  <li key={String(t.id)} className="p-4">
                    <p className="font-medium">{String(t.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(t.code)} · {String(t.status)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "activities" ? (
        <EdgePermissionGate permission="platform:sales:activities:manage">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createActivity.mutate();
              }}
            >
              <select
                className={fieldControlClass}
                value={activityForm.activityType}
                onChange={(e) =>
                  setActivityForm((f) => ({
                    ...f,
                    activityType: e.target.value,
                  }))
                }
              >
                <option value="CALL">Call</option>
                <option value="MEETING">Meeting</option>
                <option value="DEMO">Demo</option>
                <option value="EMAIL">Email</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
              <input
                className={fieldControlClass}
                placeholder="Subject"
                value={activityForm.subject}
                onChange={(e) =>
                  setActivityForm((f) => ({ ...f, subject: e.target.value }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Opportunity ID"
                value={activityForm.opportunityId}
                onChange={(e) =>
                  setActivityForm((f) => ({
                    ...f,
                    opportunityId: e.target.value,
                  }))
                }
              />
              <Button type="submit" disabled={createActivity.isPending}>
                Log activity
              </Button>
            </form>
            {activitiesQuery.isLoading ? (
              <EdgeLoadingState label="Loading activities…" />
            ) : !activities.length ? (
              <EdgeEmptyState title="No activities yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(activities as Record<string, unknown>[]).map((a) => (
                  <li key={String(a.id)} className="p-4">
                    <p className="font-medium">{String(a.subject)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(a.activityType)} · {String(a.status)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "quotes" ? (
        <EdgePermissionGate permission="platform:sales:quotes:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:quotes:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-5"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createQuote.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Opportunity ID"
                  value={quoteForm.opportunityId}
                  onChange={(e) =>
                    setQuoteForm((f) => ({
                      ...f,
                      opportunityId: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Line description"
                  value={quoteForm.description}
                  onChange={(e) =>
                    setQuoteForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Qty"
                  value={quoteForm.quantity}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="Unit price"
                  value={quoteForm.unitPrice}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, unitPrice: e.target.value }))
                  }
                />
                <Button type="submit" disabled={createQuote.isPending}>
                  Create quote
                </Button>
              </form>
            </EdgePermissionGate>
            {quotesQuery.isLoading ? (
              <EdgeLoadingState label="Loading quotes…" />
            ) : !quotes.length ? (
              <EdgeEmptyState title="No quotes yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(quotes as Record<string, unknown>[]).map((q) => (
                  <li
                    key={String(q.id)}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-medium">{String(q.quoteNumber)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(q.totalAmount)} {String(q.currency)} ·{" "}
                        {String(q.status)} · v{String(q.currentVersion)}
                      </p>
                    </div>
                    <Badge variant="outline">{String(q.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "dealdesk" ? (
        <EdgePermissionGate permission="platform:sales:discounts:request">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-5"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createDiscount.mutate();
              }}
            >
              <input
                className={fieldControlClass}
                placeholder="Opportunity ID"
                value={discountForm.opportunityId}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    opportunityId: e.target.value,
                  }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="List amount"
                value={discountForm.listAmount}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    listAmount: e.target.value,
                  }))
                }
              />
              <input
                className={fieldControlClass}
                placeholder="Requested amount"
                value={discountForm.requestedAmount}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    requestedAmount: e.target.value,
                  }))
                }
              />
              <input
                className={fieldControlClass}
                placeholder="Justification"
                value={discountForm.justification}
                onChange={(e) =>
                  setDiscountForm((f) => ({
                    ...f,
                    justification: e.target.value,
                  }))
                }
                required
              />
              <Button type="submit" disabled={createDiscount.isPending}>
                Request discount
              </Button>
            </form>
            {!discounts.length ? (
              <EdgeEmptyState title="No discount requests" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(discounts as Record<string, unknown>[]).map((d) => (
                  <li key={String(d.id)} className="p-4">
                    <p className="font-medium">
                      {String(d.discountPercent)}% · {String(d.status)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {String(d.requiredApprovalLevel)} ·{" "}
                      {String(d.justification)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "contracts" ? (
        <EdgePermissionGate permission="platform:sales:contracts:read">
          <section className="space-y-4">
            <EdgePermissionGate permission="platform:sales:contracts:manage">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createContract.mutate();
                }}
              >
                <input
                  className={fieldControlClass}
                  placeholder="Opportunity ID"
                  value={contractForm.opportunityId}
                  onChange={(e) =>
                    setContractForm((f) => ({
                      ...f,
                      opportunityId: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Contract value"
                  value={contractForm.contractValue}
                  onChange={(e) =>
                    setContractForm((f) => ({
                      ...f,
                      contractValue: e.target.value,
                    }))
                  }
                />
                <Button type="submit" disabled={createContract.isPending}>
                  Create contract
                </Button>
              </form>
            </EdgePermissionGate>
            {!contracts.length ? (
              <EdgeEmptyState title="No contracts yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(contracts as Record<string, unknown>[]).map((c) => (
                  <li key={String(c.id)} className="p-4">
                    <p className="font-medium">{String(c.contractNumber)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(c.status)} · {String(c.contractValue ?? "—")}{" "}
                      {String(c.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "orders" ? (
        <EdgePermissionGate permission="platform:sales:orders:manage">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createOrder.mutate();
              }}
            >
              <input
                className={fieldControlClass}
                placeholder="Contract ID (executed)"
                value={orderForm.contractId}
                onChange={(e) =>
                  setOrderForm((f) => ({ ...f, contractId: e.target.value }))
                }
              />
              <input
                className={fieldControlClass}
                placeholder="Opportunity ID (optional)"
                value={orderForm.opportunityId}
                onChange={(e) =>
                  setOrderForm((f) => ({
                    ...f,
                    opportunityId: e.target.value,
                  }))
                }
              />
              <Button type="submit" disabled={createOrder.isPending}>
                Create order
              </Button>
            </form>
            {!orders.length ? (
              <EdgeEmptyState title="No sales orders yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(orders as Record<string, unknown>[]).map((o) => (
                  <li
                    key={String(o.id)}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-medium">{String(o.orderNumber)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(o.status)} · {String(o.totalAmount)}{" "}
                        {String(o.currency)}
                      </p>
                    </div>
                    <EdgePermissionGate permission="platform:sales:handoff:execute">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={requestHandoff.isPending}
                        onClick={() => requestHandoff.mutate(String(o.id))}
                      >
                        Handoff
                      </Button>
                    </EdgePermissionGate>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "performance" ? (
        <EdgePermissionGate permission="platform:sales:analytics:read">
          <section className="space-y-4">
            {performanceQuery.isLoading || forecastQuery.isLoading ? (
              <EdgeLoadingState label="Loading performance…" />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    label="Open opps"
                    value={Number(performance?.openOpportunities ?? 0)}
                  />
                  <MetricCard
                    label="Won"
                    value={Number(performance?.wonOpportunities ?? 0)}
                  />
                  <MetricCard
                    label="Pipeline"
                    value={Number(performance?.pipelineValue ?? 0)}
                  />
                  <MetricCard
                    label="Weighted forecast"
                    value={Number(forecast?.amount ?? 0)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {String(
                    performance?.disclaimer ??
                      "Projections only — not recognized revenue.",
                  )}
                </p>
              </>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "tasks" ? (
        <EdgePermissionGate permission="platform:sales:activities:manage">
          <section className="space-y-4">
            <form
              className="flex flex-wrap gap-3 rounded-xl border border-border/70 p-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createTask.mutate();
              }}
            >
              <input
                className={fieldControlClass + " min-w-[16rem] flex-1"}
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
              <Button type="submit" disabled={createTask.isPending}>
                Add task
              </Button>
            </form>
            {!tasks.length ? (
              <EdgeEmptyState title="No open tasks" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {(tasks as Record<string, unknown>[]).map((t) => (
                  <li key={String(t.id)} className="flex gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{String(t.title)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(t.priority)} · {String(t.status)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
