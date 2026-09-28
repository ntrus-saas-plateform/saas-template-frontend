"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/settings/searchable-select";
import {
  buildCascadePatches,
  computeAlignment,
  getCountryProfile,
} from "@/lib/settings/country-profiles";
import { getCountryOptions } from "@/lib/settings/reference-data";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { useState } from "react";

/**
 * Cross-namespace alignment panel: country drives currency, timezone, locale, fiscal.
 */
export function SettingsAlignmentPanel() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const tenantId = context?.tenantId ?? "";
  const qc = useQueryClient();
  const { push } = useToast();
  const [pickCountry, setPickCountry] = useState<string | null>(null);

  const regional = useQuery({
    queryKey: idk.settings("regional"),
    queryFn: () => api.settings.getTenantNs("regional"),
  });
  const localization = useQuery({
    queryKey: idk.settings("localization"),
    queryFn: () => api.settings.getTenantNs("localization"),
  });
  const currency = useQuery({
    queryKey: idk.settings("currency"),
    queryFn: () => api.settings.getTenantNs("currency"),
  });
  const fiscal = useQuery({
    queryKey: idk.settings("fiscal"),
    queryFn: () => api.settings.getTenantNs("fiscal"),
  });

  const country =
    pickCountry ??
    (regional.data?.data?.values?.country as string | null | undefined) ??
    null;

  const alignment = computeAlignment({
    country,
    currency: currency.data?.data?.values?.primary as string | undefined,
    timezone: localization.data?.data?.values?.timezone as string | undefined,
    locale: localization.data?.data?.values?.locale as string | undefined,
    defaultLanguage: localization.data?.data?.values?.defaultLanguage as
      | string
      | undefined,
    fiscalYearStartMonth: fiscal.data?.data?.values?.yearStartMonth as
      | number
      | undefined,
  });

  const apply = useMutation({
    mutationFn: async (code: string) => {
      const profile = getCountryProfile(code);
      if (!profile) throw new Error("Unknown country");
      const patches = buildCascadePatches(profile);
      await Promise.all([
        api.settings.patchTenantNs("regional", patches.regional),
        api.settings.patchTenantNs("localization", patches.localization),
        api.settings.patchTenantNs("currency", patches.currency),
        api.settings.patchTenantNs("fiscal", patches.fiscal),
        api.settings.patchTenantNs("billing", patches.billing),
      ]);
      if (tenantId) {
        await api.tenants.patch(tenantId, patches.tenant);
      }
      return profile;
    },
    onSuccess: async (profile) => {
      setPickCountry(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: idk.settings("regional") }),
        qc.invalidateQueries({ queryKey: idk.settings("localization") }),
        qc.invalidateQueries({ queryKey: idk.settings("currency") }),
        qc.invalidateQueries({ queryKey: idk.settings("fiscal") }),
        qc.invalidateQueries({ queryKey: idk.settings("billing") }),
        tenantId
          ? qc.invalidateQueries({ queryKey: idk.tenant(tenantId) })
          : Promise.resolve(),
      ]);
      // Also refresh any open settings queries
      await qc.invalidateQueries({ queryKey: ["identity"] });
      push({
        title: `Aligned to ${profile.country}`,
        description: `${profile.currency} · ${profile.timezone} · ${profile.locale}`,
        tone: "success",
      });
    },
    onError: () =>
      push({ title: "Could not apply country defaults", tone: "danger" }),
  });

  const loading =
    regional.isLoading ||
    localization.isLoading ||
    currency.isLoading ||
    fiscal.isLoading;

  if (loading) return null;

  const aligned = alignment.expected && alignment.drifts.length === 0;

  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)] border-b border-[var(--border)] px-[var(--space-5)] py-[var(--space-4)]">
        <div className="min-w-0 flex-1">
          <h2 className="type-md text-[var(--text-primary)]">
            Tenant configuration alignment
          </h2>
          <p className="mt-[var(--space-1)] max-w-prose type-sm text-[var(--text-secondary)]">
            Country is the source of truth for currency, timezone, locale, formats and fiscal
            year. Apply once — every related section stays in sync.
          </p>
        </div>
        <Badge tone={aligned ? "success" : "warning"}>
          {aligned
            ? "Aligned"
            : alignment.drifts.length
              ? `${alignment.drifts.length} drift${alignment.drifts.length > 1 ? "s" : ""}`
              : "Not configured"}
        </Badge>
      </header>

      <div className="p-[var(--space-5)]">
      <div className="grid gap-[var(--space-3)] sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="mb-[var(--space-1)] type-sm font-medium text-[var(--text-secondary)]">
            Operating country
          </p>
          <SearchableSelect
            value={country ?? ""}
            options={getCountryOptions()}
            placeholder="Search countries…"
            onChange={(c) => setPickCountry(c)}
          />
        </div>
        <Button
          disabled={!country || apply.isPending}
          onClick={() => country && apply.mutate(country)}
        >
          {apply.isPending ? "Applying…" : "Apply country defaults"}
        </Button>
      </div>

      {alignment.expected ? (
        <dl className="mt-[var(--space-4)] grid gap-[var(--space-3)] type-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="type-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Currency
            </dt>
            <dd className="mt-[var(--space-1)] text-[var(--text-primary)]">
              {alignment.expected.currency}
            </dd>
          </div>
          <div>
            <dt className="type-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Timezone
            </dt>
            <dd className="mt-[var(--space-1)] text-[var(--text-primary)]">
              {alignment.expected.timezone}
            </dd>
          </div>
          <div>
            <dt className="type-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Locale
            </dt>
            <dd className="mt-[var(--space-1)] text-[var(--text-primary)]">
              {alignment.expected.locale}
            </dd>
          </div>
          <div>
            <dt className="type-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Fiscal start
            </dt>
            <dd className="mt-[var(--space-1)] text-[var(--text-primary)]">
              Month {alignment.expected.fiscalYearStartMonth}
            </dd>
          </div>
        </dl>
      ) : null}

      {alignment.drifts.length > 0 ? (
        <ul className="mt-[var(--space-4)] space-y-[var(--space-1)] border-t border-[var(--border)] pt-[var(--space-3)] type-sm">
          {alignment.drifts.map((d) => (
            <li key={d.field} className="text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-primary)]">{d.field}</span>
              {" · "}
              {d.section}: {d.actual} → expected {d.expected}
            </li>
          ))}
        </ul>
      ) : null}
      </div>
    </section>
  );
}
