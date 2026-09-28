"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import { SettingsStages } from "@/components/settings/settings-stages";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { usePreferences } from "@/providers/preferences-provider";
import { useSessionContext } from "@/providers/session-context-provider";
import { useToast } from "@/components/feedback/toast";
import { pushActivity } from "@/components/shell/activity-center";

function PreferencesForm() {
  const client = useApiClient();
  const { context, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const prefs = usePreferences();
  const { sessionOverrides, setSessionOverride, clearSessionOverrides } =
    useSessionContext();
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const sessionTheme =
    typeof sessionOverrides["ui.theme"] === "string"
      ? String(sessionOverrides["ui.theme"])
      : "";
  const sessionLocale =
    typeof sessionOverrides["localization.locale"] === "string"
      ? String(sessionOverrides["localization.locale"])
      : "";
  const sessionDensity =
    typeof sessionOverrides["ui.density"] === "string"
      ? String(sessionOverrides["ui.density"])
      : "";
  const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

  const query = useQuery({
    queryKey: idk.preferences(),
    queryFn: async () => api.users.preferences.get(),
  });

  const settings = query.data?.data?.settings ?? {};

  useEffect(() => {
    setDraft({});
  }, [query.dataUpdatedAt]);

  const get = (key: string, fallback: string = "") => {
    if (draft[key] !== undefined) return String(draft[key]);
    const v = settings[key];
    if (v === undefined || v === null) return fallback;
    return String(v);
  };

  const set = (key: string, value: unknown) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(draft)) {
        if (
          k.endsWith(".enabled") ||
          k.includes("sidebarCollapsed") ||
          k.includes("reducedMotion") ||
          k.includes("keyboardShortcuts")
        ) {
          payload[k] = v === true || v === "true";
        } else if (k === "tables.pageSize") {
          payload[k] = Number(v);
        } else if (
          k === "defaults.organizationId" ||
          k === "defaults.landingPage" ||
          k === "defaults.applicationId"
        ) {
          payload[k] = v === "" || v === null ? null : v;
        } else {
          payload[k] = v;
        }
      }
      return api.users.preferences.patch(payload);
    },
    onSuccess: async (res) => {
      // Persist USER base from API; SessionContextProvider merge keeps SESSION on top (§55).
      const next = res.data?.settings ?? {};
      const locale = next["localization.locale"];
      if (locale === "en" || locale === "fr") prefs.setLocale(locale);
      if (typeof next["ui.sidebarCollapsed"] === "boolean") {
        prefs.setSidebarCollapsed(next["ui.sidebarCollapsed"]);
      }
      if (typeof next["ui.theme"] === "string") {
        prefs.setTheme(next["ui.theme"] as "system" | "light" | "dark");
      }
      if (typeof next["ui.density"] === "string") {
        prefs.setDensity(next["ui.density"] as "comfortable" | "compact");
      }
      const motion =
        typeof next["accessibility.reducedMotion"] === "boolean"
          ? next["accessibility.reducedMotion"]
          : typeof next["ui.reducedMotion"] === "boolean"
            ? next["ui.reducedMotion"]
            : undefined;
      if (typeof motion === "boolean") {
        prefs.setReducedMotion(motion);
      }
      const tz = next["localization.timezone"];
      if (typeof tz === "string" && tz.length > 0) {
        prefs.setTimezone(tz);
      }
      const timeFormat = next["localization.timeFormat"];
      if (timeFormat === "12h" || timeFormat === "24h") {
        prefs.setHour12(timeFormat === "12h");
      }
      pushActivity("Preferences saved", `${Object.keys(draft).length} field(s)`);
      toast.push({ title: "Preferences saved", tone: "success" });
      setDraft({});
      await qc.invalidateQueries({ queryKey: idk.preferences() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  if (query.isLoading) return <Skeleton className="h-48 w-full max-w-3xl" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load preferences"
        description={
          query.error instanceof Error ? query.error.message : "Try again."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const orgOptions = [
    { value: "", label: "None" },
    ...organizations.map((o) => ({ value: o.id, label: o.name })),
  ];

  const saveFooter = (
    <PermissionGate permission="users:update">
      <Button
        disabled={Object.keys(draft).length === 0 || save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Saving…" : "Save preferences"}
      </Button>
    </PermissionGate>
  );

  return (
    <SettingsStages
      footer={saveFooter}
      stages={[
        {
          id: "language",
          label: "Language",
          description: "Locale, timezone, and how dates and money are displayed.",
          content: (
            <>
          <SettingFieldControl
            meta={{
              key: "localization.locale",
              label: "Language",
              control: "select",
              options: [
                { value: "en", label: "English" },
                { value: "fr", label: "Français" },
              ],
            }}
            value={String(get("localization.locale", "en"))}
            onChange={(v) => set("localization.locale", v)}
          />
          <SettingFieldControl
            meta={{
              key: "localization.timezone",
              label: "Timezone",
              control: "text",
            }}
            value={get("localization.timezone", "UTC")}
            onChange={(v) => set("localization.timezone", v)}
          />
          <SettingFieldControl
            meta={{
              key: "localization.dateFormat",
              label: "Date format",
              control: "text",
            }}
            value={get("localization.dateFormat", "yyyy-MM-dd")}
            onChange={(v) => set("localization.dateFormat", v)}
          />
          <SettingFieldControl
            meta={{
              key: "localization.timeFormat",
              label: "Time format",
              control: "select",
              options: [
                { value: "24h", label: "24-hour" },
                { value: "12h", label: "12-hour" },
              ],
            }}
            value={get("localization.timeFormat", "24h")}
            onChange={(v) => set("localization.timeFormat", v)}
          />
          <SettingFieldControl
            meta={{
              key: "currency.display",
              label: "Currency display",
              control: "select",
              options: [
                { value: "symbol", label: "Symbol" },
                { value: "code", label: "Code" },
                { value: "name", label: "Name" },
              ],
            }}
            value={get("currency.display", "symbol")}
            onChange={(v) => set("currency.display", v)}
          />
            </>
          ),
        },
        {
          id: "appearance",
          label: "Appearance",
          description: "Theme and layout density for this account.",
          content: (
            <>
          <SettingFieldControl
            meta={{
              key: "ui.theme",
              label: "Theme",
              control: "select",
              options: [
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
            }}
            value={get("ui.theme", "system")}
            onChange={(v) => set("ui.theme", v)}
          />
          <SettingFieldControl
            meta={{
              key: "ui.density",
              label: "Density",
              control: "select",
              options: [
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ],
            }}
            value={get("ui.density", "comfortable")}
            onChange={(v) => set("ui.density", v)}
          />
          <SettingFieldControl
            meta={{
              key: "ui.sidebarCollapsed",
              label: "Collapse sidebar by default",
              control: "boolean",
            }}
            value={get("ui.sidebarCollapsed", "false")}
            onChange={(v) => set("ui.sidebarCollapsed", v)}
          />
            </>
          ),
        },
        {
          id: "session",
          label: "This tab",
          description:
            "Ephemeral overlays for this tab. They stay in sessionStorage and never write to saved preferences.",
          content: (
            <>
            <SettingFieldControl
              meta={{
                key: "session.locale",
                label: "Session language",
                control: "select",
                options: [
                  { value: "", label: "Use saved preference" },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                ],
              }}
              value={sessionLocale}
              onChange={(v) =>
                setSessionOverride(
                  "localization.locale",
                  v === "" ? null : v,
                )
              }
            />
            <SettingFieldControl
              meta={{
                key: "session.theme",
                label: "Session theme",
                control: "select",
                options: [
                  { value: "", label: "Use saved preference" },
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ],
              }}
              value={sessionTheme}
              onChange={(v) =>
                setSessionOverride("ui.theme", v === "" ? null : v)
              }
            />
            <SettingFieldControl
              meta={{
                key: "session.density",
                label: "Session density",
                control: "select",
                options: [
                  { value: "", label: "Use saved preference" },
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ],
              }}
              value={sessionDensity}
              onChange={(v) =>
                setSessionOverride("ui.density", v === "" ? null : v)
              }
            />
          {hasSessionOverrides ? (
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => clearSessionOverrides()}
              >
                Clear session overlays
              </Button>
            </div>
          ) : null}
            </>
          ),
        },
        {
          id: "defaults",
          label: "Defaults",
          description: "Landing page, default organization, and motion preferences.",
          content: (
            <>
          <SettingFieldControl
            meta={{
              key: "defaults.organizationId",
              label: "Default organization",
              control: "select",
              options: orgOptions,
            }}
            value={get("defaults.organizationId", "")}
            onChange={(v) => set("defaults.organizationId", v)}
          />
          <SettingFieldControl
            meta={{
              key: "defaults.landingPage",
              label: "Default landing page",
              control: "text",
            }}
            value={get("defaults.landingPage", "/")}
            onChange={(v) => set("defaults.landingPage", v)}
          />
          <SettingFieldControl
            meta={{
              key: "defaults.applicationId",
              label: "Default application",
              control: "text",
            }}
            value={get("defaults.applicationId", "")}
            onChange={(v) => set("defaults.applicationId", v)}
          />
          <SettingFieldControl
            meta={{
              key: "tables.pageSize",
              label: "Default table page size",
              control: "number",
            }}
            value={get("tables.pageSize", "20")}
            onChange={(v) => set("tables.pageSize", v)}
          />
          <SettingFieldControl
            meta={{
              key: "accessibility.reducedMotion",
              label: "Reduced motion",
              control: "boolean",
            }}
            value={get("accessibility.reducedMotion", "false")}
            onChange={(v) => set("accessibility.reducedMotion", v)}
          />
          <SettingFieldControl
            meta={{
              key: "accessibility.keyboardShortcuts",
              label: "Keyboard shortcuts",
              control: "boolean",
            }}
            value={get("accessibility.keyboardShortcuts", "true")}
            onChange={(v) => set("accessibility.keyboardShortcuts", v)}
          />
            </>
          ),
        },
        {
          id: "notifications",
          label: "Notifications",
          description: "Which channels can reach you, and how often.",
          content: (
            <>
            {(
              [
                ["notifications.inApp.enabled", "In-app"],
                ["notifications.email.enabled", "Email"],
                ["notifications.sms.enabled", "SMS"],
                ["notifications.push.enabled", "Push"],
                ["notifications.whatsapp.enabled", "WhatsApp"],
              ] as const
            ).map(([key, label]) => (
              <SettingFieldControl
                key={key}
                meta={{ key, label, control: "boolean" }}
                value={get(key, "true")}
                onChange={(v) => set(key, v)}
              />
            ))}
            <SettingFieldControl
              meta={{
                key: "notifications.digest",
                label: "Digest",
                control: "select",
                options: [
                  { value: "off", label: "Off" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ],
              }}
              value={get("notifications.digest", "off")}
              onChange={(v) => set("notifications.digest", v)}
            />
            <SettingFieldControl
              meta={{
                key: "notifications.frequency",
                label: "Frequency",
                control: "select",
                options: [
                  { value: "realtime", label: "Realtime" },
                  { value: "hourly", label: "Hourly" },
                  { value: "daily", label: "Daily" },
                ],
              }}
              value={get("notifications.frequency", "realtime")}
              onChange={(v) => set("notifications.frequency", v)}
            />
            </>
          ),
        },
      ]}
    />
  );
}

export default function PreferencesPage() {
  return (
    <div>
      <PageHeader
        title="Preferences"
        description="Language, display, defaults, tables, accessibility, and notification channels."
      />
      <PermissionGate
        permission="users:read"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need users:read."
          />
        }
      >
        <PreferencesForm />
      </PermissionGate>
    </div>
  );
}
