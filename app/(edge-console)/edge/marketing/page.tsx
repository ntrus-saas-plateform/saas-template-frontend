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
import {
  MarketingStudioEditor,
  emptyStudio,
  type StudioDocument,
} from "@/components/edge/marketing-studio-editor";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type Tab =
  | "overview"
  | "strategies"
  | "audiences"
  | "campaigns"
  | "content"
  | "landing"
  | "forms"
  | "leads"
  | "channels"
  | "journeys"
  | "attribution"
  | "budgets";

const TABS: { id: Tab; label: string; permission: string }[] = [
  {
    id: "overview",
    label: "Overview",
    permission: "platform:marketing:campaign:read",
  },
  {
    id: "strategies",
    label: "Strategy",
    permission: "platform:marketing:strategy:read",
  },
  {
    id: "audiences",
    label: "Audiences",
    permission: "platform:marketing:audience:read",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    permission: "platform:marketing:campaign:read",
  },
  {
    id: "content",
    label: "Content",
    permission: "platform:marketing:content:read",
  },
  {
    id: "landing",
    label: "Landing",
    permission: "platform:marketing:landing_page:manage",
  },
  {
    id: "forms",
    label: "Forms",
    permission: "platform:marketing:form:manage",
  },
  { id: "leads", label: "Leads", permission: "platform:marketing:lead:read" },
  {
    id: "channels",
    label: "Channels",
    permission: "platform:marketing:integrations:manage",
  },
  {
    id: "journeys",
    label: "Journeys",
    permission: "platform:marketing:automation:manage",
  },
  {
    id: "attribution",
    label: "Attribution",
    permission: "platform:marketing:analytics:read",
  },
  {
    id: "budgets",
    label: "Budgets",
    permission: "platform:marketing:budget:read",
  },
];

type Row = {
  id: string;
  code?: string;
  name?: string;
  status?: string;
  campaignType?: string;
  formType?: string;
  scopeType?: string;
  emailNormalized?: string | null;
  plannedAmount?: string;
  currency?: string;
};

export default function EdgeMarketingPage() {
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const anyAllowed =
    !permissionKnown ||
    TABS.some((t) => hasEdgePermission(permissions, t.permission));

  const [tab, setTab] = useState<Tab>("overview");
  const [productId, setProductId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [strategyCode, setStrategyCode] = useState("");
  const [strategyName, setStrategyName] = useState("");
  const [audienceCode, setAudienceCode] = useState("");
  const [audienceName, setAudienceName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("LEAD_GENERATION");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formType, setFormType] = useState("DEMO_REQUEST");
  const [budgetCode, setBudgetCode] = useState("");
  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");

  const [contentCode, setContentCode] = useState("");
  const [contentName, setContentName] = useState("");
  const [landingCode, setLandingCode] = useState("");
  const [landingName, setLandingName] = useState("");
  const [landingSlug, setLandingSlug] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [channelName, setChannelName] = useState("");
  const [journeyCode, setJourneyCode] = useState("");
  const [journeyName, setJourneyName] = useState("");

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "marketing"],
    enabled: anyAllowed,
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({ limit: 100 });
      return data ?? [];
    },
  });

  const strategiesQuery = useQuery({
    queryKey: ["edge", "marketing", "strategies", productId || "all"],
    enabled: anyAllowed && (tab === "strategies" || tab === "overview"),
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingStrategies({
        productId: productId || undefined,
      });
      return (data as Row[]) ?? [];
    },
  });

  const audiencesQuery = useQuery({
    queryKey: ["edge", "marketing", "audiences", productId || "all"],
    enabled: anyAllowed && (tab === "audiences" || tab === "overview"),
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingAudiences(
        productId || undefined,
      );
      return (data as Row[]) ?? [];
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["edge", "marketing", "campaigns", productId || "all"],
    enabled: anyAllowed && (tab === "campaigns" || tab === "overview"),
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingCampaigns({
        productId: productId || undefined,
      });
      return (data as Row[]) ?? [];
    },
  });

  const formsQuery = useQuery({
    queryKey: ["edge", "marketing", "forms", productId || "all"],
    enabled: anyAllowed && tab === "forms",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingForms(productId || undefined);
      return (data as Row[]) ?? [];
    },
  });

  const leadsQuery = useQuery({
    queryKey: ["edge", "marketing", "leads", productId || "all"],
    enabled: anyAllowed && (tab === "leads" || tab === "overview" || tab === "attribution"),
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingLeads({
        productId: productId || undefined,
      });
      return (data as Row[]) ?? [];
    },
  });

  const budgetsQuery = useQuery({
    queryKey: ["edge", "marketing", "budgets"],
    enabled: anyAllowed && tab === "budgets",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingBudgets();
      return (data as Row[]) ?? [];
    },
  });

  const contentsQuery = useQuery({
    queryKey: ["edge", "marketing", "contents", productId || "all"],
    enabled: anyAllowed && tab === "content",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingContents(productId || undefined);
      return (
        (data as (Row & { body?: { studio?: StudioDocument } })[]) ?? []
      );
    },
  });

  const landingsQuery = useQuery({
    queryKey: ["edge", "marketing", "landing", productId || "all"],
    enabled: anyAllowed && tab === "landing",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingLandingPages(
        productId || undefined,
      );
      return (
        (data as (Row & {
          slug?: string;
          layout?: { studio?: StudioDocument };
        })[]) ?? []
      );
    },
  });

  const channelsQuery = useQuery({
    queryKey: ["edge", "marketing", "channels"],
    enabled: anyAllowed && tab === "channels",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingChannels();
      return (data as (Row & { channelType?: string; displayName?: string })[]) ?? [];
    },
  });

  const journeysQuery = useQuery({
    queryKey: ["edge", "marketing", "journeys"],
    enabled: anyAllowed && tab === "journeys",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingJourneys();
      return (data as (Row & { triggerType?: string })[]) ?? [];
    },
  });

  const attributionQuery = useQuery({
    queryKey: ["edge", "marketing", "attribution"],
    enabled: anyAllowed && tab === "attribution",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingAttributionModels();
      return (data as (Row & { modelType?: string })[]) ?? [];
    },
  });

  const snapshotsQuery = useQuery({
    queryKey: ["edge", "marketing", "snapshots"],
    enabled: anyAllowed && tab === "attribution",
    queryFn: async () => {
      const { data } = await edgeApi.listMarketingAnalyticsSnapshots();
      return (
        (data as {
          id: string;
          scopeType: string;
          periodStart?: string;
          periodEnd?: string;
          metrics: Record<string, unknown>;
          metricQuality: Record<string, unknown>;
        }[]) ?? []
      );
    },
  });

  const analyticsSummaryQuery = useQuery({
    queryKey: ["edge", "marketing", "analytics-summary"],
    enabled: anyAllowed && tab === "attribution",
    queryFn: async () => {
      const { data } = await edgeApi.getMarketingAnalyticsSummary();
      return data as {
        snapshotCount: number;
        qualityCounts: {
          MEASURED: number;
          ESTIMATED: number;
          UNAVAILABLE: number;
        };
        metricKeys: string[];
        cac: { status: string; reason: string };
        roas: { status: string; reason: string };
        ltv: { status: string; reason: string };
        revenueAttributed: { status: string; reason: string };
        revenueReconciled: boolean;
      };
    },
  });

  const invalidate = async (key: string) => {
    setFormError(null);
    await queryClient.invalidateQueries({ queryKey: ["edge", "marketing", key] });
  };

  const createStrategy = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingStrategy({
        code: strategyCode.trim(),
        name: strategyName.trim(),
        scopeType: productId ? "PRODUCT" : "GLOBAL",
        productId: productId || null,
      }),
    onSuccess: async () => {
      setStrategyCode("");
      setStrategyName("");
      await invalidate("strategies");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createAudience = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingAudience({
        code: audienceCode.trim(),
        name: audienceName.trim(),
        productId: productId || null,
        rules: productId
          ? [
              {
                ruleType: "INCLUDE",
                criterionType: "PRODUCT_INTEREST",
                criterionRef: productId,
              },
            ]
          : [],
      }),
    onSuccess: async () => {
      setAudienceCode("");
      setAudienceName("");
      await invalidate("audiences");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createCampaign = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingCampaign({
        code: campaignCode.trim(),
        name: campaignName.trim(),
        campaignType,
        productId,
        objective: "Generate qualified demand — measured only",
      }),
    onSuccess: async () => {
      setCampaignCode("");
      setCampaignName("");
      await invalidate("campaigns");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createForm = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingForm({
        code: formCode.trim(),
        name: formName.trim(),
        formType,
        slug: formSlug.trim(),
        productId: productId || null,
        fields: [
          { name: "email", required: true },
          { name: "fullName", required: false },
        ],
      }),
    onSuccess: async () => {
      setFormCode("");
      setFormName("");
      setFormSlug("");
      await invalidate("forms");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createBudget = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingBudget({
        code: budgetCode.trim(),
        name: budgetName.trim(),
        scopeType: productId ? "PRODUCT" : "GLOBAL",
        currency: budgetCurrency.trim().toUpperCase(),
        plannedAmount: budgetAmount.trim(),
        productId: productId || null,
      }),
    onSuccess: async () => {
      setBudgetCode("");
      setBudgetName("");
      setBudgetAmount("");
      await invalidate("budgets");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createContent = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingContent({
        code: contentCode.trim(),
        name: contentName.trim(),
        contentType: "ARTICLE",
        productId: productId || null,
        body: { draft: true },
      }),
    onSuccess: async () => {
      setContentCode("");
      setContentName("");
      await invalidate("contents");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createLanding = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingLandingPage({
        code: landingCode.trim(),
        name: landingName.trim(),
        pageType: "CAMPAIGN",
        slug: landingSlug.trim(),
        productId: productId || null,
      }),
    onSuccess: async () => {
      setLandingCode("");
      setLandingName("");
      setLandingSlug("");
      await invalidate("landing");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const upsertChannel = useMutation({
    mutationFn: async () =>
      edgeApi.upsertMarketingChannel({
        code: channelCode.trim(),
        channelType: "EMAIL",
        displayName: channelName.trim(),
        status: "CONFIGURING",
        secretRef: "vault:marketing/email/default",
      }),
    onSuccess: async () => {
      setChannelCode("");
      setChannelName("");
      await invalidate("channels");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const createJourney = useMutation({
    mutationFn: async () =>
      edgeApi.createMarketingJourney({
        code: journeyCode.trim(),
        name: journeyName.trim(),
        triggerType: "FORM_SUBMITTED",
        productId: productId || null,
        definition: {
          entryStepKey: "engage",
          steps: [
            {
              key: "engage",
              type: "UPDATE_STATUS",
              toStatus: "ENGAGED",
              next: "stop",
            },
            { key: "stop", type: "STOP" },
          ],
        },
      }),
    onSuccess: async () => {
      setJourneyCode("");
      setJourneyName("");
      await invalidate("journeys");
    },
    onError: (err) =>
      setFormError(err instanceof EdgeApiError ? err.message : "Create failed"),
  });

  const visibleTabs = useMemo(
    () =>
      TABS.filter(
        (t) =>
          !permissionKnown || hasEdgePermission(permissions, t.permission),
      ),
    [permissionKnown, permissions],
  );

  if (!anyAllowed) {
    return (
      <EdgeForbiddenState description="Requires platform:marketing:* permissions." />
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      <header className="space-y-[var(--space-2)]">
        <h1 className="type-xl font-semibold tracking-tight">Marketing</h1>
        <p className="type-sm text-[var(--text-secondary)] max-w-3xl">
          Okapi Edge acquisition plane — strategies, audiences, campaigns,
          forms and leads. Does not create tenants or subscriptions. Metrics
          distinguish measured, estimated and unavailable values.
        </p>
      </header>

      <div className="flex flex-wrap gap-[var(--space-2)]">
        <select
          className={fieldControlClass}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">All products</option>
          {(productsQuery.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>

      <nav className="flex flex-wrap gap-[var(--space-2)] border-b border-[var(--border)] pb-[var(--space-2)]">
        {visibleTabs.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </nav>

      {formError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {formError}
        </p>
      ) : null}

      {tab === "overview" ? (
        <section className="grid gap-[var(--space-4)] md:grid-cols-2">
          <p className="type-sm text-[var(--text-secondary)] md:col-span-2">
            Acquisition overview (counts from live APIs — no invented
            impressions).
          </p>
          <div>
            <p className="type-xs text-[var(--text-muted)]">Strategies</p>
            <p className="type-lg font-semibold">
              {strategiesQuery.data?.length ?? "—"}
            </p>
          </div>
          <div>
            <p className="type-xs text-[var(--text-muted)]">Campaigns</p>
            <p className="type-lg font-semibold">
              {campaignsQuery.data?.length ?? "—"}
            </p>
          </div>
          <div>
            <p className="type-xs text-[var(--text-muted)]">Audiences</p>
            <p className="type-lg font-semibold">
              {audiencesQuery.data?.length ?? "—"}
            </p>
          </div>
          <div>
            <p className="type-xs text-[var(--text-muted)]">Leads</p>
            <p className="type-lg font-semibold">
              {leadsQuery.data?.length ?? "—"}
            </p>
          </div>
        </section>
      ) : null}

      {tab === "strategies" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:strategy:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createStrategy.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create strategy</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={strategyCode}
                onChange={(e) => setStrategyCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createStrategy.isPending}>
                Create strategy
              </Button>
            </form>
          </EdgePermissionGate>
          {strategiesQuery.isLoading ? (
            <EdgeLoadingState />
          ) : strategiesQuery.isError ? (
            <EdgeErrorState description="Unable to load strategies." />
          ) : (strategiesQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No strategies"
              description="Define product, vertical or global marketing strategies first."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {strategiesQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.scopeType}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "audiences" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:audience:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createAudience.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create audience</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Rules reference P2 ICPs/segments — never fork commercial
                definitions.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={audienceCode}
                onChange={(e) => setAudienceCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={audienceName}
                onChange={(e) => setAudienceName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createAudience.isPending}>
                Create audience
              </Button>
            </form>
          </EdgePermissionGate>
          {audiencesQuery.isLoading ? (
            <EdgeLoadingState />
          ) : audiencesQuery.isError ? (
            <EdgeErrorState description="Unable to load audiences." />
          ) : (audiencesQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No audiences"
              description="Audiences are versioned targeting criteria, not CRM lists."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {audiencesQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">{row.code}</p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "campaigns" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:campaign:create">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!productId) {
                  setFormError("Select a product before creating a campaign.");
                  return;
                }
                createCampaign.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create campaign</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={campaignCode}
                onChange={(e) => setCampaignCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
              <select
                className={fieldControlClass}
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
              >
                <option value="LEAD_GENERATION">Lead generation</option>
                <option value="DEMO_REQUEST">Demo request</option>
                <option value="PRODUCT_LAUNCH">Product launch</option>
                <option value="VERTICAL_ACQUISITION">Vertical acquisition</option>
                <option value="FREE_TRIAL_ACQUISITION">Free trial</option>
              </select>
              <Button type="submit" disabled={createCampaign.isPending}>
                Create campaign
              </Button>
            </form>
          </EdgePermissionGate>
          {campaignsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : campaignsQuery.isError ? (
            <EdgeErrorState description="Unable to load campaigns." />
          ) : (campaignsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No campaigns"
              description="Publication requires FINAL approval and a commercially available product."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {campaignsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.campaignType}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "forms" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:form:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createForm.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create acquisition form</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Public submissions never create tenants or subscriptions.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Public slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                required
              />
              <select
                className={fieldControlClass}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="DEMO_REQUEST">Demo request</option>
                <option value="CONTACT">Contact</option>
                <option value="TRIAL_REQUEST">Trial request</option>
                <option value="QUOTE_REQUEST">Quote request</option>
                <option value="PARTNERSHIP">Partnership</option>
              </select>
              <Button type="submit" disabled={createForm.isPending}>
                Create form
              </Button>
            </form>
          </EdgePermissionGate>
          {formsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : formsQuery.isError ? (
            <EdgeErrorState description="Unable to load forms." />
          ) : (formsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No forms"
              description="Publish a form before accepting public submissions."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {formsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.formType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{row.status}</Badge>
                    {row.status !== "PUBLISHED" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          edgeApi
                            .publishMarketingForm(row.id)
                            .then(() => invalidate("forms"))
                            .catch((err) =>
                              setFormError(
                                err instanceof EdgeApiError
                                  ? err.message
                                  : "Publish failed",
                              ),
                            )
                        }
                      >
                        Publish
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "leads" ? (
        <section>
          {leadsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : leadsQuery.isError ? (
            <EdgeErrorState description="Unable to load leads." />
          ) : (leadsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No leads"
              description="Leads are created from published form submissions — not inventable."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {leadsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">
                      {row.emailNormalized ?? row.id}
                    </p>
                    <p className="type-xs text-[var(--text-muted)]">{row.id}</p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "content" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:content:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createContent.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create content</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={contentCode}
                onChange={(e) => setContentCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={contentName}
                onChange={(e) => setContentName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createContent.isPending}>
                Create content
              </Button>
            </form>
          </EdgePermissionGate>
          {contentsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : contentsQuery.isError ? (
            <EdgeErrorState description="Unable to load content." />
          ) : (contentsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No content"
              description="Approve then publish — commercial claims must match P1/P2."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {contentsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="space-y-[var(--space-3)] py-[var(--space-3)]"
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="type-sm font-medium">{row.name}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {row.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{row.status}</Badge>
                      {row.status === "DRAFT" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            edgeApi
                              .approveMarketingContent(row.id)
                              .then(() => invalidate("contents"))
                              .catch((err) =>
                                setFormError(
                                  err instanceof EdgeApiError
                                    ? err.message
                                    : "Approve failed",
                                ),
                              )
                          }
                        >
                          Approve
                        </Button>
                      ) : null}
                      {row.status === "APPROVED" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            edgeApi
                              .publishMarketingContent(row.id)
                              .then(() => invalidate("contents"))
                              .catch((err) =>
                                setFormError(
                                  err instanceof EdgeApiError
                                    ? err.message
                                    : "Publish failed",
                                ),
                              )
                          }
                        >
                          Publish
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {row.status === "DRAFT" || row.status === "APPROVED" ? (
                    <MarketingStudioEditor
                      initial={row.body?.studio ?? emptyStudio()}
                      onSave={async (studio) => {
                        await edgeApi.updateMarketingContentStudio(
                          row.id,
                          studio,
                        );
                        await invalidate("contents");
                      }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "landing" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:landing_page:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createLanding.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create landing page</h2>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={landingCode}
                onChange={(e) => setLandingCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={landingName}
                onChange={(e) => setLandingName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Slug"
                value={landingSlug}
                onChange={(e) => setLandingSlug(e.target.value)}
                required
              />
              <Button type="submit" disabled={createLanding.isPending}>
                Create landing page
              </Button>
            </form>
          </EdgePermissionGate>
          {landingsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : landingsQuery.isError ? (
            <EdgeErrorState description="Unable to load landing pages." />
          ) : (landingsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No landing pages"
              description="Governed templates only — not a general CMS."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {landingsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="space-y-[var(--space-3)] py-[var(--space-3)]"
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="type-sm font-medium">{row.name}</p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {row.code} · /{row.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{row.status}</Badge>
                      {row.status !== "PUBLISHED" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            edgeApi
                              .publishMarketingLandingPage(row.id)
                              .then(() => invalidate("landing"))
                              .catch((err) =>
                                setFormError(
                                  err instanceof EdgeApiError
                                    ? err.message
                                    : "Publish failed",
                                ),
                              )
                          }
                        >
                          Publish
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {row.status !== "PUBLISHED" && row.status !== "ARCHIVED" ? (
                    <MarketingStudioEditor
                      initial={row.layout?.studio ?? emptyStudio()}
                      onSave={async (studio) => {
                        await edgeApi.updateMarketingLandingStudio(
                          row.id,
                          studio,
                        );
                        await invalidate("landing");
                      }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "channels" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:integrations:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                upsertChannel.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Register channel</h2>
              <p className="type-xs text-[var(--text-muted)]">
                EMAIL uses Resend when MARKETING_CHANNEL_ADAPTER=resend (or
                auto). Secrets via env/secretRef only. Hand-off is ACCEPTED;
                DELIVERED only after a signed Resend webhook receipt.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={channelCode}
                onChange={(e) => setChannelCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Display name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
              />
              <Button type="submit" disabled={upsertChannel.isPending}>
                Save channel
              </Button>
            </form>
          </EdgePermissionGate>
          {channelsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : channelsQuery.isError ? (
            <EdgeErrorState description="Unable to load channels." />
          ) : (channelsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No channels"
              description="Configure adapters before requesting deliveries."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {channelsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">
                      {row.displayName ?? row.name}
                    </p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.channelType}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "journeys" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:automation:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createJourney.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create journey</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Deterministic steps — consent gates stop marketing sends.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={journeyCode}
                onChange={(e) => setJourneyCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createJourney.isPending}>
                Create journey
              </Button>
            </form>
          </EdgePermissionGate>
          {journeysQuery.isLoading ? (
            <EdgeLoadingState />
          ) : journeysQuery.isError ? (
            <EdgeErrorState description="Unable to load journeys." />
          ) : (journeysQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No journeys"
              description="Activate a journey before starting executions."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {journeysQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.triggerType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{row.status}</Badge>
                    {row.status === "DRAFT" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          edgeApi
                            .activateMarketingJourney(row.id)
                            .then(() => invalidate("journeys"))
                            .catch((err) =>
                              setFormError(
                                err instanceof EdgeApiError
                                  ? err.message
                                  : "Activate failed",
                              ),
                            )
                        }
                      >
                        Activate
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <EdgePermissionGate permission="platform:marketing:automation:manage">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                edgeApi
                  .resumeMarketingJourneyWaits(25)
                  .then(() => invalidate("journeys"))
                  .catch((err) =>
                    setFormError(
                      err instanceof EdgeApiError
                        ? err.message
                        : "Resume waits failed",
                    ),
                  )
              }
            >
              Resume due waits
            </Button>
          </EdgePermissionGate>
        </section>
      ) : null}

      {tab === "attribution" ? (
        <section className="space-y-[var(--space-5)]">
          <p className="type-sm text-[var(--text-secondary)]">
            Attribution models are versioned. Missing touchpoints stay
            UNAVAILABLE — never invented. Snapshots require explicit metric
            quality labels. CAC stays unavailable until revenue is reconciled.
          </p>
          {analyticsSummaryQuery.data ? (
            <div className="space-y-[var(--space-3)]">
              <div className="flex flex-wrap gap-[var(--space-3)] type-xs text-[var(--text-secondary)]">
                <span>
                  Snapshots: {analyticsSummaryQuery.data.snapshotCount}
                </span>
                <Badge tone="success">
                  MEASURED {analyticsSummaryQuery.data.qualityCounts.MEASURED}
                </Badge>
                <Badge tone="warning">
                  ESTIMATED {analyticsSummaryQuery.data.qualityCounts.ESTIMATED}
                </Badge>
                <Badge tone="info">
                  UNAVAILABLE{" "}
                  {analyticsSummaryQuery.data.qualityCounts.UNAVAILABLE}
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["CAC", analyticsSummaryQuery.data.cac],
                    ["ROAS", analyticsSummaryQuery.data.roas],
                    ["LTV", analyticsSummaryQuery.data.ltv],
                    [
                      "Revenue attributed",
                      analyticsSummaryQuery.data.revenueAttributed,
                    ],
                  ] as const
                ).map(([label, metric]) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-3)]"
                    title={metric.reason}
                  >
                    <p className="type-xs text-[var(--text-muted)]">{label}</p>
                    <p className="type-sm font-medium">{metric.status}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      revenueReconciled=
                      {String(analyticsSummaryQuery.data.revenueReconciled)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <EdgePermissionGate permission="platform:marketing:analytics:read">
            <div className="flex flex-wrap gap-[var(--space-2)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  edgeApi
                    .createMarketingAnalyticsSnapshot({
                      scopeType: "GLOBAL",
                      periodStart: today,
                      periodEnd: today,
                      metrics: { leadsCreated: leadsQuery.data?.length ?? 0 },
                      metricQuality: { leadsCreated: "MEASURED" },
                    })
                    .then(() => {
                      void queryClient.invalidateQueries({
                        queryKey: ["edge", "marketing", "snapshots"],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ["edge", "marketing", "analytics-summary"],
                      });
                    })
                    .catch((err) =>
                      setFormError(
                        err instanceof EdgeApiError
                          ? err.message
                          : "Snapshot failed",
                      ),
                    );
                }}
              >
                Record measured leads snapshot
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  edgeApi
                    .createMarketingAnalyticsSnapshot({
                      scopeType: "GLOBAL",
                      periodStart: today,
                      periodEnd: today,
                      metrics: { cac: null },
                      metricQuality: { cac: "UNAVAILABLE" },
                    })
                    .then(() => {
                      void queryClient.invalidateQueries({
                        queryKey: ["edge", "marketing", "snapshots"],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ["edge", "marketing", "analytics-summary"],
                      });
                    })
                    .catch((err) =>
                      setFormError(
                        err instanceof EdgeApiError
                          ? err.message
                          : "Snapshot failed",
                      ),
                    );
                }}
              >
                Record CAC unavailable
              </Button>
            </div>
          </EdgePermissionGate>
          {attributionQuery.isLoading ? (
            <EdgeLoadingState />
          ) : attributionQuery.isError ? (
            <EdgeErrorState description="Unable to load attribution models." />
          ) : (attributionQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No attribution models"
              description="Seeded by migration 078."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {attributionQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.modelType}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div>
            <h2 className="type-md font-semibold mb-[var(--space-2)]">
              Performance snapshots
            </h2>
            {snapshotsQuery.isLoading ? (
              <EdgeLoadingState />
            ) : (snapshotsQuery.data?.length ?? 0) === 0 ? (
              <EdgeEmptyState
                title="No snapshots"
                description="Create snapshots only from measured or explicitly estimated values."
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {snapshotsQuery.data?.map((row) => (
                  <li key={row.id} className="py-[var(--space-3)] space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="type-sm font-medium">{row.scopeType}</p>
                      {row.periodStart && row.periodEnd ? (
                        <span className="type-xs text-[var(--text-muted)]">
                          {row.periodStart} → {row.periodEnd}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(row.metricQuality).map(([key, quality]) => (
                        <Badge
                          key={key}
                          tone={
                            quality === "MEASURED"
                              ? "success"
                              : quality === "ESTIMATED"
                                ? "warning"
                                : "info"
                          }
                        >
                          {key}: {String(quality)} ={" "}
                          {JSON.stringify(row.metrics[key] ?? null)}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "budgets" ? (
        <section className="space-y-[var(--space-4)]">
          <EdgePermissionGate permission="platform:marketing:budget:manage">
            <form
              className="grid max-w-xl gap-[var(--space-3)]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                createBudget.mutate();
              }}
            >
              <h2 className="type-md font-semibold">Create budget</h2>
              <p className="type-xs text-[var(--text-muted)]">
                Pilotage only — not accounting SoT.
              </p>
              <input
                className={fieldControlClass}
                placeholder="Code"
                value={budgetCode}
                onChange={(e) => setBudgetCode(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Name"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Planned amount"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Currency"
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                required
              />
              <Button type="submit" disabled={createBudget.isPending}>
                Create budget
              </Button>
            </form>
          </EdgePermissionGate>
          {budgetsQuery.isLoading ? (
            <EdgeLoadingState />
          ) : budgetsQuery.isError ? (
            <EdgeErrorState description="Unable to load budgets." />
          ) : (budgetsQuery.data?.length ?? 0) === 0 ? (
            <EdgeEmptyState
              title="No budgets"
              description="Declare planned amounts only — never invent spend."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {budgetsQuery.data?.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between gap-2 py-[var(--space-3)]"
                >
                  <div>
                    <p className="type-sm font-medium">{row.name}</p>
                    <p className="type-xs text-[var(--text-muted)]">
                      {row.code} · {row.plannedAmount} {row.currency}
                    </p>
                  </div>
                  <Badge>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
