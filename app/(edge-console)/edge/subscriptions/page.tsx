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
  | "registry"
  | "changes"
  | "renewals"
  | "trials"
  | "entitlements"
  | "suspension"
  | "enterprise"
  | "billing"
  | "provisioning"
  | "policies"
  | "analytics";

const TABS: { id: Tab; label: string; permission: string }[] = [
  {
    id: "overview",
    label: "Overview",
    permission: "platform:subscriptions:read_analytics",
  },
  {
    id: "registry",
    label: "Registry",
    permission: "platform:subscriptions:read",
  },
  {
    id: "changes",
    label: "Changes",
    permission: "platform:subscriptions:change_plan",
  },
  {
    id: "renewals",
    label: "Renewals",
    permission: "platform:subscriptions:renew",
  },
  {
    id: "trials",
    label: "Trials",
    permission: "platform:subscriptions:manage_trials",
  },
  {
    id: "entitlements",
    label: "Entitlements",
    permission: "platform:subscriptions:read_entitlements",
  },
  {
    id: "suspension",
    label: "Suspension",
    permission: "platform:subscriptions:suspend",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    permission: "platform:subscriptions:read_enterprise",
  },
  {
    id: "billing",
    label: "Billing",
    permission: "platform:subscriptions:manage_integrations",
  },
  {
    id: "provisioning",
    label: "Provisioning",
    permission: "platform:subscriptions:manage_integrations",
  },
  {
    id: "policies",
    label: "Policies",
    permission: "platform:subscriptions:manage_policies",
  },
  {
    id: "analytics",
    label: "Analytics",
    permission: "platform:subscriptions:read_analytics",
  },
];

export default function EdgeSubscriptionsPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [draftForm, setDraftForm] = useState({
    accountId: "",
    productId: "",
    currency: "USD",
  });
  const [handoffId, setHandoffId] = useState("");
  const [suspendForm, setSuspendForm] = useState({
    subscriptionId: "",
    reason: "",
  });
  const [changeSubId, setChangeSubId] = useState("");
  const [renewalSubId, setRenewalSubId] = useState("");
  const [entitlementSubId, setEntitlementSubId] = useState("");
  const [registryStatus, setRegistryStatus] = useState("");
  const [changeForm, setChangeForm] = useState({
    changeType: "PLAN_CHANGE",
    billingFrequency: "",
    reason: "",
  });
  const [trialForm, setTrialForm] = useState({
    accountId: "",
    productId: "",
    durationDays: "14",
  });
  const [billingHub, setBillingHub] = useState({
    subscriptionId: "",
    coordinationId: "",
    billingAccountRef: "",
  });
  const [provisioningHub, setProvisioningHub] = useState({
    subscriptionId: "",
    reqId: "",
    tenantRef: "",
  });

  const canReadAny = useMemo(
    () =>
      TABS.some((t) => hasEdgePermission(permissions, t.permission)) ||
      hasEdgePermission(permissions, "platform:subscriptions:read"),
    [permissions],
  );

  const overviewQuery = useQuery({
    queryKey: ["edge", "subscriptions", "overview"],
    queryFn: () => edgeApi.getSubscriptionOverview(),
    enabled:
      (tab === "overview" || tab === "policies") && canReadAny,
  });

  const policiesQuery = useQuery({
    queryKey: ["edge", "subscriptions", "policies"],
    queryFn: () => edgeApi.getSubscriptionPolicies(),
    enabled: tab === "policies" && canReadAny,
    retry: false,
  });

  const analyticsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "analytics"],
    queryFn: () => edgeApi.getSubscriptionAnalytics(),
    enabled: tab === "analytics" && canReadAny,
  });

  const listQuery = useQuery({
    queryKey: ["edge", "subscriptions", "list", registryStatus],
    queryFn: () =>
      edgeApi.listSubscriptions({
        limit: 50,
        status: registryStatus || undefined,
      }),
    enabled:
      (tab === "registry" ||
        tab === "changes" ||
        tab === "renewals" ||
        tab === "entitlements" ||
        tab === "suspension" ||
        tab === "billing" ||
        tab === "provisioning" ||
        tab === "enterprise") &&
      canReadAny,
  });

  const trialsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "trials"],
    queryFn: () => edgeApi.listSubscriptionTrials({}),
    enabled: tab === "trials" && canReadAny,
  });

  const changesQuery = useQuery({
    queryKey: ["edge", "subscriptions", "changes", changeSubId],
    queryFn: () => edgeApi.listSubscriptionChanges(changeSubId),
    enabled:
      tab === "changes" && Boolean(changeSubId) && canReadAny,
  });

  const renewalsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "renewals", renewalSubId],
    queryFn: () => edgeApi.listSubscriptionRenewals(renewalSubId),
    enabled:
      tab === "renewals" && Boolean(renewalSubId) && canReadAny,
  });

  const entitlementsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "entitlements", entitlementSubId],
    queryFn: () => edgeApi.listSubscriptionEntitlements(entitlementSubId),
    enabled:
      tab === "entitlements" &&
      Boolean(entitlementSubId) &&
      canReadAny,
  });

  const createDraft = useMutation({
    mutationFn: () =>
      edgeApi.createSubscription({
        accountId: draftForm.accountId,
        productId: draftForm.productId,
        currency: draftForm.currency || undefined,
      }),
    onSuccess: () => {
      setDraftForm({ accountId: "", productId: "", currency: "USD" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions"],
      });
    },
  });

  const fromHandoff = useMutation({
    mutationFn: () =>
      edgeApi.createSubscriptionFromHandoff({
        handoffId,
        acceptHandoff: true,
      }),
    onSuccess: () => {
      setHandoffId("");
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions"],
      });
    },
  });

  const suspendSub = useMutation({
    mutationFn: () =>
      edgeApi.suspendSubscription(suspendForm.subscriptionId, {
        reason: suspendForm.reason,
      }),
    onSuccess: () => {
      setSuspendForm({ subscriptionId: "", reason: "" });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions"],
      });
    },
  });

  const createChange = useMutation({
    mutationFn: () => {
      const proposedConfig: Record<string, unknown> = {};
      if (changeForm.billingFrequency.trim()) {
        proposedConfig.billingFrequency = changeForm.billingFrequency.trim();
      }
      return edgeApi.createSubscriptionChange(changeSubId, {
        changeType: changeForm.changeType,
        proposedConfig: Object.keys(proposedConfig).length
          ? proposedConfig
          : undefined,
        reason: changeForm.reason || undefined,
      });
    },
    onSuccess: () => {
      setChangeForm((s) => ({ ...s, reason: "", billingFrequency: "" }));
      void changesQuery.refetch();
    },
  });

  const createRenewal = useMutation({
    mutationFn: () => edgeApi.createSubscriptionRenewal(renewalSubId),
    onSuccess: () => void renewalsQuery.refetch(),
  });

  const startTrial = useMutation({
    mutationFn: () =>
      edgeApi.startSubscriptionTrial({
        accountId: trialForm.accountId,
        productId: trialForm.productId,
        durationDays: Number(trialForm.durationDays) || undefined,
      }),
    onSuccess: () => {
      setTrialForm({ accountId: "", productId: "", durationDays: "14" });
      void trialsQuery.refetch();
    },
  });

  const hubRequestBilling = useMutation({
    mutationFn: () =>
      edgeApi.requestSubscriptionBillingCoordination(billingHub.subscriptionId, {
        billingAccountRef: billingHub.billingAccountRef || undefined,
      }),
    onSuccess: () =>
      setBillingHub((s) => ({ ...s, billingAccountRef: "" })),
  });

  const hubConfirmBilling = useMutation({
    mutationFn: () =>
      edgeApi.confirmSubscriptionBillingCoordination(
        billingHub.subscriptionId,
        billingHub.coordinationId,
      ),
    onSuccess: () =>
      setBillingHub((s) => ({ ...s, coordinationId: "" })),
  });

  const hubRequestProvisioning = useMutation({
    mutationFn: () =>
      edgeApi.requestSubscriptionProvisioning(provisioningHub.subscriptionId),
  });

  const hubCompleteProvisioning = useMutation({
    mutationFn: () =>
      edgeApi.completeSubscriptionProvisioning(
        provisioningHub.subscriptionId,
        provisioningHub.reqId,
        { tenantRef: provisioningHub.tenantRef || undefined },
      ),
    onSuccess: () =>
      setProvisioningHub((s) => ({ ...s, reqId: "", tenantRef: "" })),
  });

  const subs = useMemo(() => {
    const data = listQuery.data;
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    return (
      (data as { items?: Record<string, unknown>[] } | undefined)?.items ?? []
    );
  }, [listQuery.data]);

  if (platformLoading) {
    return <EdgeLoadingState label="Loading subscriptions…" />;
  }
  if (!canReadAny) return <EdgeForbiddenState />;

  const overview = overviewQuery.data as Record<string, unknown> | undefined;
  const analytics = analyticsQuery.data as
    | {
        label?: string;
        disclaimer?: string;
        recognizedRevenue?: unknown;
      }
    | undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Subscription &amp; Contract Lifecycle
        </p>
        <h1 className="font-display text-3xl tracking-tight">
          Okapi Edge Subscriptions
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Contract registry, activation gates, entitlements, and renewals. P4
          handoff feeds drafts; activation requires commercial validation plus
          provisioning and billing confirmation where applicable — not payment
          capture in this console.
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
        <EdgePermissionGate permission="platform:subscriptions:read_analytics">
          {overviewQuery.isLoading ? (
            <EdgeLoadingState label="Loading overview…" />
          ) : overviewQuery.isError ? (
            <EdgeErrorState
              error={overviewQuery.error}
              onRetry={() => void overviewQuery.refetch()}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total"
                  value={Number(overview?.total ?? overview?.subscriptionsTotal ?? 0)}
                />
                <MetricCard
                  label="Active"
                  value={Number(overview?.active ?? overview?.activeCount ?? 0)}
                />
                <MetricCard
                  label="Draft"
                  value={Number(overview?.draft ?? overview?.draftCount ?? 0)}
                />
                <MetricCard
                  label="Suspended"
                  value={Number(overview?.suspended ?? overview?.suspendedCount ?? 0)}
                />
              </div>
              {overview?.note ? (
                <p className="text-sm text-muted-foreground">
                  {String(overview.note)}
                </p>
              ) : null}
            </div>
          )}
        </EdgePermissionGate>
      ) : null}

      {tab === "registry" ? (
        <EdgePermissionGate permission="platform:subscriptions:read">
          <section className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-muted-foreground">
                Filter status
              </label>
              <input
                className={fieldControlClass + " max-w-xs"}
                placeholder="e.g. DRAFT, ACTIVE"
                value={registryStatus}
                onChange={(e) => setRegistryStatus(e.target.value)}
              />
            </div>

            <EdgePermissionGate permission="platform:subscriptions:create">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createDraft.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Create draft subscription
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Account ID"
                  value={draftForm.accountId}
                  onChange={(e) =>
                    setDraftForm((s) => ({ ...s, accountId: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Product ID"
                  value={draftForm.productId}
                  onChange={(e) =>
                    setDraftForm((s) => ({ ...s, productId: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Currency"
                  value={draftForm.currency}
                  onChange={(e) =>
                    setDraftForm((s) => ({ ...s, currency: e.target.value }))
                  }
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createDraft.isPending}>
                    Create draft
                  </Button>
                  {createDraft.isError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {(createDraft.error as EdgeApiError)?.message ??
                        "Create failed"}
                    </p>
                  ) : null}
                </div>
              </form>

              <form
                className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 p-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  fromHandoff.mutate();
                }}
              >
                <div className="min-w-[16rem] flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">
                    P4 sales handoff ID
                  </label>
                  <input
                    className={fieldControlClass}
                    value={handoffId}
                    onChange={(e) => setHandoffId(e.target.value)}
                    placeholder="Handoff UUID"
                    required
                  />
                </div>
                <Button type="submit" disabled={fromHandoff.isPending}>
                  Create from handoff
                </Button>
                {fromHandoff.isError ? (
                  <p className="w-full text-sm text-destructive">
                    {(fromHandoff.error as EdgeApiError)?.message ??
                      "Handoff failed"}
                  </p>
                ) : null}
              </form>
            </EdgePermissionGate>

            {listQuery.isLoading ? (
              <EdgeLoadingState label="Loading registry…" />
            ) : listQuery.isError ? (
              <EdgeErrorState
                error={listQuery.error}
                onRetry={() => void listQuery.refetch()}
              />
            ) : !subs.length ? (
              <EdgeEmptyState title="No subscriptions yet" />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {subs.map((s) => (
                  <li key={String(s.id)} className="flex flex-wrap gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/edge/subscriptions/${String(s.id)}`}
                        className="font-medium hover:underline"
                      >
                        {String(s.subscriptionNumber ?? s.id)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Account {String(s.accountId).slice(0, 8)}… · Product{" "}
                        {String(s.productId).slice(0, 8)}…
                      </p>
                    </div>
                    <Badge tone="default">{String(s.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "changes" ? (
        <EdgePermissionGate permission="platform:subscriptions:change_plan">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Governed plan and composition changes per subscription workspace.
            </p>
            <SubscriptionPicker
              subs={subs}
              value={changeSubId}
              onChange={setChangeSubId}
            />
            {changeSubId ? (
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createChange.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Create change request
                </h2>
                <input
                  className={fieldControlClass}
                  placeholder="Change type"
                  value={changeForm.changeType}
                  onChange={(e) =>
                    setChangeForm((s) => ({ ...s, changeType: e.target.value }))
                  }
                  required
                />
                <input
                  className={fieldControlClass}
                  placeholder="Proposed billing frequency"
                  value={changeForm.billingFrequency}
                  onChange={(e) =>
                    setChangeForm((s) => ({
                      ...s,
                      billingFrequency: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass + " sm:col-span-2"}
                  placeholder="Reason (optional)"
                  value={changeForm.reason}
                  onChange={(e) =>
                    setChangeForm((s) => ({ ...s, reason: e.target.value }))
                  }
                />
                <Button type="submit" disabled={createChange.isPending}>
                  Create change
                </Button>
                {createChange.isError ? (
                  <p className="sm:col-span-2 text-sm text-destructive">
                    {(createChange.error as EdgeApiError)?.message ??
                      "Create change failed"}
                  </p>
                ) : null}
              </form>
            ) : null}
            {changeSubId && changesQuery.isLoading ? (
              <EdgeLoadingState label="Loading change requests…" />
            ) : changeSubId && !(changesQuery.data as unknown[] | undefined)?.length ? (
              <EdgeEmptyState title="No change requests" />
            ) : changeSubId ? (
              <EntityList
                items={(changesQuery.data as Record<string, unknown>[]) ?? []}
                labelKey="changeType"
              />
            ) : (
              <EdgeEmptyState title="Select a subscription" />
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "renewals" ? (
        <EdgePermissionGate permission="platform:subscriptions:renew">
          <section className="space-y-4">
            <SubscriptionPicker
              subs={subs}
              value={renewalSubId}
              onChange={setRenewalSubId}
            />
            {renewalSubId ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-4">
                <Button
                  type="button"
                  disabled={createRenewal.isPending}
                  onClick={() => createRenewal.mutate()}
                >
                  Create renewal
                </Button>
                {createRenewal.isError ? (
                  <p className="text-sm text-destructive">
                    {(createRenewal.error as EdgeApiError)?.message ??
                      "Renewal failed"}
                  </p>
                ) : null}
              </div>
            ) : null}
            {renewalSubId && renewalsQuery.isLoading ? (
              <EdgeLoadingState label="Loading renewals…" />
            ) : renewalSubId &&
              !(renewalsQuery.data as unknown[] | undefined)?.length ? (
              <EdgeEmptyState title="No renewal events" />
            ) : renewalSubId ? (
              <EntityList
                items={(renewalsQuery.data as Record<string, unknown>[]) ?? []}
                labelKey="status"
              />
            ) : (
              <EdgeEmptyState title="Select a subscription" />
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "trials" ? (
        <EdgePermissionGate permission="platform:subscriptions:manage_trials">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                startTrial.mutate();
              }}
            >
              <h2 className="md:col-span-4 text-sm font-medium">Start trial</h2>
              <input
                className={fieldControlClass}
                placeholder="Account ID"
                value={trialForm.accountId}
                onChange={(e) =>
                  setTrialForm((s) => ({ ...s, accountId: e.target.value }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Product ID"
                value={trialForm.productId}
                onChange={(e) =>
                  setTrialForm((s) => ({ ...s, productId: e.target.value }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Duration (days)"
                value={trialForm.durationDays}
                onChange={(e) =>
                  setTrialForm((s) => ({ ...s, durationDays: e.target.value }))
                }
              />
              <Button type="submit" disabled={startTrial.isPending}>
                Start trial
              </Button>
              {startTrial.isError ? (
                <p className="md:col-span-4 text-sm text-destructive">
                  {(startTrial.error as EdgeApiError)?.message ??
                    "Start trial failed"}
                </p>
              ) : null}
            </form>
            {trialsQuery.isLoading ? (
              <EdgeLoadingState label="Loading trials…" />
            ) : trialsQuery.isError ? (
              <EdgeErrorState
                error={trialsQuery.error}
                onRetry={() => void trialsQuery.refetch()}
              />
            ) : !(trialsQuery.data as unknown[] | undefined)?.length ? (
              <EdgeEmptyState title="No trials" />
            ) : (
              <EntityList
                items={(trialsQuery.data as Record<string, unknown>[]) ?? []}
                labelKey="status"
              />
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "entitlements" ? (
        <EdgePermissionGate permission="platform:subscriptions:read_entitlements">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Snapshots are calculated and published from the workspace; runtime
              enforcement is downstream.
            </p>
            <SubscriptionPicker
              subs={subs}
              value={entitlementSubId}
              onChange={setEntitlementSubId}
            />
            {entitlementSubId && entitlementsQuery.isLoading ? (
              <EdgeLoadingState label="Loading entitlements…" />
            ) : entitlementSubId &&
              !(entitlementsQuery.data as unknown[] | undefined)?.length ? (
              <EdgeEmptyState title="No entitlement snapshots" />
            ) : entitlementSubId ? (
              <EntityList
                items={
                  (entitlementsQuery.data as Record<string, unknown>[]) ?? []
                }
                labelKey="version"
              />
            ) : (
              <EdgeEmptyState title="Select a subscription" />
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "suspension" ? (
        <EdgePermissionGate permission="platform:subscriptions:suspend">
          <section className="space-y-4">
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                suspendSub.mutate();
              }}
            >
              <input
                className={fieldControlClass}
                placeholder="Subscription ID"
                value={suspendForm.subscriptionId}
                onChange={(e) =>
                  setSuspendForm((s) => ({
                    ...s,
                    subscriptionId: e.target.value,
                  }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Reason (required)"
                value={suspendForm.reason}
                onChange={(e) =>
                  setSuspendForm((s) => ({ ...s, reason: e.target.value }))
                }
                required
              />
              <Button type="submit" disabled={suspendSub.isPending}>
                Suspend
              </Button>
              {suspendSub.isError ? (
                <p className="md:col-span-3 text-sm text-destructive">
                  {(suspendSub.error as EdgeApiError)?.message ??
                    "Suspend failed"}
                </p>
              ) : null}
            </form>
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "enterprise" ? (
        <EdgePermissionGate permission="platform:subscriptions:read_enterprise">
          <p className="text-sm text-muted-foreground">
            Enterprise overlays attach at subscription creation (
            <code className="text-xs">enterpriseProfile</code>). Use the
            workspace for per-subscription enterprise terms.
          </p>
          {!subs.filter((s) => s.enterpriseProfile).length ? (
            <EdgeEmptyState title="No enterprise overlays in current list" />
          ) : (
            <EntityList
              items={subs.filter((s) => s.enterpriseProfile)}
              labelKey="subscriptionNumber"
            />
          )}
        </EdgePermissionGate>
      ) : null}

      {tab === "billing" ? (
        <EdgePermissionGate permission="platform:subscriptions:manage_integrations">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Billing coordination confirms an external billing account (P6). This
              console does not collect payment instruments — use workspace actions
              after subscription is approved.
            </p>
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                hubRequestBilling.mutate();
              }}
            >
              <h2 className="md:col-span-2 text-sm font-medium">
                Request billing coordination
              </h2>
              <input
                className={fieldControlClass}
                placeholder="Subscription ID"
                value={billingHub.subscriptionId}
                onChange={(e) =>
                  setBillingHub((s) => ({
                    ...s,
                    subscriptionId: e.target.value,
                  }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Billing account ref (optional)"
                value={billingHub.billingAccountRef}
                onChange={(e) =>
                  setBillingHub((s) => ({
                    ...s,
                    billingAccountRef: e.target.value,
                  }))
                }
              />
              <Button
                type="submit"
                className="md:col-span-2"
                disabled={hubRequestBilling.isPending}
              >
                Request coordination
              </Button>
            </form>
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                hubConfirmBilling.mutate();
              }}
            >
              <h2 className="md:col-span-2 text-sm font-medium">
                Confirm billing coordination
              </h2>
              <input
                className={fieldControlClass}
                placeholder="Subscription ID"
                value={billingHub.subscriptionId}
                onChange={(e) =>
                  setBillingHub((s) => ({
                    ...s,
                    subscriptionId: e.target.value,
                  }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Coordination ID"
                value={billingHub.coordinationId}
                onChange={(e) =>
                  setBillingHub((s) => ({
                    ...s,
                    coordinationId: e.target.value,
                  }))
                }
                required
              />
              <Button
                type="submit"
                className="md:col-span-2"
                disabled={hubConfirmBilling.isPending}
              >
                Confirm coordination
              </Button>
              {hubConfirmBilling.isError || hubRequestBilling.isError ? (
                <p className="md:col-span-2 text-sm text-destructive">
                  {(
                    (hubConfirmBilling.error ?? hubRequestBilling.error) as
                      | EdgeApiError
                      | undefined
                  )?.message ?? "Billing action failed"}
                </p>
              ) : null}
            </form>
            <SubscriptionLinkList subs={subs} />
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "provisioning" ? (
        <EdgePermissionGate permission="platform:subscriptions:manage_integrations">
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provisioning must complete before activation when{" "}
              <code className="text-xs">provisioningRequired</code> is set.
              Tenant creation stays in the provisioning adapter, not here.
            </p>
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                hubRequestProvisioning.mutate();
              }}
            >
              <h2 className="md:col-span-2 text-sm font-medium">
                Request provisioning
              </h2>
              <input
                className={fieldControlClass}
                placeholder="Subscription ID"
                value={provisioningHub.subscriptionId}
                onChange={(e) =>
                  setProvisioningHub((s) => ({
                    ...s,
                    subscriptionId: e.target.value,
                  }))
                }
                required
              />
              <Button type="submit" disabled={hubRequestProvisioning.isPending}>
                Request provisioning
              </Button>
            </form>
            <form
              className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                hubCompleteProvisioning.mutate();
              }}
            >
              <h2 className="md:col-span-3 text-sm font-medium">
                Complete provisioning
              </h2>
              <input
                className={fieldControlClass}
                placeholder="Subscription ID"
                value={provisioningHub.subscriptionId}
                onChange={(e) =>
                  setProvisioningHub((s) => ({
                    ...s,
                    subscriptionId: e.target.value,
                  }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Request ID"
                value={provisioningHub.reqId}
                onChange={(e) =>
                  setProvisioningHub((s) => ({ ...s, reqId: e.target.value }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Tenant ref (optional)"
                value={provisioningHub.tenantRef}
                onChange={(e) =>
                  setProvisioningHub((s) => ({
                    ...s,
                    tenantRef: e.target.value,
                  }))
                }
              />
              <Button
                type="submit"
                className="md:col-span-3"
                disabled={hubCompleteProvisioning.isPending}
              >
                Complete provisioning
              </Button>
              {hubCompleteProvisioning.isError ||
              hubRequestProvisioning.isError ? (
                <p className="md:col-span-3 text-sm text-destructive">
                  {(
                    (hubCompleteProvisioning.error ??
                      hubRequestProvisioning.error) as EdgeApiError | undefined
                  )?.message ?? "Provisioning action failed"}
                </p>
              ) : null}
            </form>
            <SubscriptionLinkList subs={subs} />
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "policies" ? (
        <EdgePermissionGate permission="platform:subscriptions:manage_policies">
          <section className="space-y-4">
            {policiesQuery.isLoading ? (
              <EdgeLoadingState label="Loading policies…" />
            ) : policiesQuery.isSuccess ? (
              (() => {
                const policies = Array.isArray(policiesQuery.data)
                  ? (policiesQuery.data as Record<string, unknown>[])
                  : (
                      (policiesQuery.data as { items?: Record<string, unknown>[] })
                        ?.items ?? []
                    );
                return policies.length ? (
                  <EntityList items={policies} labelKey="code" />
                ) : (
                  <EdgeEmptyState title="No policies configured" />
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground">
                {String(
                  (overviewQuery.data as { note?: string } | undefined)?.note ??
                    "Activation policies are configured server-side and enforced on activate. Gates on each subscription workspace reflect live policy evaluation.",
                )}
              </p>
            )}
          </section>
        </EdgePermissionGate>
      ) : null}

      {tab === "analytics" ? (
        <EdgePermissionGate permission="platform:subscriptions:read_analytics">
          {analyticsQuery.isLoading ? (
            <EdgeLoadingState label="Loading analytics…" />
          ) : analyticsQuery.isError ? (
            <EdgeErrorState
              error={analyticsQuery.error}
              onRetry={() => void analyticsQuery.refetch()}
            />
          ) : (
            <HonestAnalytics analytics={analytics} overview={overview} />
          )}
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

function SubscriptionPicker({
  subs,
  value,
  onChange,
}: {
  subs: Record<string, unknown>[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      className={fieldControlClass + " max-w-md"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select subscription</option>
      {subs.map((s) => (
        <option key={String(s.id)} value={String(s.id)}>
          {String(s.subscriptionNumber ?? s.id)} · {String(s.status)}
        </option>
      ))}
    </select>
  );
}

function SubscriptionLinkList({ subs }: { subs: Record<string, unknown>[] }) {
  if (!subs.length) return <EdgeEmptyState title="No subscriptions" />;
  return (
    <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
      {subs.map((s) => (
        <li key={String(s.id)} className="p-4">
          <Link
            href={`/edge/subscriptions/${String(s.id)}`}
            className="text-sm font-medium hover:underline"
          >
            Open workspace · {String(s.subscriptionNumber ?? s.id)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EntityList({
  items,
  labelKey,
}: {
  items: Record<string, unknown>[];
  labelKey: string;
}) {
  return (
    <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
      {items.map((item) => (
        <li key={String(item.id)} className="flex gap-3 p-4 text-sm">
          <span className="font-medium">{String(item[labelKey] ?? item.id)}</span>
          {item.status ? (
            <Badge tone="default">{String(item.status)}</Badge>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function HonestAnalytics({
  analytics,
  overview,
}: {
  analytics?: { label?: string; disclaimer?: string; recognizedRevenue?: unknown };
  overview?: Record<string, unknown>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Subscriptions"
          value={Number(overview?.total ?? overview?.subscriptionsTotal ?? 0)}
        />
        <MetricCard
          label="Trials"
          value={Number(overview?.trials ?? overview?.trialCount ?? 0)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {analytics?.disclaimer ??
          "Contractual counts only — not recognized revenue."}{" "}
        {analytics?.label ? (
          <Badge tone="default">{analytics.label}</Badge>
        ) : null}
        {analytics?.recognizedRevenue === null ? (
          <span className="ml-1">Recognized revenue: not reported (P6).</span>
        ) : null}
      </p>
    </div>
  );
}
