"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, PageHeader } from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import { SettingsStages } from "@/components/settings/settings-stages";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi } from "@/lib/api/identity";
import {
  COMPANY_TYPE_OPTIONS,
  getCountryOptions,
} from "@/lib/settings/options";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { NamespaceSettingsPage } from "@/components/settings/namespace-settings-page";
import { SettingsAlignmentPanel } from "@/components/settings/settings-alignment-panel";

/**
 * Company = legal identity + HQ address.
 * Fiscal calendar / year start → Fiscal. Logos / colors → Branding.
 * Contacts / website already on General (not repeated here).
 */
export default function CompanySettingsPage() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const tenantId = context?.tenantId ?? "";
  const qc = useQueryClient();
  const { push } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: idk.tenant(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => api.tenants.get(tenantId),
  });
  const tenant = query.data?.data as Record<string, unknown> | undefined;
  const val = (key: string) => draft[key] ?? String(tenant?.[key] ?? "");
  const set = (key: string) => (next: string) =>
    setDraft((d) => ({ ...d, [key]: next }));

  const patch = useMutation({
    mutationFn: () =>
      api.tenants.patch(tenantId, {
        legalName: val("legalName") || undefined,
        registrationNumber: val("registrationNumber") || undefined,
        taxId: val("taxId") || undefined,
        commerceRegister: val("commerceRegister") || undefined,
        companyType: val("companyType") || undefined,
        country: val("country") || undefined,
        adminRegion: val("adminRegion") || undefined,
        city: val("city") || undefined,
        addressLine1: val("addressLine1") || undefined,
        addressLine2: val("addressLine2") || undefined,
        postalCode: val("postalCode") || undefined,
      }),
    onSuccess: async () => {
      setDraft({});
      await qc.invalidateQueries({ queryKey: idk.tenant(tenantId) });
      push({ title: "Company profile saved", tone: "success" });
    },
    onError: () => push({ title: "Save failed", tone: "danger" }),
  });

  return (
    <PermissionGate permission="tenant:read">
      <PageHeader
        title="Company"
        description="Legal registration and headquarters address. Fiscal year is under Fiscal; logos under Branding."
      />
      {query.isLoading ? (
        <Skeleton className="h-64 w-full max-w-3xl" />
      ) : query.isError ? (
        <ErrorState
          title="Failed to load"
          description="Retry or check your permissions."
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-[var(--space-4)]">
          <SettingsAlignmentPanel />
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
                id: "legal",
                label: "Legal",
                description: "Registration details shown on official documents.",
                content: (
                  <>
                    <SettingFieldControl
                      meta={{ key: "legalName", label: "Legal name", control: "text" }}
                      value={val("legalName")}
                      onChange={set("legalName")}
                    />
                    <SettingFieldControl
                      meta={{
                        key: "companyType",
                        label: "Legal form",
                        control: "searchable",
                        getOptions: () => COMPANY_TYPE_OPTIONS,
                      }}
                      value={val("companyType")}
                      onChange={set("companyType")}
                    />
                    <SettingFieldControl
                      meta={{
                        key: "registrationNumber",
                        label: "Registration number",
                        control: "text",
                      }}
                      value={val("registrationNumber")}
                      onChange={set("registrationNumber")}
                    />
                    <SettingFieldControl
                      meta={{ key: "taxId", label: "Tax ID / VAT", control: "text" }}
                      value={val("taxId")}
                      onChange={set("taxId")}
                    />
                    <SettingFieldControl
                      meta={{
                        key: "commerceRegister",
                        label: "Commerce register",
                        control: "text",
                      }}
                      value={val("commerceRegister")}
                      onChange={set("commerceRegister")}
                    />
                  </>
                ),
              },
              {
                id: "headquarters",
                label: "Headquarters",
                description:
                  "Physical HQ address. Operating country defaults live under Regional.",
                content: (
                  <>
                    <SettingFieldControl
                      meta={{
                        key: "country",
                        label: "HQ country",
                        control: "searchable",
                        getOptions: getCountryOptions,
                        hint: "Headquarters address — use Align to sync operating defaults",
                      }}
                      value={val("country")}
                      onChange={set("country")}
                    />
                    <SettingFieldControl
                      meta={{ key: "adminRegion", label: "Region / province", control: "text" }}
                      value={val("adminRegion")}
                      onChange={set("adminRegion")}
                    />
                    <SettingFieldControl
                      meta={{ key: "city", label: "City", control: "text" }}
                      value={val("city")}
                      onChange={set("city")}
                    />
                    <SettingFieldControl
                      meta={{ key: "postalCode", label: "Postal code", control: "text" }}
                      value={val("postalCode")}
                      onChange={set("postalCode")}
                    />
                    <div className="sm:col-span-2">
                      <SettingFieldControl
                        meta={{
                          key: "addressLine1",
                          label: "Address line 1",
                          control: "text",
                        }}
                        value={val("addressLine1")}
                        onChange={set("addressLine1")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <SettingFieldControl
                        meta={{
                          key: "addressLine2",
                          label: "Address line 2",
                          control: "text",
                        }}
                        value={val("addressLine2")}
                        onChange={set("addressLine2")}
                      />
                    </div>
                  </>
                ),
              },
              {
                id: "links",
                label: "Legal links",
                description:
                  "Terms, privacy and legal mentions used on documents and the portal.",
                content: (
                  <NamespaceSettingsPage
                    title="Legal links"
                    description="Terms, privacy and legal mentions used on documents and the portal."
                    namespace="company"
                    permission="settings:read"
                    hideHeader
                    embed
                  />
                ),
                footer: null,
              },
            ]}
          />
        </div>
      )}
    </PermissionGate>
  );
}
