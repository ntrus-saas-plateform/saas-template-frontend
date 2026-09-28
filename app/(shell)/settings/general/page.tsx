"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, PageHeader } from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import { SettingsStages } from "@/components/settings/settings-stages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi } from "@/lib/api/identity";
import {
  COMPANY_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
} from "@/lib/settings/options";
import { SettingsAlignmentPanel } from "@/components/settings/settings-alignment-panel";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";

const STATUSES = [
  "PROVISIONING",
  "ACTIVE",
  "SUSPENDED",
  "READ_ONLY",
  "LOCKED",
  "DEACTIVATING",
  "ARCHIVED",
  "FAILED",
  "DELETED",
] as const;

/**
 * General = tenant identity & contacts only.
 * Timezone / language / currency live on Localization & Currency (single source of truth).
 */
export default function GeneralSettingsPage() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const tenantId = context?.tenantId ?? "";
  const qc = useQueryClient();
  const { push } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("ACTIVE");

  const query = useQuery({
    queryKey: idk.tenant(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => api.tenants.get(tenantId),
  });
  const tenant = query.data?.data as Record<string, unknown> | undefined;

  const val = (key: string, fallback = "") =>
    draft[key] ?? String(tenant?.[key] ?? fallback);

  const set = (key: string) => (next: string) =>
    setDraft((d) => ({ ...d, [key]: next }));

  const orgOptions = organizations.map((o) => ({
    value: o.id,
    label: `${o.name} (${o.slug})`,
  }));

  const patch = useMutation({
    mutationFn: () =>
      api.tenants.patch(tenantId, {
        displayName: val("displayName"),
        tradeName: val("tradeName") || undefined,
        description: val("description") || undefined,
        industry: val("industry") || undefined,
        companyType: val("companyType") || undefined,
        email: val("email") || undefined,
        phone: val("phone") || undefined,
        website: val("website") || undefined,
        primaryContactName: val("primaryContactName") || undefined,
        primaryContactEmail: val("primaryContactEmail") || undefined,
        primaryContactPhone: val("primaryContactPhone") || undefined,
        defaultOrganizationId: val("defaultOrganizationId") || undefined,
        referenceOrganizationId: val("referenceOrganizationId") || undefined,
      }),
    onSuccess: async () => {
      setDraft({});
      await qc.invalidateQueries({ queryKey: idk.tenant(tenantId) });
      push({ title: "General settings saved", tone: "success" });
    },
    onError: () => push({ title: "Save failed", tone: "danger" }),
  });

  const transition = useMutation({
    mutationFn: () => api.tenants.status(tenantId, status),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: idk.tenant(tenantId) });
      push({ title: "Status updated", tone: "success" });
    },
  });

  return (
    <PermissionGate permission="tenant:read">
      <PageHeader
        title="General"
        description="Tenant identity and contacts. Language, timezone and currency are configured under Localization and Currency."
      />
      {!tenantId ? (
        <ErrorState title="No tenant context" description="Retry or check your session." />
      ) : query.isLoading ? (
        <Skeleton className="h-64 w-full max-w-3xl" />
      ) : query.isError ? (
        <ErrorState
          title="Failed to load tenant"
          description="Retry or check your permissions."
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-[var(--space-4)]">
          <SettingsAlignmentPanel />
          <div className="flex items-center gap-[var(--space-2)]">
            <Badge>{String(tenant?.status ?? "—")}</Badge>
            <span className="type-sm text-[var(--text-muted)]">
              {String(tenant?.slug ?? "")}
            </span>
          </div>
          <SettingsStages
            footer={
              <PermissionGate permission="tenant:update">
                <Button disabled={patch.isPending} onClick={() => patch.mutate()}>
                  Save
                </Button>
              </PermissionGate>
            }
            stages={[
              {
                id: "identity",
                label: "Identity",
                description: "How this tenant appears in Atlas and on documents.",
                content: (
                  <>
              <SettingFieldControl
                meta={{ key: "displayName", label: "Display name", control: "text" }}
                value={val("displayName")}
                onChange={set("displayName")}
              />
              <SettingFieldControl
                meta={{ key: "tradeName", label: "Trade name", control: "text" }}
                value={val("tradeName")}
                onChange={set("tradeName")}
              />
              <SettingFieldControl
                meta={{
                  key: "industry",
                  label: "Industry",
                  control: "searchable",
                  getOptions: () => INDUSTRY_OPTIONS,
                }}
                value={val("industry")}
                onChange={set("industry")}
              />
              <SettingFieldControl
                meta={{
                  key: "companyType",
                  label: "Organization type",
                  control: "searchable",
                  getOptions: () => COMPANY_TYPE_OPTIONS,
                }}
                value={val("companyType")}
                onChange={set("companyType")}
              />
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={val("description")}
                    onChange={(e) => set("description")(e.target.value)}
                  />
                </Field>
              </div>
                  </>
                ),
              },
              {
                id: "contact",
                label: "Contact",
                description: "Primary channels for this tenant.",
                content: (
                  <>
              <SettingFieldControl
                meta={{ key: "email", label: "Primary email", control: "email" }}
                value={val("email")}
                onChange={set("email")}
              />
              <SettingFieldControl
                meta={{ key: "phone", label: "Primary phone", control: "tel" }}
                value={val("phone")}
                onChange={set("phone")}
              />
              <div className="sm:col-span-2">
                <SettingFieldControl
                  meta={{ key: "website", label: "Website", control: "url" }}
                  value={val("website")}
                  onChange={set("website")}
                />
              </div>
              <SettingFieldControl
                meta={{ key: "primaryContactName", label: "Primary contact", control: "text" }}
                value={val("primaryContactName")}
                onChange={set("primaryContactName")}
              />
              <SettingFieldControl
                meta={{
                  key: "primaryContactEmail",
                  label: "Contact email",
                  control: "email",
                }}
                value={val("primaryContactEmail")}
                onChange={set("primaryContactEmail")}
              />
              <SettingFieldControl
                meta={{
                  key: "primaryContactPhone",
                  label: "Contact phone",
                  control: "tel",
                }}
                value={val("primaryContactPhone")}
                onChange={set("primaryContactPhone")}
              />
                  </>
                ),
              },
              {
                id: "organizations",
                label: "Organizations",
                description: "Default and reference organizations for this tenant.",
                content: (
                  <>
              <SettingFieldControl
                meta={{
                  key: "defaultOrganizationId",
                  label: "Default organization",
                  control: "select",
                  options: orgOptions,
                  hint: "From your memberships — no UUID typing",
                }}
                value={val("defaultOrganizationId")}
                onChange={set("defaultOrganizationId")}
              />
              <SettingFieldControl
                meta={{
                  key: "referenceOrganizationId",
                  label: "Reference organization",
                  control: "select",
                  options: orgOptions,
                }}
                value={val("referenceOrganizationId")}
                onChange={set("referenceOrganizationId")}
              />
                  </>
                ),
              },
              {
                id: "lifecycle",
                label: "Lifecycle",
                description: "Tenant status transitions. Use with care.",
                columns: 1,
                content: (
                  <Field label="Lifecycle status">
                    <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ),
                footer: (
                  <PermissionGate permission="tenant:update">
                    <Button
                      variant="secondary"
                      disabled={transition.isPending}
                      onClick={() => transition.mutate()}
                    >
                      Change status
                    </Button>
                  </PermissionGate>
                ),
              },
            ]}
          />
        </div>
      )}
    </PermissionGate>
  );
}
