"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type Section =
  | "general"
  | "items"
  | "entitlements"
  | "integrations"
  | "changes"
  | "timeline";

function asRecordList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const items = (data as { items?: Record<string, unknown>[] } | undefined)?.items;
  return items ?? [];
}

export default function SubscriptionWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const [section, setSection] = useState<Section>("general");
  const [cancelReason, setCancelReason] = useState("");
  const [terminateReason, setTerminateReason] = useState("");
  const [coordinationId, setCoordinationId] = useState("");
  const [billingAccountRef, setBillingAccountRef] = useState("");
  const [provisioningReqId, setProvisioningReqId] = useState("");
  const [tenantRef, setTenantRef] = useState("");
  const [changeForm, setChangeForm] = useState({
    changeType: "PLAN_CHANGE",
    billingFrequency: "",
    reason: "",
  });

  const workspaceQuery = useQuery({
    queryKey: ["edge", "subscriptions", "workspace", id],
    queryFn: () => edgeApi.getSubscriptionWorkspace(id),
    enabled: Boolean(id),
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "subscriptions", "history", id],
    queryFn: () => edgeApi.getSubscriptionHistory(id),
    enabled: Boolean(id) && section === "timeline",
  });

  const entitlementsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "entitlements", id],
    queryFn: () => edgeApi.listSubscriptionEntitlements(id),
    enabled: Boolean(id) && section === "entitlements",
  });

  const changesQuery = useQuery({
    queryKey: ["edge", "subscriptions", "changes", id],
    queryFn: () => edgeApi.listSubscriptionChanges(id),
    enabled: Boolean(id) && section === "changes",
  });

  const billingCoordQuery = useQuery({
    queryKey: ["edge", "subscriptions", "billing-coordination", id],
    queryFn: () => edgeApi.listSubscriptionBillingCoordination(id),
    enabled: Boolean(id) && section === "integrations",
    retry: false,
  });

  const provisioningListQuery = useQuery({
    queryKey: ["edge", "subscriptions", "provisioning-list", id],
    queryFn: () => edgeApi.listSubscriptionProvisioning(id),
    enabled: Boolean(id) && section === "integrations",
    retry: false,
  });

  const suspensionsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "suspensions", id],
    queryFn: () => edgeApi.listSubscriptionSuspensions(id),
    enabled: Boolean(id) && section === "general",
    retry: false,
  });

  const cancellationsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "cancellations", id],
    queryFn: () => edgeApi.listSubscriptionCancellations(id),
    enabled: Boolean(id) && section === "general",
    retry: false,
  });

  const invalidateWorkspace = () =>
    void queryClient.invalidateQueries({
      queryKey: ["edge", "subscriptions", "workspace", id],
    });

  const submitMutation = useMutation({
    mutationFn: () => edgeApi.submitSubscription(id),
    onSuccess: invalidateWorkspace,
  });

  const approveMutation = useMutation({
    mutationFn: () => edgeApi.approveSubscription(id),
    onSuccess: invalidateWorkspace,
  });

  const activateMutation = useMutation({
    mutationFn: () => edgeApi.activateSubscription(id),
    onSuccess: invalidateWorkspace,
  });

  const requestActivationMutation = useMutation({
    mutationFn: () => edgeApi.requestSubscriptionActivation(id),
    onSuccess: invalidateWorkspace,
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) =>
      edgeApi.suspendSubscription(id, { reason }),
    onSuccess: invalidateWorkspace,
  });

  const reactivateMutation = useMutation({
    mutationFn: () => edgeApi.reactivateSubscription(id),
    onSuccess: invalidateWorkspace,
  });

  const cancelMutation = useMutation({
    mutationFn: () => edgeApi.cancelSubscription(id, { reason: cancelReason }),
    onSuccess: invalidateWorkspace,
  });

  const terminateMutation = useMutation({
    mutationFn: () =>
      edgeApi.terminateSubscription(id, {
        reason: terminateReason || undefined,
      }),
    onSuccess: invalidateWorkspace,
  });

  const publishEntitlements = useMutation({
    mutationFn: () => edgeApi.publishSubscriptionEntitlements(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions", "entitlements", id],
      });
      invalidateWorkspace();
    },
  });

  const calculateEntitlements = useMutation({
    mutationFn: () => edgeApi.calculateSubscriptionEntitlements(id),
    onSuccess: () => void entitlementsQuery.refetch(),
  });

  const reconcileEntitlements = useMutation({
    mutationFn: () => edgeApi.reconcileSubscriptionEntitlements(id),
    onSuccess: () => void entitlementsQuery.refetch(),
  });

  const requestBillingMutation = useMutation({
    mutationFn: () =>
      edgeApi.requestSubscriptionBillingCoordination(id, {
        billingAccountRef: billingAccountRef || undefined,
      }),
    onSuccess: () => {
      void billingCoordQuery.refetch();
      invalidateWorkspace();
    },
  });

  const confirmBillingMutation = useMutation({
    mutationFn: () =>
      edgeApi.confirmSubscriptionBillingCoordination(id, coordinationId),
    onSuccess: () => {
      void billingCoordQuery.refetch();
      invalidateWorkspace();
    },
  });

  const requestProvisioningMutation = useMutation({
    mutationFn: () => edgeApi.requestSubscriptionProvisioning(id),
    onSuccess: () => {
      void provisioningListQuery.refetch();
      invalidateWorkspace();
    },
  });

  const completeProvisioningMutation = useMutation({
    mutationFn: () =>
      edgeApi.completeSubscriptionProvisioning(id, provisioningReqId, {
        tenantRef: tenantRef || undefined,
      }),
    onSuccess: () => {
      void provisioningListQuery.refetch();
      invalidateWorkspace();
    },
  });

  const createChangeMutation = useMutation({
    mutationFn: () => {
      const proposedConfig: Record<string, unknown> = {};
      if (changeForm.billingFrequency.trim()) {
        proposedConfig.billingFrequency = changeForm.billingFrequency.trim();
      }
      return edgeApi.createSubscriptionChange(id, {
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

  const approveChangeMutation = useMutation({
    mutationFn: (changeId: string) =>
      edgeApi.approveSubscriptionChange(id, changeId),
    onSuccess: () => void changesQuery.refetch(),
  });

  const executeChangeMutation = useMutation({
    mutationFn: (changeId: string) =>
      edgeApi.executeSubscriptionChange(id, changeId),
    onSuccess: () => {
      void changesQuery.refetch();
      invalidateWorkspace();
    },
  });

  const createRenewalMutation = useMutation({
    mutationFn: () => edgeApi.createSubscriptionRenewal(id),
    onSuccess: invalidateWorkspace,
  });

  const canUpdate = hasEdgePermission(
    permissions,
    "platform:subscriptions:update",
  );
  const canApprove = hasEdgePermission(
    permissions,
    "platform:subscriptions:approve",
  );
  const canActivate = hasEdgePermission(
    permissions,
    "platform:subscriptions:activate",
  );
  const canSuspend = hasEdgePermission(
    permissions,
    "platform:subscriptions:suspend",
  );
  const canReactivate = hasEdgePermission(
    permissions,
    "platform:subscriptions:reactivate",
  );
  const canCancel = hasEdgePermission(
    permissions,
    "platform:subscriptions:cancel",
  );
  const canTerminate = hasEdgePermission(
    permissions,
    "platform:subscriptions:terminate",
  );
  const canIntegrations = hasEdgePermission(
    permissions,
    "platform:subscriptions:manage_integrations",
  );
  const canChangePlan = hasEdgePermission(
    permissions,
    "platform:subscriptions:change_plan",
  );
  const canRenew = hasEdgePermission(permissions, "platform:subscriptions:renew");
  const canReconcile = hasEdgePermission(
    permissions,
    "platform:subscriptions:reconcile_entitlements",
  );

  const gates = useMemo(() => {
    const sub = (workspaceQuery.data as { subscription?: Record<string, unknown> })
      ?.subscription;
    if (!sub) return null;
    return {
      commercialValidated: Boolean(sub.commercialValidated),
      provisioningRequired: Boolean(sub.provisioningRequired),
      provisioningConfirmed: Boolean(sub.provisioningConfirmed),
      billingRequired: Boolean(sub.billingRequired),
      billingConfirmed: Boolean(sub.billingConfirmed),
    };
  }, [workspaceQuery.data]);

  const activationBlocked = useMemo(() => {
    if (!gates) return true;
    if (!gates.commercialValidated) return true;
    if (gates.provisioningRequired && !gates.provisioningConfirmed) return true;
    if (gates.billingRequired && !gates.billingConfirmed) return true;
    return false;
  }, [gates]);

  if (workspaceQuery.isLoading) {
    return <EdgeLoadingState label="Loading subscription workspace…" />;
  }
  if (workspaceQuery.isError) {
    return (
      <EdgeErrorState
        error={workspaceQuery.error}
        onRetry={() => void workspaceQuery.refetch()}
      />
    );
  }

  const data = workspaceQuery.data as {
    subscription?: Record<string, unknown>;
    items?: Record<string, unknown>[];
    latestEntitlements?: Record<string, unknown> | null;
    timeline?: Record<string, unknown>[];
    statusHistory?: Record<string, unknown>[];
  };

  const sub = data.subscription ?? {};
  const status = String(sub.status ?? "");

  const billingCoordRows = billingCoordQuery.isSuccess
    ? asRecordList(billingCoordQuery.data)
    : [];
  const provisioningRows = provisioningListQuery.isSuccess
    ? asRecordList(provisioningListQuery.data)
    : [];
  const suspensionRows = suspensionsQuery.isSuccess
    ? asRecordList(suspensionsQuery.data)
    : [];
  const cancellationRows = cancellationsQuery.isSuccess
    ? asRecordList(cancellationsQuery.data)
    : [];

  const changeRows = asRecordList(changesQuery.data);

  return (
    <EdgePermissionGate permission="platform:subscriptions:read">
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/edge/subscriptions"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Subscriptions console
          </Link>
          <h1 className="font-display text-3xl tracking-tight">
            {String(sub.subscriptionNumber ?? "Subscription")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status} · {String(sub.currency ?? "—")} · Account{" "}
            {String(sub.accountId)}
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <GateCard
            label="Commercial validated"
            ok={gates?.commercialValidated ?? false}
          />
          <GateCard
            label="Provisioning confirmed"
            ok={
              gates?.provisioningRequired
                ? Boolean(gates.provisioningConfirmed)
                : true
            }
            pending={Boolean(gates?.provisioningRequired)}
          />
          <GateCard
            label="Billing confirmed"
            ok={
              gates?.billingRequired ? Boolean(gates.billingConfirmed) : true
            }
            pending={Boolean(gates?.billingRequired)}
          />
        </section>

        {activationBlocked ? (
          <p className="rounded-xl border border-border/70 bg-[var(--surface-muted)]/40 p-4 text-sm text-muted-foreground">
            Activation is blocked until all required gates pass. Confirm
            provisioning and billing coordination from integrated systems (P6/P7)
            — this UI does not process payments or create tenants directly.
          </p>
        ) : null}

        <section className="space-y-3 rounded-xl border border-border/70 p-4">
          <h2 className="text-sm font-medium">Lifecycle actions</h2>
          <div className="flex flex-wrap gap-2">
            {canUpdate && status === "DRAFT" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                Submit for approval
              </Button>
            ) : null}
            {canApprove && status === "PENDING_APPROVAL" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate()}
              >
                Approve subscription
              </Button>
            ) : null}
            {canActivate ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={requestActivationMutation.isPending}
                  onClick={() => requestActivationMutation.mutate()}
                >
                  Request activation
                </Button>
                <Button
                  size="sm"
                  disabled={activateMutation.isPending || activationBlocked}
                  onClick={() => activateMutation.mutate()}
                >
                  Activate
                </Button>
              </>
            ) : null}
            {canRenew ? (
              <Button
                size="sm"
                variant="outline"
                disabled={createRenewalMutation.isPending}
                onClick={() => createRenewalMutation.mutate()}
              >
                Propose renewal
              </Button>
            ) : null}
            {canReactivate && status === "SUSPENDED" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={reactivateMutation.isPending}
                onClick={() => reactivateMutation.mutate()}
              >
                Reactivate
              </Button>
            ) : null}
            {canSuspend ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={suspendMutation.isPending}
                onClick={() => {
                  const reason = window.prompt("Suspension reason (required)");
                  if (reason?.trim()) suspendMutation.mutate(reason.trim());
                }}
              >
                Suspend
              </Button>
            ) : null}
            {canCancel ? (
              <CancelRow
                reason={cancelReason}
                onReason={setCancelReason}
                pending={cancelMutation.isPending}
                onCancel={() => cancelMutation.mutate()}
                error={cancelMutation.isError ? cancelMutation.error : null}
              />
            ) : null}
            {canTerminate ? (
              <TerminateRow
                reason={terminateReason}
                onReason={setTerminateReason}
                pending={terminateMutation.isPending}
                onTerminate={() => terminateMutation.mutate()}
                error={terminateMutation.isError ? terminateMutation.error : null}
              />
            ) : null}
          </div>
          <MutationErrors
            errors={[
              submitMutation,
              approveMutation,
              activateMutation,
              createRenewalMutation,
              reactivateMutation,
            ]}
          />
        </section>

        <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
          {(
            [
              ["general", "General"],
              ["items", "Items"],
              ["entitlements", "Entitlements"],
              ["integrations", "Billing & provisioning"],
              ["changes", "Changes"],
              ["timeline", "Timeline"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={section === key ? "default" : "ghost"}
              onClick={() => setSection(key)}
            >
              {label}
            </Button>
          ))}
        </nav>

        {section === "general" ? (
          <div className="space-y-4">
            <dl className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm sm:grid-cols-2">
              <Field label="Product" value={String(sub.productId)} />
              <Field label="Plan" value={String(sub.planId ?? "—")} />
              <Field label="Package" value={String(sub.packageId ?? "—")} />
              <Field
                label="Billing frequency"
                value={String(sub.billingFrequency ?? "—")}
              />
              <Field label="Handoff" value={String(sub.handoffId ?? "—")} />
              <Field label="Contract" value={String(sub.contractId ?? "—")} />
              <Field
                label="Correlation"
                value={String(sub.correlationId ?? "—")}
              />
            </dl>
            {suspensionsQuery.isSuccess ? (
              <RecordSection title="Suspensions" rows={suspensionRows} />
            ) : null}
            {cancellationsQuery.isSuccess ? (
              <RecordSection title="Cancellations" rows={cancellationRows} />
            ) : null}
          </div>
        ) : null}

        {section === "items" ? (
          !(data.items ?? []).length ? (
            <EdgeEmptyState title="No subscription items" />
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
              {(data.items ?? []).map((item) => (
                <li key={String(item.id)} className="p-4 text-sm">
                  <span className="font-medium">{String(item.itemType)}</span>
                  <span className="ml-2 text-muted-foreground">
                    {String(item.offerRef ?? "—")} · qty{" "}
                    {String(item.quantity ?? 1)}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {section === "entitlements" ? (
          <EdgePermissionGate permission="platform:subscriptions:read_entitlements">
            <div className="space-y-4">
              <EdgePermissionGate permission="platform:subscriptions:publish_entitlements">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={calculateEntitlements.isPending}
                    onClick={() => calculateEntitlements.mutate()}
                  >
                    Calculate snapshot
                  </Button>
                  <Button
                    size="sm"
                    disabled={publishEntitlements.isPending}
                    onClick={() => publishEntitlements.mutate()}
                  >
                    Publish entitlements
                  </Button>
                  {canReconcile ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={reconcileEntitlements.isPending}
                      onClick={() => reconcileEntitlements.mutate()}
                    >
                      Reconcile read models
                    </Button>
                  ) : null}
                </div>
              </EdgePermissionGate>
              {data.latestEntitlements ? (
                <p className="text-xs text-muted-foreground">
                  Latest workspace snapshot v
                  {String(data.latestEntitlements.version ?? "—")}
                </p>
              ) : null}
              {entitlementsQuery.isLoading ? (
                <EdgeLoadingState label="Loading entitlements…" />
              ) : !(entitlementsQuery.data as unknown[] | undefined)?.length ? (
                <EdgeEmptyState title="No entitlement snapshots" />
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                  {(
                    (entitlementsQuery.data as Record<string, unknown>[]) ?? []
                  ).map((snap) => (
                    <li key={String(snap.id)} className="p-4 text-sm">
                      v{String(snap.version)} · {String(snap.status ?? "—")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </EdgePermissionGate>
        ) : null}

        {section === "integrations" ? (
          <EdgePermissionGate permission="platform:subscriptions:manage_integrations">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Billing coordination</h2>
                {billingCoordQuery.isSuccess ? (
                  <RecordSection title="Requests" rows={billingCoordRows} />
                ) : null}
                {canIntegrations ? (
                  <form
                    className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      requestBillingMutation.mutate();
                    }}
                  >
                    <input
                      className={fieldControlClass}
                      placeholder="Billing account ref (optional)"
                      value={billingAccountRef}
                      onChange={(e) => setBillingAccountRef(e.target.value)}
                    />
                    <Button type="submit" disabled={requestBillingMutation.isPending}>
                      Request billing coordination
                    </Button>
                  </form>
                ) : null}
                {canIntegrations ? (
                  <form
                    className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-3"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      confirmBillingMutation.mutate();
                    }}
                  >
                    <input
                      className={fieldControlClass}
                      placeholder="Coordination ID"
                      value={coordinationId}
                      onChange={(e) => setCoordinationId(e.target.value)}
                      required
                    />
                    <Button
                      type="submit"
                      className="sm:col-span-2"
                      disabled={confirmBillingMutation.isPending}
                    >
                      Confirm billing coordination
                    </Button>
                  </form>
                ) : null}
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-medium">Provisioning</h2>
                {provisioningListQuery.isSuccess ? (
                  <RecordSection title="Requests" rows={provisioningRows} />
                ) : null}
                {canIntegrations ? (
                  <form
                    className="flex flex-wrap items-end gap-3 rounded-xl border border-border/70 p-4"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      requestProvisioningMutation.mutate();
                    }}
                  >
                    <Button type="submit" disabled={requestProvisioningMutation.isPending}>
                      Request provisioning
                    </Button>
                  </form>
                ) : null}
                {canIntegrations ? (
                  <form
                    className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-3"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      completeProvisioningMutation.mutate();
                    }}
                  >
                    <input
                      className={fieldControlClass}
                      placeholder="Provisioning request ID"
                      value={provisioningReqId}
                      onChange={(e) => setProvisioningReqId(e.target.value)}
                      required
                    />
                    <input
                      className={fieldControlClass}
                      placeholder="Tenant ref (optional)"
                      value={tenantRef}
                      onChange={(e) => setTenantRef(e.target.value)}
                    />
                    <Button type="submit" disabled={completeProvisioningMutation.isPending}>
                      Complete provisioning
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </EdgePermissionGate>
        ) : null}

        {section === "changes" ? (
          <EdgePermissionGate permission="platform:subscriptions:change_plan">
            <ul className="space-y-4">
              <form
                className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createChangeMutation.mutate();
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
                <Button type="submit" disabled={createChangeMutation.isPending}>
                  Create change request
                </Button>
                {createChangeMutation.isError ? (
                  <p className="sm:col-span-2 text-sm text-destructive">
                    {(createChangeMutation.error as EdgeApiError)?.message ??
                      "Create change failed"}
                  </p>
                ) : null}
              </form>
              {changesQuery.isLoading ? (
                <EdgeLoadingState label="Loading change requests…" />
              ) : !changeRows.length ? (
                <EdgeEmptyState title="No change requests" />
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                  {changeRows.map((ch) => {
                    const changeId = String(ch.id);
                    const chStatus = String(ch.status ?? "");
                    return (
                      <li
                        key={changeId}
                        className="flex flex-wrap items-center gap-2 p-4 text-sm"
                      >
                        <span className="font-medium">
                          {String(ch.changeType ?? changeId)}
                        </span>
                        {ch.status ? (
                          <Badge tone="default">{chStatus}</Badge>
                        ) : null}
                        {canApprove &&
                        (chStatus === "PENDING_APPROVAL" ||
                          chStatus === "DRAFT") ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approveChangeMutation.isPending}
                            onClick={() => approveChangeMutation.mutate(changeId)}
                          >
                            Approve change
                          </Button>
                        ) : null}
                        {canChangePlan &&
                        (chStatus === "APPROVED" || chStatus === "PENDING_EXECUTION") ? (
                          <Button
                            size="sm"
                            disabled={executeChangeMutation.isPending}
                            onClick={() => executeChangeMutation.mutate(changeId)}
                          >
                            Execute change
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </ul>
          </EdgePermissionGate>
        ) : null}

        {section === "timeline" ? (
          historyQuery.isLoading ? (
            <EdgeLoadingState label="Loading timeline…" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(
                (historyQuery.data as { timeline?: Record<string, unknown>[] })
                  ?.timeline ??
                data.timeline ??
                []
              ).map((ev, idx) => (
                <li
                  key={String(ev.id ?? idx)}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <span className="font-medium">
                    {String(ev.eventType ?? ev.type ?? "Event")}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {String(ev.createdAt ?? "")}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </EdgePermissionGate>
  );
}

function GateCard({
  label,
  ok,
  pending,
}: {
  label: string;
  ok: boolean;
  pending?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-xl">
        {ok ? "Yes" : pending ? "Required" : "No"}
      </p>
      <Badge tone={ok ? "default" : "danger"} className="mt-2">
        {ok ? "Pass" : "Blocked"}
      </Badge>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}

function RecordSection({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, unknown>[];
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-border/70 p-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">None recorded.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-3 divide-y divide-border/60">
        {rows.map((row, idx) => (
          <li key={String(row.id ?? idx)} className="py-2 text-sm">
            <span className="font-mono text-xs">
              {String(row.id ?? idx)}
            </span>
            {row.status ? (
              <Badge tone="default" className="ml-2">
                {String(row.status)}
              </Badge>
            ) : null}
            {row.reason ? (
              <span className="ml-2 text-muted-foreground">
                {String(row.reason)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CancelRow({
  reason,
  onReason,
  pending,
  onCancel,
  error,
}: {
  reason: string;
  onReason: (v: string) => void;
  pending: boolean;
  onCancel: () => void;
  error: unknown;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={fieldControlClass + " max-w-xs"}
        placeholder="Cancel reason"
        value={reason}
        onChange={(e) => onReason(e.target.value)}
      />
      <Button
        size="sm"
        variant="ghost"
        disabled={pending || !reason.trim()}
        onClick={onCancel}
      >
        Cancel subscription
      </Button>
      {error ? (
        <p className="w-full text-sm text-destructive">
          {(error as EdgeApiError)?.message ?? "Cancel failed"}
        </p>
      ) : null}
    </div>
  );
}

function TerminateRow({
  reason,
  onReason,
  pending,
  onTerminate,
  error,
}: {
  reason: string;
  onReason: (v: string) => void;
  pending: boolean;
  onTerminate: () => void;
  error: unknown;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={fieldControlClass + " max-w-xs"}
        placeholder="Terminate reason (optional)"
        value={reason}
        onChange={(e) => onReason(e.target.value)}
      />
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={onTerminate}
      >
        Terminate
      </Button>
      {error ? (
        <p className="w-full text-sm text-destructive">
          {(error as EdgeApiError)?.message ?? "Terminate failed"}
        </p>
      ) : null}
    </div>
  );
}

function MutationErrors({
  errors,
}: {
  errors: { isError: boolean; error: unknown }[];
}) {
  const first = errors.find((m) => m.isError);
  if (!first) return null;
  return (
    <p className="text-sm text-destructive">
      {(first.error as EdgeApiError)?.message ?? "Action failed"}
    </p>
  );
}
