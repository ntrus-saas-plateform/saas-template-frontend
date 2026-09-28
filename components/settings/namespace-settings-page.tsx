"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, PageHeader } from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import {
  SettingsStages,
  type SettingsStage,
} from "@/components/settings/settings-stages";
import { ResourceCollectionPage, type ResourceField } from "@/components/settings/resource-collection-page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  displayToDraft,
  draftToValue,
  orderedNamespaceKeys,
  resolveFieldMeta,
} from "@/lib/settings/field-catalog";
import { stageNamespaceKeys } from "@/lib/settings/namespace-stages";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";

export type NamespaceCatalog = {
  title: string;
  description: string;
  resource: string;
  createFields: ResourceField[];
  listLabel?: string;
  addLabel?: string;
};

export function NamespaceSettingsPage({
  title,
  description,
  namespace,
  permission = "settings:read",
  updatePermission = "settings:update",
  hideHeader = false,
  embed = false,
  catalog,
  extraStages,
  prependStages,
}: {
  title: string;
  description: string;
  namespace: string;
  permission?: string;
  updatePermission?: string;
  hideHeader?: boolean;
  embed?: boolean;
  catalog?: NamespaceCatalog;
  extraStages?: SettingsStage[];
  prependStages?: SettingsStage[];
}) {
  const client = useApiClient();
  const api = identityApi(client);
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const { push } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: idk.settings(namespace),
    queryFn: async () => api.settings.getTenantNs(namespace),
  });

  const values = query.data?.data?.values ?? {};

  useEffect(() => {
    setDraft({});
  }, [namespace, query.dataUpdatedAt]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(draft)) {
        const meta = resolveFieldMeta(namespace, key, values[key]);
        payload[key] = draftToValue(meta, raw, values[key]);
      }
      const result = await api.settings.patchTenantNs(namespace, payload);

      const tenantId = context?.tenantId;
      if (tenantId) {
        const mirror: Record<string, unknown> = {};
        if (namespace === "localization") {
          if (payload.timezone !== undefined) mirror.timezone = payload.timezone;
          if (payload.locale !== undefined) mirror.locale = payload.locale;
          if (payload.defaultLanguage !== undefined) {
            mirror.defaultLanguage = payload.defaultLanguage;
          }
          if (payload.dateFormat !== undefined) mirror.dateFormat = payload.dateFormat;
          if (payload.timeFormat !== undefined) mirror.timeFormat = payload.timeFormat;
          if (payload.numberFormat !== undefined) {
            mirror.numberFormat = payload.numberFormat;
          }
        }
        if (namespace === "currency" && payload.primary !== undefined) {
          mirror.defaultCurrency = payload.primary;
          await api.settings
            .patchTenantNs("localization", { currency: payload.primary })
            .catch(() => undefined);
          await api.settings
            .patchTenantNs("billing", { currency: payload.primary })
            .catch(() => undefined);
          if (payload.display === undefined) {
            await api.settings
              .patchTenantNs("currency", {
                display: payload.primary,
                transaction: payload.primary,
                functional: payload.primary,
                reporting: payload.primary,
              })
              .catch(() => undefined);
          }
        }
        if (namespace === "fiscal") {
          if (payload.calendar !== undefined) mirror.fiscalCalendar = payload.calendar;
          if (payload.yearStartMonth !== undefined) {
            mirror.fiscalYearStartMonth = payload.yearStartMonth;
          }
          if (payload.yearStartDay !== undefined) {
            mirror.fiscalYearStartDay = payload.yearStartDay;
          }
        }
        if (namespace === "regional" && payload.country !== undefined) {
          mirror.country = payload.country;
        }
        if (namespace === "branding" && payload.displayName !== undefined) {
          mirror.displayName = payload.displayName;
        }
        if (Object.keys(mirror).length > 0) {
          await api.tenants.patch(tenantId, mirror).catch(() => undefined);
        }
      }

      return result;
    },
    onSuccess: async () => {
      setDraft({});
      await qc.invalidateQueries({ queryKey: idk.settings(namespace) });
      if (context?.tenantId) {
        await qc.invalidateQueries({ queryKey: idk.tenant(context.tenantId) });
      }
      push({ title: "Settings saved", tone: "success" });
    },
    onError: () => push({ title: "Save failed", tone: "danger" }),
  });

  const keys = orderedNamespaceKeys(namespace, values);

  const fieldsFor = (fieldKeys: string[]) => (
    <>
      {fieldKeys.map((key) => {
        const meta = resolveFieldMeta(namespace, key, values[key]);
        const shown = draft[key] ?? displayToDraft(meta, values[key]);
        return (
          <div key={key} className={meta.fullWidth ? "sm:col-span-2" : undefined}>
            <SettingFieldControl
              meta={meta}
              value={shown}
              onChange={(next) => setDraft((d) => ({ ...d, [key]: next }))}
            />
          </div>
        );
      })}
    </>
  );

  const saveButton = (
    <PermissionGate permission={updatePermission}>
      <Button
        disabled={Object.keys(draft).length === 0 || save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </PermissionGate>
  );

  if (embed) {
    if (query.isLoading) return <Skeleton className="h-40 w-full sm:col-span-2" />;
    if (query.isError) {
      return (
        <div className="sm:col-span-2">
          <ErrorState
            title="Could not load settings"
            description="Retry or check your permissions."
            onRetry={() => void query.refetch()}
          />
        </div>
      );
    }
    if (keys.length === 0) {
      return (
        <p className="type-sm text-[var(--text-muted)] sm:col-span-2">
          No settings in this section.
        </p>
      );
    }
    return (
      <>
        {fieldsFor(keys)}
        <div className="flex justify-end sm:col-span-2">{saveButton}</div>
      </>
    );
  }

  const groups = stageNamespaceKeys(namespace, keys);
  const fieldStages: SettingsStage[] = groups.map((group) => ({
    id: group.id,
    label: group.label,
    description: group.description,
    content: fieldsFor(group.keys),
  }));

  const catalogStages: SettingsStage[] = catalog
    ? [
        {
          id: "catalog",
          label: catalog.listLabel ?? catalog.title,
          description: catalog.description,
          layout: "block",
          content: (
            <ResourceCollectionPage
              title={catalog.title}
              description={catalog.description}
              resource={catalog.resource}
              permission={permission}
              createFields={catalog.createFields}
              hideHeader
              surface="list"
            />
          ),
          footer: null,
        },
      ]
    : [];

  const stages = [
    ...(prependStages ?? []),
    ...fieldStages,
    ...(extraStages ?? []),
    ...catalogStages,
  ];

  return (
    <PermissionGate permission={permission}>
      {hideHeader ? null : (
        <PageHeader title={title} description={description} />
      )}
      {query.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : query.isError ? (
        <ErrorState
          title="Could not load settings"
          description="Retry or check your permissions."
          onRetry={() => void query.refetch()}
        />
      ) : stages.length === 0 ? (
        <p className="type-sm text-[var(--text-muted)]">No settings in this section.</p>
      ) : (
        <SettingsStages stages={stages} footer={saveButton} />
      )}
    </PermissionGate>
  );
}
