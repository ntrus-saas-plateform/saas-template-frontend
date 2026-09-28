"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingsPanel } from "@/components/shell/settings-panel";
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { OrgMembersPanel } from "@/components/identity/org-members-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { identityApi } from "@/lib/api/identity";
import {
  displayToDraft,
  draftToValue,
  orderedNamespaceKeys,
  resolveFieldMeta,
} from "@/lib/settings/field-catalog";
import {
  getCountryOptions,
  getCurrencyOptions,
  getLocaleOptions,
  getTimezoneOptions,
} from "@/lib/settings/options";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";

const ORG_SETTING_NS = [
  { id: "localization", label: "Localization" },
  { id: "currency", label: "Currency" },
  { id: "notifications", label: "Notifications" },
] as const;

const TABS = [
  { id: "general", label: "General" },
  { id: "address", label: "Address" },
  { id: "members", label: "Members" },
  { id: "settings", label: "Settings" },
];

const ORG_TYPES = ["BRANCH", "STORE", "OFFICE", "WAREHOUSE", "OTHER"] as const;

const BUSINESS_DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function statusTone(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "ARCHIVED") return "danger";
  return "default";
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 border-b border-[var(--border)] pb-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
    </div>
  );
}

function OrganizationDetail({
  id,
  initialTab = "general",
}: {
  id: string;
  initialTab?: string;
}) {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : "general",
  );
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [settingsNs, setSettingsNs] = useState<string>("localization");
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});

  const countryOptions = useMemo(() => getCountryOptions(), []);
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const localeOptions = useMemo(() => getLocaleOptions(), []);

  useEffect(() => {
    if (initialTab && TABS.some((t) => t.id === initialTab)) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const query = useQuery({
    queryKey: idk.organization(id),
    queryFn: async () => api.organizations.get(id),
  });

  const orgsQuery = useQuery({
    queryKey: [...idk.organizations(), "tenant-tree", "parents"],
    queryFn: async () =>
      api.organizations.list(1, 200, { scope: "tenant", tree: true }),
  });

  const org = query.data?.data;
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const draft = form ?? {
    name: org?.name ?? "",
    slug: org?.slug ?? "",
    code: org?.code ?? "",
    type: org?.type ?? "OTHER",
    description: org?.description ?? "",
    timezone: org?.timezone ?? "",
    locale: org?.locale ?? "",
    parentId: org?.parentId ?? "",
    isPrimary: Boolean(org?.isPrimary),
    address: { ...(org?.address ?? {}) },
    contact: { ...(org?.contact ?? {}) },
    openingHours: { ...(org?.openingHours ?? {}) },
    operationalSettings: { ...(org?.operationalSettings ?? {}) },
  };

  useEffect(() => {
    setForm(null);
  }, [id, query.dataUpdatedAt]);

  const setField = (key: string, value: unknown) =>
    setForm({ ...draft, [key]: value });

  const setNested = (
    group: "address" | "contact" | "operationalSettings" | "openingHours",
    key: string,
    value: unknown,
  ) =>
    setForm({
      ...draft,
      [group]: { ...(draft[group] as Record<string, unknown>), [key]: value },
    });

  const patch = useMutation({
    mutationFn: () => {
      const body = {
        name: draft.name || undefined,
        slug: draft.slug || undefined,
        code: (draft.code as string) || null,
        type: draft.type || undefined,
        description: (draft.description as string) || undefined,
        timezone: (draft.timezone as string) || undefined,
        locale: (draft.locale as string) || undefined,
        parentId: (draft.parentId as string) || null,
        isPrimary: Boolean(draft.isPrimary),
        address: draft.address,
        contact: draft.contact,
        openingHours: draft.openingHours,
        operationalSettings: draft.operationalSettings,
      };
      return api.organizations.patch(id, body);
    },
    onSuccess: async () => {
      setForm(null);
      toast.push({ title: "Organization saved", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.organization(id) });
      await qc.invalidateQueries({ queryKey: idk.organizations() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const suspend = useMutation({
    mutationFn: () => api.organizations.suspend(id),
    onSuccess: async () => {
      setSuspendOpen(false);
      await qc.invalidateQueries({ queryKey: idk.organization(id) });
    },
  });

  const settingsQuery = useQuery({
    queryKey: [...idk.organization(id), "settings", settingsNs],
    queryFn: async () => api.settings.getOrgNs(id, settingsNs),
    enabled: tab === "settings",
  });

  useEffect(() => {
    setSettingsDraft({});
  }, [settingsNs, settingsQuery.dataUpdatedAt]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const values = settingsQuery.data?.data?.values ?? {};
      const payload: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(settingsDraft)) {
        const meta = resolveFieldMeta(settingsNs, key, values[key]);
        payload[key] = draftToValue(meta, raw, values[key]);
      }
      return api.settings.patchOrgNs(id, settingsNs, payload);
    },
    onSuccess: async () => {
      setSettingsDraft({});
      toast.push({ title: "Overrides saved", tone: "success" });
      await qc.invalidateQueries({
        queryKey: [...idk.organization(id), "settings", settingsNs],
      });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const warehousesQuery = useQuery({
    queryKey: [...idk.organization(id), "warehouses"],
    queryFn: async () => api.organizations.warehouses.list(id),
    enabled: tab === "warehouses" || tab === "operational" || tab === "pos",
  });

  const posQuery = useQuery({
    queryKey: [...idk.organization(id), "pos"],
    queryFn: async () => api.organizations.posTerminals.list(id),
    enabled: tab === "pos" || tab === "operational",
  });

  const cashQuery = useQuery({
    queryKey: [...idk.organization(id), "cash"],
    queryFn: async () => api.organizations.cashRegisters.list(id),
    enabled: tab === "operational" || tab === "pos",
  });

  const workflowsQuery = useQuery({
    queryKey: [...idk.organization(id), "workflows"],
    queryFn: async () => api.organizations.workflows.list(id),
    enabled: tab === "workflows",
  });

  const [whCode, setWhCode] = useState("");
  const [whName, setWhName] = useState("");
  const createWh = useMutation({
    mutationFn: () =>
      api.organizations.warehouses.create(id, { code: whCode, name: whName }),
    onSuccess: async () => {
      setWhCode("");
      setWhName("");
      await qc.invalidateQueries({
        queryKey: [...idk.organization(id), "warehouses"],
      });
    },
  });

  const [posCode, setPosCode] = useState("");
  const [posName, setPosName] = useState("");
  const [posWarehouseId, setPosWarehouseId] = useState("");
  const createPos = useMutation({
    mutationFn: () =>
      api.organizations.posTerminals.create(id, {
        code: posCode,
        name: posName,
        warehouseId: posWarehouseId || undefined,
      }),
    onSuccess: async () => {
      setPosCode("");
      setPosName("");
      setPosWarehouseId("");
      await qc.invalidateQueries({ queryKey: [...idk.organization(id), "pos"] });
    },
  });

  const [wfCode, setWfCode] = useState("");
  const [wfName, setWfName] = useState("");
  const [wfKind, setWfKind] = useState("PURCHASE_APPROVAL");
  const createWf = useMutation({
    mutationFn: () =>
      api.organizations.workflows.create(id, {
        code: wfCode,
        name: wfName,
        kind: wfKind,
        steps: [{ name: "Approve", stepIndex: 0, approverRoles: ["manager"] }],
      }),
    onSuccess: async () => {
      setWfCode("");
      setWfName("");
      await qc.invalidateQueries({
        queryKey: [...idk.organization(id), "workflows"],
      });
    },
  });

  const parentOptions = (orgsQuery.data?.data ?? []).filter((o) => o.id !== id);
  const address = draft.address as Record<string, unknown>;
  const contact = draft.contact as Record<string, unknown>;
  const ops = draft.operationalSettings as Record<string, unknown>;
  const hours = draft.openingHours as Record<string, unknown>;
  const businessDays = Array.isArray(ops.businessDays)
    ? (ops.businessDays as number[])
    : [];

  const settingsValues = settingsQuery.data?.data?.values ?? {};
  const settingsKeys = orderedNamespaceKeys(settingsNs, settingsValues);

  if (query.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (query.isError || !org) {
    return (
      <ErrorState
        title="Couldn't load organization"
        description={
          query.error instanceof Error
            ? query.error.message
            : "Organization not found."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const saveFooter = (
    <>
      <Button variant="outline" onClick={() => setForm(null)} disabled={!form}>
        Reset
      </Button>
      <Button disabled={patch.isPending} onClick={() => patch.mutate()}>
        Save changes
      </Button>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-[var(--text-primary)]">
              {org.name}
            </h2>
            <Badge tone={statusTone(org.status)}>{org.status}</Badge>
            {org.isPrimary ? <Badge tone="info">Primary</Badge> : null}
            {org.type ? <Badge>{String(org.type)}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {[org.code, org.slug].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSuspendOpen(true)}>
            Suspend
          </Button>
          <Button disabled={patch.isPending || !form} onClick={() => patch.mutate()}>
            Save
          </Button>
        </div>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "general" ? (
        <SettingsPanel maxWidth="xl" footer={saveFooter}>
          <SectionTitle
            title="Identity"
            description="Core organization profile and hierarchy placement."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                value={String(draft.name ?? "")}
                onChange={(e) => setField("name", e.target.value)}
              />
            </Field>
            <Field label="Code" htmlFor="code" hint="Business code (unique per tenant)">
              <Input
                id="code"
                value={String(draft.code ?? "")}
                onChange={(e) => setField("code", e.target.value)}
              />
            </Field>
            <Field label="Slug" htmlFor="slug">
              <Input
                id="slug"
                value={String(draft.slug ?? "")}
                onChange={(e) => setField("slug", e.target.value)}
              />
            </Field>
            <Field label="Type" htmlFor="type">
              <Select
                id="type"
                value={String(draft.type ?? "OTHER")}
                onChange={(e) => setField("type", e.target.value)}
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Keycloak Organization ID"
              htmlFor="kc-org"
              hint="Synced identity org (read-only)"
            >
              <Input
                id="kc-org"
                readOnly
                value={org?.keycloakOrganizationId ?? ""}
                placeholder="Not synced"
              />
            </Field>
            <Field label="Timezone" htmlFor="tz">
              <SearchableSelect
                value={String(draft.timezone ?? "")}
                options={timezoneOptions}
                placeholder="Search timezone…"
                onChange={(v) => setField("timezone", v)}
              />
            </Field>
            <Field label="Locale" htmlFor="locale">
              <SearchableSelect
                value={String(draft.locale ?? "")}
                options={localeOptions}
                placeholder="Search locale…"
                onChange={(v) => setField("locale", v)}
              />
            </Field>
            <Field label="Parent organization" htmlFor="parent">
              <Select
                id="parent"
                value={String(draft.parentId ?? "")}
                onChange={(e) => setField("parentId", e.target.value)}
              >
                <option value="">None (root)</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.code ? ` (${o.code})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Primary organization" htmlFor="primary">
              <Select
                id="primary"
                value={draft.isPrimary ? "true" : "false"}
                onChange={(e) => setField("isPrimary", e.target.value === "true")}
              >
                <option value="false">No</option>
                <option value="true">Yes — tenant primary</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="desc">
                <Textarea
                  id="desc"
                  value={String(draft.description ?? "")}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </SettingsPanel>
      ) : null}

      {tab === "address" ? (
        <SettingsPanel maxWidth="xl" footer={saveFooter}>
          <SectionTitle
            title="Location & contact"
            description="Physical address used for documents, delivery, and regional defaults."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Address line 1" htmlFor="line1">
                <Input
                  id="line1"
                  value={String(address.line1 ?? "")}
                  onChange={(e) => setNested("address", "line1", e.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Address line 2" htmlFor="line2">
                <Input
                  id="line2"
                  value={String(address.line2 ?? "")}
                  onChange={(e) => setNested("address", "line2", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Country" htmlFor="country">
              <SearchableSelect
                value={String(address.country ?? "")}
                options={countryOptions}
                placeholder="Search country…"
                onChange={(v) => setNested("address", "country", v || undefined)}
              />
            </Field>
            <Field label="Province / region" htmlFor="province">
              <Input
                id="province"
                value={String(address.province ?? "")}
                onChange={(e) => setNested("address", "province", e.target.value)}
              />
            </Field>
            <Field label="City" htmlFor="city">
              <Input
                id="city"
                value={String(address.city ?? "")}
                onChange={(e) => setNested("address", "city", e.target.value)}
              />
            </Field>
            <Field label="Commune" htmlFor="commune">
              <Input
                id="commune"
                value={String(address.commune ?? "")}
                onChange={(e) => setNested("address", "commune", e.target.value)}
              />
            </Field>
            <Field label="Zone" htmlFor="zone">
              <Input
                id="zone"
                value={String(address.zone ?? "")}
                onChange={(e) => setNested("address", "zone", e.target.value)}
              />
            </Field>
            <Field label="Quartier" htmlFor="quartier">
              <Input
                id="quartier"
                value={String(address.quartier ?? "")}
                onChange={(e) => setNested("address", "quartier", e.target.value)}
              />
            </Field>
            <Field label="Postal code" htmlFor="postalCode">
              <Input
                id="postalCode"
                value={String(address.postalCode ?? "")}
                onChange={(e) => setNested("address", "postalCode", e.target.value)}
              />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                value={String(contact.phone ?? "")}
                onChange={(e) => setNested("contact", "phone", e.target.value)}
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={String(contact.email ?? "")}
                onChange={(e) => setNested("contact", "email", e.target.value)}
              />
            </Field>
            <Field label="Website" htmlFor="website">
              <Input
                id="website"
                type="url"
                value={String(contact.website ?? "")}
                onChange={(e) => setNested("contact", "website", e.target.value)}
              />
            </Field>
            <Field label="Latitude" htmlFor="latitude">
              <Input
                id="latitude"
                type="number"
                step="any"
                value={address.latitude == null ? "" : String(address.latitude)}
                onChange={(e) =>
                  setNested(
                    "address",
                    "latitude",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </Field>
            <Field label="Longitude" htmlFor="longitude">
              <Input
                id="longitude"
                type="number"
                step="any"
                value={address.longitude == null ? "" : String(address.longitude)}
                onChange={(e) =>
                  setNested(
                    "address",
                    "longitude",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>

          <div className="mt-8">
            <SectionTitle
              title="Opening hours"
              description="Optional daily open/close windows for this site."
            />
            <div className="space-y-2">
              {WEEKDAYS.map((day) => {
                const dayHours = hours[day] as
                  | { open?: string; close?: string }
                  | null
                  | undefined;
                const closed = dayHours == null || dayHours === null;
                return (
                  <div
                    key={day}
                    className="grid items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 sm:grid-cols-[7rem_auto_1fr_1fr]"
                  >
                    <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                      {day}
                    </span>
                    <Select
                      value={closed ? "closed" : "open"}
                      onChange={(e) => {
                        if (e.target.value === "closed") {
                          setNested("openingHours", day, null);
                        } else {
                          setNested("openingHours", day, {
                            open: "08:00",
                            close: "18:00",
                          });
                        }
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </Select>
                    {!closed ? (
                      <>
                        <Select
                          value={String(dayHours?.open ?? "08:00")}
                          onChange={(e) =>
                            setNested("openingHours", day, {
                              open: e.target.value,
                              close: dayHours?.close ?? "18:00",
                            })
                          }
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={String(dayHours?.close ?? "18:00")}
                          onChange={(e) =>
                            setNested("openingHours", day, {
                              open: dayHours?.open ?? "08:00",
                              close: e.target.value,
                            })
                          }
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)] sm:col-span-2">
                        Closed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SettingsPanel>
      ) : null}

      {tab === "operational" ? (
        <SettingsPanel maxWidth="xl" footer={saveFooter}>
          <SectionTitle
            title="Operational defaults"
            description="Defaults applied to commerce, inventory and POS for this organization."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default currency" htmlFor="cur">
              <SearchableSelect
                value={String(ops.defaultCurrency ?? "")}
                options={currencyOptions}
                placeholder="Search currency…"
                onChange={(v) =>
                  setNested("operationalSettings", "defaultCurrency", v || undefined)
                }
              />
            </Field>
            <Field label="Default warehouse" htmlFor="dwh">
              <Select
                id="dwh"
                value={String(ops.defaultWarehouseId ?? "")}
                onChange={(e) =>
                  setNested(
                    "operationalSettings",
                    "defaultWarehouseId",
                    e.target.value || undefined,
                  )
                }
              >
                <option value="">None</option>
                {(warehousesQuery.data?.data ?? []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default POS terminal" htmlFor="dpos">
              <Select
                id="dpos"
                value={String(ops.defaultPosId ?? "")}
                onChange={(e) =>
                  setNested(
                    "operationalSettings",
                    "defaultPosId",
                    e.target.value || undefined,
                  )
                }
              >
                <option value="">None</option>
                {(posQuery.data?.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default cash register" htmlFor="dcash">
              <Select
                id="dcash"
                value={String(ops.defaultCashRegisterId ?? "")}
                onChange={(e) =>
                  setNested(
                    "operationalSettings",
                    "defaultCashRegisterId",
                    e.target.value || undefined,
                  )
                }
              >
                <option value="">None</option>
                {(cashQuery.data?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-6">
            <Field
              label="Business days"
              hint="Select which weekdays this site operates."
            >
              <div className="flex flex-wrap gap-2">
                {BUSINESS_DAYS.map((d) => {
                  const active = businessDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? businessDays.filter((x) => x !== d.value)
                          : [...businessDays, d.value].sort((a, b) => a - b);
                        setNested("operationalSettings", "businessDays", next);
                      }}
                      className={cn(
                        "h-9 min-w-11 rounded-[var(--radius-sm)] border px-3 text-sm font-medium transition-colors",
                        active
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </SettingsPanel>
      ) : null}

      {tab === "members" ? <OrgMembersPanel organizationId={id} /> : null}

      {tab === "settings" ? (
        <SettingsPanel
          maxWidth="xl"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setSettingsDraft({})}
                disabled={Object.keys(settingsDraft).length === 0}
              >
                Reset
              </Button>
              <Button
                disabled={
                  saveSettings.isPending || Object.keys(settingsDraft).length === 0
                }
                onClick={() => saveSettings.mutate()}
              >
                Save overrides
              </Button>
            </>
          }
        >
          <SectionTitle
            title="Organization overrides"
            description="Only overrideable tenant settings appear here. Empty means inherit tenant default."
          />
          <Field label="Namespace" htmlFor="sns">
            <Select
              id="sns"
              value={settingsNs}
              onChange={(e) => setSettingsNs(e.target.value)}
            >
              {ORG_SETTING_NS.map((ns) => (
                <option key={ns.id} value={ns.id}>
                  {ns.label}
                </option>
              ))}
            </Select>
          </Field>

          {settingsQuery.isLoading ? (
            <Skeleton className="mt-4 h-40 w-full" />
          ) : settingsKeys.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No overrideable keys in this namespace.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {settingsKeys.map((key) => {
                const meta = resolveFieldMeta(settingsNs, key, settingsValues[key]);
                if (meta.control === "hidden") return null;
                const current = settingsValues[key];
                const display =
                  key in settingsDraft
                    ? settingsDraft[key]
                    : displayToDraft(meta, current);
                return (
                  <div
                    key={key}
                    className={meta.fullWidth ? "sm:col-span-2" : undefined}
                  >
                    <SettingFieldControl
                      meta={meta}
                      value={display}
                      onChange={(next) =>
                        setSettingsDraft((d) => ({ ...d, [key]: next }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </SettingsPanel>
      ) : null}

      {tab === "warehouses" ? (
        <SettingsPanel maxWidth="xl">
          <SectionTitle
            title="Warehouses"
            description="Inventory locations owned by this organization."
          />
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Code"
              value={whCode}
              onChange={(e) => setWhCode(e.target.value)}
            />
            <Input
              placeholder="Name"
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
            />
            <Button
              disabled={!whCode || !whName || createWh.isPending}
              onClick={() => createWh.mutate()}
            >
              Add
            </Button>
          </div>
          <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)]">
            {(warehousesQuery.data?.data ?? []).length === 0 ? (
              <li className="px-3 py-6 text-sm text-[var(--text-muted)]">
                No warehouses yet.
              </li>
            ) : (
              (warehousesQuery.data?.data ?? []).map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                >
                  <span className="font-medium">{w.name}</span>
                  <span className="font-[var(--font-amount)] text-sm text-[var(--text-muted)]">
                    {w.code}
                  </span>
                  <Badge tone={w.status === "ACTIVE" ? "success" : "default"}>
                    {w.status}
                  </Badge>
                  {w.isDefault ? <Badge tone="info">Default</Badge> : null}
                </li>
              ))
            )}
          </ul>
        </SettingsPanel>
      ) : null}

      {tab === "pos" ? (
        <SettingsPanel maxWidth="xl">
          <SectionTitle
            title="POS terminals"
            description="Link terminals to a warehouse when relevant."
          />
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              placeholder="Code"
              value={posCode}
              onChange={(e) => setPosCode(e.target.value)}
            />
            <Input
              placeholder="Name"
              value={posName}
              onChange={(e) => setPosName(e.target.value)}
            />
            <Select
              value={posWarehouseId}
              onChange={(e) => setPosWarehouseId(e.target.value)}
            >
              <option value="">Warehouse (optional)</option>
              {(warehousesQuery.data?.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <Button
              disabled={!posCode || !posName || createPos.isPending}
              onClick={() => createPos.mutate()}
            >
              Add
            </Button>
          </div>
          <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)]">
            {(posQuery.data?.data ?? []).length === 0 ? (
              <li className="px-3 py-6 text-sm text-[var(--text-muted)]">
                No POS terminals yet.
              </li>
            ) : (
              (posQuery.data?.data ?? []).map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-[var(--text-muted)]">{p.code}</span>
                  <Badge>{p.status}</Badge>
                </li>
              ))
            )}
          </ul>
        </SettingsPanel>
      ) : null}

      {tab === "workflows" ? (
        <SettingsPanel maxWidth="xl">
          <SectionTitle
            title="Approval workflows"
            description="Shell definitions for purchase, discount, stock and refund approvals."
          />
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Input
              placeholder="Code"
              value={wfCode}
              onChange={(e) => setWfCode(e.target.value)}
            />
            <Input
              placeholder="Name"
              value={wfName}
              onChange={(e) => setWfName(e.target.value)}
            />
            <Select value={wfKind} onChange={(e) => setWfKind(e.target.value)}>
              {[
                "PURCHASE_APPROVAL",
                "DISCOUNT_APPROVAL",
                "STOCK_ADJUSTMENT_APPROVAL",
                "REFUND_APPROVAL",
                "EXPENSE_APPROVAL",
                "LEAVE_APPROVAL",
                "CUSTOM",
              ].map((k) => (
                <option key={k} value={k}>
                  {k.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <Button
              disabled={!wfCode || !wfName || createWf.isPending}
              onClick={() => createWf.mutate()}
            >
              Add
            </Button>
          </div>
          <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)]">
            {(workflowsQuery.data?.data ?? []).length === 0 ? (
              <li className="px-3 py-6 text-sm text-[var(--text-muted)]">
                No workflows yet.
              </li>
            ) : (
              (workflowsQuery.data?.data ?? []).map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                >
                  <span className="font-medium">{w.name}</span>
                  <Badge tone="info">{w.kind.replaceAll("_", " ")}</Badge>
                  <Badge>{w.status}</Badge>
                </li>
              ))
            )}
          </ul>
        </SettingsPanel>
      ) : null}

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend organization?"
        description="Users will lose access to this organization until reactivated."
        confirmLabel="Suspend"
        tone="danger"
        onConfirm={() => suspend.mutate()}
      />
    </div>
  );
}

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <PermissionGate permission="organizations:read">
      <PageHeader
        title="Organization"
        description="Manage hierarchy, members, and organization settings."
        back={{
          href: "/identity/organizations",
          label: "Retour aux organisations",
        }}
        crumbs={[
          { label: "Identity", href: "/" },
          { label: "Organizations", href: "/identity/organizations" },
          { label: "Detail" },
        ]}
      />
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <OrganizationDetailFromSearch id={id} />
      </Suspense>
    </PermissionGate>
  );
}

function OrganizationDetailFromSearch({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "general";
  return <OrganizationDetail id={id} initialTab={initialTab} />;
}
