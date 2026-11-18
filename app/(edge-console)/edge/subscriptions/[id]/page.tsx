"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { ListOrUuidField } from "@/components/edge/list-or-uuid-field";
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
  | "association"
  | "integrations"
  | "changes"
  | "timeline";

function asRecordList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== "object") return [];
  const obj = data as { data?: unknown; items?: unknown };
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
  if (obj.data && typeof obj.data === "object") {
    const inner = obj.data as { items?: unknown };
    if (Array.isArray(inner.items)) return inner.items as Record<string, unknown>[];
  }
  return [];
}

export default function SubscriptionWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useEdgePlatform();
  const [section, setSection] = useState<Section>("general");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  const [resumeConfirmOpen, setResumeConfirmOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState("");
  const [coordinationId, setCoordinationId] = useState("");
  const [billingAccountRef, setBillingAccountRef] = useState("");
  const [provisioningReqId, setProvisioningReqId] = useState("");
  const [completeTenantRef, setCompleteTenantRef] = useState("");
  const [bindTenantRef, setBindTenantRef] = useState("");
  const [executeChangeConfirmId, setExecuteChangeConfirmId] = useState<
    string | null
  >(null);
  const [scheduleAtByChange, setScheduleAtByChange] = useState<
    Record<string, string>
  >({});
  const [lastReconcile, setLastReconcile] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [lastChangeExec, setLastChangeExec] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [changeForm, setChangeForm] = useState({
    changeType: "PLAN_CHANGE",
    planCode: "SYNTIX_PROFESSIONAL",
    offerRef: "",
    billingFrequency: "",
    reason: "",
  });

  const workspaceQuery = useQuery({
    queryKey: ["edge", "subscriptions", "workspace", id],
    queryFn: async () => {
      const { data } = await edgeApi.getSubscriptionWorkspace(id);
      return data;
    },
    enabled: Boolean(id),
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "subscriptions", "history", id],
    queryFn: async () => {
      const { data } = await edgeApi.getSubscriptionHistory(id);
      return data;
    },
    enabled: Boolean(id) && section === "timeline",
  });

  const entitlementsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "entitlements", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionEntitlements(id);
      return data;
    },
    enabled: Boolean(id) && section === "entitlements",
  });

  const changesQuery = useQuery({
    queryKey: ["edge", "subscriptions", "changes", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionChanges(id);
      return data;
    },
    enabled: Boolean(id) && section === "changes",
  });

  const billingCoordQuery = useQuery({
    queryKey: ["edge", "subscriptions", "billing-coordination", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionBillingCoordination(id);
      return data;
    },
    enabled: Boolean(id) && section === "integrations",
    retry: false,
  });

  const provisioningListQuery = useQuery({
    queryKey: ["edge", "subscriptions", "provisioning-list", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionProvisioning(id);
      return data;
    },
    enabled: Boolean(id),
    retry: false,
  });

  const provisioningJobsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "provisioning-jobs", id],
    queryFn: async () => {
      const { data } = await edgeApi.listProvisioningJobsBySubscription(id);
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(id) && section === "integrations",
    retry: false,
  });

  const suspensionsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "suspensions", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionSuspensions(id);
      return data;
    },
    enabled: Boolean(id) && section === "general",
    retry: false,
  });

  const cancellationsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "cancellations", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionCancellations(id);
      return data;
    },
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

  const pauseMutation = useMutation({
    mutationFn: (reason: string) =>
      edgeApi.suspendSubscription(id, { reason }),
    onSuccess: () => {
      setPauseConfirmOpen(false);
      setPauseReason("");
      invalidateWorkspace();
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => edgeApi.reactivateSubscription(id),
    onSuccess: () => {
      setResumeConfirmOpen(false);
      invalidateWorkspace();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => edgeApi.cancelSubscription(id, { reason: cancelReason }),
    onSuccess: () => {
      setCancelConfirmOpen(false);
      setCancelReason("");
      invalidateWorkspace();
    },
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

  const tenantsQuery = useQuery({
    queryKey: ["edge", "tenants", "pick-for-association"],
    queryFn: async () => {
      const { data } = await edgeApi.listTenants({ limit: 100 });
      return data;
    },
    enabled: Boolean(id) && (section === "association" || section === "integrations"),
    retry: false,
  });

  const associationsQuery = useQuery({
    queryKey: ["edge", "subscriptions", "associations", id],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptionTenantAssociations(id);
      return data ?? [];
    },
    enabled: Boolean(id) && section === "association",
    retry: false,
  });

  const reconcileEntitlements = useMutation({
    mutationFn: async (remediateBb?: boolean) => {
      const { data } = await edgeApi.reconcileSubscriptionEntitlements(id, {
        remediateBb,
      });
      return data;
    },
    onSuccess: (data) => {
      setLastReconcile((data as Record<string, unknown>) ?? null);
      void entitlementsQuery.refetch();
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions", "associations", id],
      });
      invalidateWorkspace();
    },
  });

  const bindAssociationMutation = useMutation({
    mutationFn: async () => {
      const { data } = await edgeApi.bindSubscriptionTenantAssociation(id, {
        productTenantRef: bindTenantRef.trim(),
        supersedeExisting: true,
      });
      return data;
    },
    onSuccess: () => {
      setBindTenantRef("");
      void associationsQuery.refetch();
      invalidateWorkspace();
    },
  });

  const closeAssociationMutation = useMutation({
    mutationFn: async (associationId?: string) => {
      const { data } = await edgeApi.closeSubscriptionTenantAssociation(id, {
        associationId,
        reason: "operator_close",
      });
      return data;
    },
    onSuccess: () => {
      void associationsQuery.refetch();
      invalidateWorkspace();
    },
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
        tenantRef: completeTenantRef || undefined,
      }),
    onSuccess: () => {
      void provisioningListQuery.refetch();
      invalidateWorkspace();
    },
  });

  const processProvisioningJobsMutation = useMutation({
    mutationFn: () => edgeApi.processProvisioningJobs({ limit: 10 }),
    onSuccess: () => {
      void provisioningJobsQuery.refetch();
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
      if (
        changeForm.changeType === "PLAN_CHANGE" &&
        changeForm.planCode.trim()
      ) {
        proposedConfig.planCode = changeForm.planCode.trim();
        proposedConfig.offerRef = changeForm.planCode.trim();
      }
      if (
        (changeForm.changeType === "ADDON_ADD" ||
          changeForm.changeType === "ADDON_REMOVE") &&
        changeForm.offerRef.trim()
      ) {
        proposedConfig.offerRef = changeForm.offerRef.trim();
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
      setChangeForm((s) => ({
        ...s,
        reason: "",
        billingFrequency: "",
        offerRef: "",
      }));
      void changesQuery.refetch();
    },
  });

  const approveChangeMutation = useMutation({
    mutationFn: (changeId: string) =>
      edgeApi.approveSubscriptionChange(id, changeId),
    onSuccess: () => void changesQuery.refetch(),
  });

  const rejectChangeMutation = useMutation({
    mutationFn: (changeId: string) =>
      edgeApi.rejectSubscriptionChange(id, changeId),
    onSuccess: () => void changesQuery.refetch(),
  });

  const scheduleChangeMutation = useMutation({
    mutationFn: ({
      changeId,
      executeAt,
    }: {
      changeId: string;
      executeAt: string;
    }) => edgeApi.scheduleSubscriptionChange(id, changeId, { executeAt }),
    onSuccess: () => void changesQuery.refetch(),
  });

  const executeChangeMutation = useMutation({
    mutationFn: async (changeId: string) => {
      const { data } = await edgeApi.executeSubscriptionChange(id, changeId);
      return data;
    },
    onSuccess: (data) => {
      setExecuteChangeConfirmId(null);
      setLastChangeExec((data as Record<string, unknown>) ?? null);
      void changesQuery.refetch();
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions", "associations", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["edge", "subscriptions", "entitlements", id],
      });
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
  const canReadAssociations = hasEdgePermission(
    permissions,
    "platform:subscriptions:read_associations",
  );
  const canManageAssociations = hasEdgePermission(
    permissions,
    "platform:subscriptions:manage_associations",
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

  const data = (workspaceQuery.data ?? {}) as {
    subscription?: Record<string, unknown>;
    items?: Record<string, unknown>[];
    latestEntitlements?: Record<string, unknown> | null;
    timeline?: Record<string, unknown>[];
    statusHistory?: Record<string, unknown>[];
    associations?: Record<string, unknown>[];
    activeAssociation?: Record<string, unknown> | null;
  };

  const sub = data.subscription ?? {};
  const status = String(sub.status ?? "");
  const meta =
    sub.metadata && typeof sub.metadata === "object"
      ? (sub.metadata as Record<string, unknown>)
      : {};

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

  const provisioningIdOptions = provisioningRows
    .map((row) => String(row.id ?? "").trim())
    .filter((id) => id.length >= 8)
    .map((id) => {
      const row = provisioningRows.find((r) => String(r.id) === id);
      return {
        id,
        label: `${id.slice(0, 8)}… · ${String(row?.status ?? row?.outcome ?? "request")}`,
      };
    });

  const billingCoordinationIdOptions = billingCoordRows
    .map((row) => String(row.id ?? "").trim())
    .filter((id) => id.length >= 8)
    .map((id) => {
      const row = billingCoordRows.find((r) => String(r.id) === id);
      return {
        id,
        label: `${id.slice(0, 8)}… · ${String(row?.status ?? "coordination")}`,
      };
    });

  const tenantPage = tenantsQuery.data as
    | { items?: Array<Record<string, unknown>> }
    | Array<Record<string, unknown>>
    | undefined;
  const tenantItems = Array.isArray(tenantPage)
    ? tenantPage
    : (tenantPage?.items ?? []);
  const tenantPickOptions = tenantItems
    .map((t) => {
      const productTenantId = String(t.productTenantId ?? "").trim();
      const edgeId = String(t.id ?? "").trim();
      const ref = productTenantId || (edgeId ? `edge:${edgeId}` : "");
      if (!ref) return null;
      const label = `${String(t.displayName ?? t.tenantCode ?? ref).slice(0, 40)} · ${ref.slice(0, 8)}…`;
      return { id: ref, label };
    })
    .filter((o): o is { id: string; label: string } => Boolean(o));

  const completedProvisioning = provisioningRows.find(
    (row) =>
      String(row.outcome ?? row.status ?? "").toUpperCase() === "COMPLETE" ||
      Boolean(row.completedAt),
  );
  const tenantRefRaw =
    sub.tenantRef ??
    meta.tenantRef ??
    meta.tenant_id ??
    completedProvisioning?.tenantRef;
  const linkedTenantRef =
    tenantRefRaw != null && String(tenantRefRaw).trim()
      ? String(tenantRefRaw).trim()
      : "";
  const provisioningRequestIdRaw =
    sub.provisioningRequestId ??
    meta.provisioningRequestId ??
    completedProvisioning?.id;
  const provisioningRequestId =
    provisioningRequestIdRaw != null && String(provisioningRequestIdRaw).trim()
      ? String(provisioningRequestIdRaw).trim()
      : "";

  const canPause =
    canSuspend &&
    (status === "ACTIVE" || status === "PAST_DUE" || status === "TRIALING");
  const canResume =
    canReactivate && (status === "SUSPENDED" || status === "PAST_DUE");

  return (
    <EdgePermissionGate permission="platform:subscriptions:read">
      <div className="space-y-[var(--space-6)]">
        <header className="space-y-[var(--space-2)]">
          <Link
            href="/edge/subscriptions"
            className="text-xs text-[var(--text-secondary)] hover:underline"
          >
            ← Subscriptions console
          </Link>
          <h1 className="font-display text-3xl tracking-tight">
            {String(sub.subscriptionNumber ?? "Subscription")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {status} · {String(sub.currency ?? "—")} · Account{" "}
            {String(sub.accountId)}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {linkedTenantRef ? (
              <Link
                href={`/edge/tenants/${encodeURIComponent(linkedTenantRef)}`}
                className="text-[var(--primary)] underline-offset-2 hover:underline"
              >
                Open tenant →
              </Link>
            ) : null}
            {provisioningRequestId ? (
              <Link
                href={`/edge/provisioning-requests/${encodeURIComponent(provisioningRequestId)}`}
                className="text-[var(--primary)] underline-offset-2 hover:underline"
              >
                Provisioning request →
              </Link>
            ) : null}
            <Link
              href="/edge/billing"
              className="text-[var(--primary)] underline-offset-2 hover:underline"
            >
              Billing console →
            </Link>
          </p>
        </header>

        <section className="grid gap-[var(--space-3)] sm:grid-cols-3">
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
          <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/40 p-[var(--space-4)] text-sm text-[var(--text-secondary)]">
            Activation is blocked until all required gates pass. Confirm
            provisioning and billing coordination from integrated systems (P6/P7)
            — this UI does not process payments or create tenants directly.
          </p>
        ) : null}

        <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
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
            {canResume && !resumeConfirmOpen ? (
              <Button
                size="sm"
                variant="outline"
                disabled={resumeMutation.isPending}
                onClick={() => setResumeConfirmOpen(true)}
              >
                {status === "PAST_DUE" ? "Resume (exit grace)" : "Resume"}
              </Button>
            ) : null}
            {canPause && !pauseConfirmOpen ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={pauseMutation.isPending}
                onClick={() => setPauseConfirmOpen(true)}
              >
                Pause
              </Button>
            ) : null}
            {canCancel && !cancelConfirmOpen ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={cancelMutation.isPending}
                onClick={() => setCancelConfirmOpen(true)}
              >
                Cancel subscription…
              </Button>
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

          {pauseConfirmOpen ? (
            <ConfirmPanel
              title="Pause subscription"
              description="Suspends billing and access until resumed. Provide a required reason."
              onBack={() => {
                setPauseConfirmOpen(false);
                setPauseReason("");
                pauseMutation.reset();
              }}
            >
              <input
                className={fieldControlClass}
                placeholder="Pause reason (required)"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
              {pauseMutation.isError ? (
                <ActionError error={pauseMutation.error} fallback="Pause failed" />
              ) : null}
              <Button
                size="sm"
                disabled={pauseMutation.isPending || !pauseReason.trim()}
                onClick={() => pauseMutation.mutate(pauseReason.trim())}
              >
                Confirm pause
              </Button>
            </ConfirmPanel>
          ) : null}

          {resumeConfirmOpen ? (
            <ConfirmPanel
              title="Resume subscription"
              description="Reactivates a paused or grace-period subscription."
              onBack={() => {
                setResumeConfirmOpen(false);
                resumeMutation.reset();
              }}
            >
              {resumeMutation.isError ? (
                <ActionError
                  error={resumeMutation.error}
                  fallback="Resume failed"
                />
              ) : null}
              <Button
                size="sm"
                disabled={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate()}
              >
                Confirm resume
              </Button>
            </ConfirmPanel>
          ) : null}

          {cancelConfirmOpen ? (
            <ConfirmPanel
              title="Cancel subscription"
              description="Schedules cancellation per policy. This cannot be undone from this panel."
              onBack={() => {
                setCancelConfirmOpen(false);
                setCancelReason("");
                cancelMutation.reset();
              }}
            >
              <input
                className={fieldControlClass}
                placeholder="Cancel reason (required)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              {cancelMutation.isError ? (
                <ActionError
                  error={cancelMutation.error}
                  fallback="Cancel failed"
                />
              ) : null}
              <Button
                size="sm"
                variant="danger"
                disabled={cancelMutation.isPending || !cancelReason.trim()}
                onClick={() => cancelMutation.mutate()}
              >
                Confirm cancellation
              </Button>
            </ConfirmPanel>
          ) : null}

          <MutationErrors
            errors={[
              submitMutation,
              approveMutation,
              activateMutation,
              createRenewalMutation,
            ]}
          />
        </section>

        <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
          {(
            [
              ["general", "General"],
              ["items", "Items"],
              ["entitlements", "Entitlements"],
              ["association", "Tenant association"],
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

        {section === "association" ? (
          <EdgePermissionGate permission="platform:subscriptions:read_associations">
            <div className="space-y-4">
              {!canReadAssociations ? null : null}
              {data.activeAssociation ? (
                <dl className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm sm:grid-cols-2">
                  <Field
                    label="Status"
                    value={String(
                      (data.activeAssociation as Record<string, unknown>)
                        .associationStatus ?? "—",
                    )}
                  />
                  <Field
                    label="Type"
                    value={String(
                      (data.activeAssociation as Record<string, unknown>)
                        .associationType ?? "—",
                    )}
                  />
                  <Field
                    label="Product tenant ref"
                    value={String(
                      (data.activeAssociation as Record<string, unknown>)
                        .productTenantRef ?? "—",
                    )}
                  />
                  <Field
                    label="Environment slot"
                    value={String(
                      (data.activeAssociation as Record<string, unknown>)
                        .environmentSlot ?? "DEFAULT",
                    )}
                  />
                </dl>
              ) : (
                <EdgeEmptyState title="No ACTIVE association" />
              )}
              {canManageAssociations ? (
                <form
                  className="grid gap-3 rounded-xl border border-border/70 p-4 sm:grid-cols-[1fr_auto]"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    if (!bindTenantRef.trim()) return;
                    bindAssociationMutation.mutate();
                  }}
                >
                  <ListOrUuidField
                    value={bindTenantRef}
                    onChange={setBindTenantRef}
                    options={tenantPickOptions}
                    placeholder="Select product tenant"
                    fallbackPlaceholder="Product tenant UUID or edge:UUID"
                    required
                  />
                  <Button
                    size="sm"
                    type="submit"
                    disabled={
                      bindAssociationMutation.isPending || !bindTenantRef.trim()
                    }
                  >
                    Bind / supersede
                  </Button>
                </form>
              ) : null}
              {associationsQuery.isLoading ? (
                <EdgeLoadingState label="Loading associations…" />
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                  {asRecordList(associationsQuery.data).map((row) => (
                    <li
                      key={String(row.id)}
                      className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
                    >
                      <span>
                        <Badge variant="outline">
                          {String(row.associationStatus)}
                        </Badge>{" "}
                        {String(row.associationType)} ·{" "}
                        <span className="font-mono text-xs">
                          {String(row.productTenantRef)}
                        </span>
                      </span>
                      {canManageAssociations &&
                      row.associationStatus === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={closeAssociationMutation.isPending}
                          onClick={() =>
                            closeAssociationMutation.mutate(String(row.id))
                          }
                        >
                          Close
                        </Button>
                      ) : null}
                    </li>
                  ))}
                  {!asRecordList(associationsQuery.data).length ? (
                    <li className="p-4 text-sm text-muted-foreground">
                      No association history
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </EdgePermissionGate>
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
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={reconcileEntitlements.isPending}
                        onClick={() => reconcileEntitlements.mutate(false)}
                      >
                        Reconcile Edge + BB
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reconcileEntitlements.isPending}
                        onClick={() => reconcileEntitlements.mutate(true)}
                      >
                        Reconcile + remediate BB
                      </Button>
                    </>
                  ) : null}
                </div>
              </EdgePermissionGate>
              {lastReconcile ? (
                <div className="rounded-xl border border-border/70 p-3 text-xs text-muted-foreground">
                  <p>
                    {String(lastReconcile.note ?? "Reconcile completed")}
                  </p>
                  {lastReconcile.bbDrift &&
                  typeof lastReconcile.bbDrift === "object" ? (
                    <p className="mt-1 font-mono">
                      BB drift:{" "}
                      {JSON.stringify(lastReconcile.bbDrift)}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {data.activeAssociation ? (
                <p className="text-xs text-muted-foreground">
                  Active tenant association:{" "}
                  <span className="font-mono">
                    {String(
                      (data.activeAssociation as Record<string, unknown>)
                        .productTenantRef ?? "—",
                    )}
                  </span>
                </p>
              ) : null}
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
                    <ListOrUuidField
                      value={coordinationId}
                      onChange={setCoordinationId}
                      options={billingCoordinationIdOptions}
                      placeholder="Select coordination ID"
                      fallbackPlaceholder="Coordination ID"
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
                    <ListOrUuidField
                      value={provisioningReqId}
                      onChange={setProvisioningReqId}
                      options={provisioningIdOptions}
                      placeholder="Select provisioning request"
                      fallbackPlaceholder="Provisioning request ID"
                      required
                    />
                    <ListOrUuidField
                      value={completeTenantRef}
                      onChange={setCompleteTenantRef}
                      options={tenantPickOptions}
                      placeholder="Tenant ref (optional)"
                      fallbackPlaceholder="Tenant UUID or edge:UUID (optional)"
                    />
                    <Button type="submit" disabled={completeProvisioningMutation.isPending}>
                      Complete provisioning
                    </Button>
                  </form>
                ) : null}
                <div className="space-y-2" data-testid="subscription-provisioning-jobs">
                  <h3 className="type-sm font-medium">Durable provisioning jobs</h3>
                  <p className="type-xs text-[var(--text-muted)]">
                    GET /provisioning-jobs/by-subscription — file async (doc 39 W3),
                    pas un claim 50k/s.
                  </p>
                  {provisioningJobsQuery.isLoading ? (
                    <p className="type-sm text-[var(--text-muted)]">Loading jobs…</p>
                  ) : null}
                  {provisioningJobsQuery.isSuccess &&
                  (provisioningJobsQuery.data?.length ?? 0) === 0 ? (
                    <p className="type-sm text-[var(--text-muted)]">
                      Aucun job pour cette subscription.
                    </p>
                  ) : null}
                  {(provisioningJobsQuery.data ?? []).length > 0 ? (
                    <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)]">
                      {(provisioningJobsQuery.data as Array<Record<string, unknown>>).map(
                        (job, i) => (
                          <li key={String(job.id ?? i)} className="px-3 py-2 type-sm">
                            <span className="font-medium">
                              {String(job.jobType ?? job.type ?? "JOB")}
                            </span>
                            {" · "}
                            {String(job.status ?? "—")}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : null}
                  {canIntegrations ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={processProvisioningJobsMutation.isPending}
                      onClick={() => processProvisioningJobsMutation.mutate()}
                    >
                      {processProvisioningJobsMutation.isPending
                        ? "Processing…"
                        : "Process job queue (limit 10)"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </EdgePermissionGate>
        ) : null}

        {section === "changes" ? (
          <EdgePermissionGate permission="platform:subscriptions:change_plan">
            <div className="space-y-[var(--space-4)]">
              <form
                className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] sm:grid-cols-2"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createChangeMutation.mutate();
                }}
              >
                <h2 className="sm:col-span-2 text-sm font-medium">
                  Change plan / create change request
                </h2>
                <select
                  className={fieldControlClass}
                  value={changeForm.changeType}
                  onChange={(e) =>
                    setChangeForm((s) => ({ ...s, changeType: e.target.value }))
                  }
                  required
                >
                  <option value="PLAN_CHANGE">PLAN_CHANGE</option>
                  <option value="ADDON_ADD">ADDON_ADD</option>
                  <option value="ADDON_REMOVE">ADDON_REMOVE</option>
                  <option value="BILLING_FREQUENCY">BILLING_FREQUENCY</option>
                </select>
                {changeForm.changeType === "PLAN_CHANGE" ? (
                  <input
                    className={fieldControlClass}
                    placeholder="Plan code (e.g. SYNTIX_PROFESSIONAL)"
                    value={changeForm.planCode}
                    onChange={(e) =>
                      setChangeForm((s) => ({
                        ...s,
                        planCode: e.target.value,
                      }))
                    }
                    required
                  />
                ) : null}
                {changeForm.changeType === "ADDON_ADD" ||
                changeForm.changeType === "ADDON_REMOVE" ? (
                  <input
                    className={fieldControlClass}
                    placeholder="Add-on offerRef / code"
                    value={changeForm.offerRef}
                    onChange={(e) =>
                      setChangeForm((s) => ({
                        ...s,
                        offerRef: e.target.value,
                      }))
                    }
                    required
                  />
                ) : null}
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
                  className={`${fieldControlClass} sm:col-span-2`}
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
                  <div className="sm:col-span-2">
                    <ActionError
                      error={createChangeMutation.error}
                      fallback="Create change failed"
                    />
                  </div>
                ) : null}
              </form>
              {changesQuery.isLoading ? (
                <EdgeLoadingState label="Loading change requests…" />
              ) : !changeRows.length ? (
                <EdgeEmptyState title="No change requests" />
              ) : (
                <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)]">
                  {changeRows.map((ch) => {
                    const changeId = String(ch.id);
                    const chStatus = String(ch.status ?? "");
                    const scheduleAt = scheduleAtByChange[changeId] ?? "";
                    const pendingApprove =
                      chStatus === "PENDING_APPROVAL" || chStatus === "DRAFT";
                    const canExecute =
                      chStatus === "APPROVED" ||
                      chStatus === "PENDING_EXECUTION" ||
                      chStatus === "SCHEDULED" ||
                      chStatus === "NOT_REQUIRED";
                    return (
                      <li
                        key={changeId}
                        className="space-y-[var(--space-2)] p-[var(--space-4)] text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {String(ch.changeType ?? changeId)}
                          </span>
                          {ch.status ? (
                            <Badge tone="default">{chStatus}</Badge>
                          ) : null}
                          {canApprove && pendingApprove ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={approveChangeMutation.isPending}
                                onClick={() =>
                                  approveChangeMutation.mutate(changeId)
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={rejectChangeMutation.isPending}
                                onClick={() =>
                                  rejectChangeMutation.mutate(changeId)
                                }
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                          {canChangePlan && canExecute ? (
                            executeChangeConfirmId === changeId ? null : (
                              <Button
                                size="sm"
                                disabled={executeChangeMutation.isPending}
                                onClick={() =>
                                  setExecuteChangeConfirmId(changeId)
                                }
                              >
                                Execute…
                              </Button>
                            )
                          ) : null}
                        </div>
                        {canChangePlan &&
                        (pendingApprove ||
                          chStatus === "APPROVED" ||
                          chStatus === "PENDING_EXECUTION") ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="datetime-local"
                              className={`${fieldControlClass} max-w-xs`}
                              value={scheduleAt}
                              onChange={(e) =>
                                setScheduleAtByChange((prev) => ({
                                  ...prev,
                                  [changeId]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                scheduleChangeMutation.isPending ||
                                !scheduleAt.trim()
                              }
                              onClick={() => {
                                const iso = new Date(scheduleAt).toISOString();
                                scheduleChangeMutation.mutate({
                                  changeId,
                                  executeAt: iso,
                                });
                              }}
                            >
                              Schedule
                            </Button>
                          </div>
                        ) : null}
                        {executeChangeConfirmId === changeId ? (
                          <ConfirmPanel
                            title="Execute change"
                            description="Recalculates entitlements and keeps the current tenant association."
                            onBack={() => {
                              setExecuteChangeConfirmId(null);
                              executeChangeMutation.reset();
                            }}
                          >
                            {executeChangeMutation.isError ? (
                              <ActionError
                                error={executeChangeMutation.error}
                                fallback="Execute change failed"
                              />
                            ) : null}
                            <Button
                              size="sm"
                              disabled={executeChangeMutation.isPending}
                              onClick={() =>
                                executeChangeMutation.mutate(changeId)
                              }
                            >
                              Confirm execute
                            </Button>
                          </ConfirmPanel>
                        ) : null}
                        {approveChangeMutation.isError &&
                        approveChangeMutation.variables === changeId ? (
                          <ActionError
                            error={approveChangeMutation.error}
                            fallback="Approve failed"
                          />
                        ) : null}
                        {rejectChangeMutation.isError &&
                        rejectChangeMutation.variables === changeId ? (
                          <ActionError
                            error={rejectChangeMutation.error}
                            fallback="Reject failed"
                          />
                        ) : null}
                        {scheduleChangeMutation.isError &&
                        scheduleChangeMutation.variables?.changeId ===
                          changeId ? (
                          <ActionError
                            error={scheduleChangeMutation.error}
                            fallback="Schedule failed"
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              {lastChangeExec ? (
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  {String(lastChangeExec.note ?? "Change executed")} · tenant={" "}
                  {String(lastChangeExec.productTenantRetained ?? "—")}
                </p>
              ) : null}
            </div>
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
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
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
      <dt className="text-xs text-[var(--text-secondary)]">{label}</dt>
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
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">None recorded.</p>
      </div>
    );
  }
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-3 divide-y divide-[var(--border)]">
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
              <span className="ml-2 text-[var(--text-secondary)]">
                {String(row.reason)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfirmPanel({
  title,
  description,
  onBack,
  children,
}: {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/30 p-[var(--space-4)]">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">{children}</div>
      <Button size="sm" variant="ghost" type="button" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}

function ActionError({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}) {
  return (
    <p className="w-full text-sm text-[var(--danger)]">
      {error instanceof EdgeApiError
        ? error.message
        : (error as { message?: string })?.message ?? fallback}
    </p>
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
        className={`${fieldControlClass} max-w-xs`}
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
      {error ? <ActionError error={error} fallback="Terminate failed" /> : null}
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
  return <ActionError error={first.error} fallback="Action failed" />;
}
