"use client";

import { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { SettingsPanel } from "@/components/shell/settings-panel";
import { PermissionGate } from "@/components/shell/permission-gate";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions, type RowActionItem } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { Ban, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import {
  identityApi,
  type SessionInfo,
  type UserApiToken,
  type UserCredential,
  type UserDevice,
  type UserLoginHistoryEntry,
} from "@/lib/api/identity";
import { useDateTimeFormat } from "@/lib/format/use-datetime";
import { subscribeWebPush } from "@/lib/push/web-push-subscribe";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { pushActivity } from "@/components/shell/activity-center";
import {
  buildKeycloakActionUrl,
  type KeycloakAction,
} from "@/lib/keycloak/pkce-action";

const TABS = [
  { id: "account", label: "Identity" },
  { id: "sessions", label: "Sessions" },
  { id: "devices", label: "Devices" },
  { id: "history", label: "Login history" },
  { id: "tokens", label: "API tokens" },
];

function SecurityPanel() {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatDateTime: fmt } = useDateTimeFormat();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTabState] = useState(
    tabFromUrl && TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : "account",
  );
  const [webPushPending, setWebPushPending] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.some((x) => x.id === t) && t !== tab) {
      setTabState(t);
    }
  }, [searchParams, tab]);

  const setTab = useCallback(
    (id: string) => {
      setTabState(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      router.replace(`/settings/security?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [credDeleteId, setCredDeleteId] = useState<string | null>(null);
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);
  const [deviceRemoveId, setDeviceRemoveId] = useState<string | null>(null);
  const [tokenRevokeId, setTokenRevokeId] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenScopes, setTokenScopes] = useState("users:read");
  const [tokenPlaintext, setTokenPlaintext] = useState<string | null>(null);
  const [pushName, setPushName] = useState("This browser");
  const [pushToken, setPushToken] = useState("");
  const [pushPlatform, setPushPlatform] = useState("webpush");
  const [phoneE164, setPhoneE164] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/settings/security?tab=account`
      : undefined;

  const startKeycloakUrl = useCallback(
    (url: string | undefined, label: string, mode: "same-tab" | "new-tab" = "same-tab") => {
      if (!url) {
        toast.push({
          title: `${label} unavailable`,
          description:
            "URL missing. Check that Keycloak is running and the platform-web redirect URI is allowed.",
          tone: "warning",
        });
        return;
      }
      if (mode === "new-tab") {
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win) {
          toast.push({
            title: "Popup blocked",
            description: "Allow popups for this site, or continue in this tab.",
            tone: "warning",
          });
          window.location.assign(url);
        }
        return;
      }
      toast.push({
        title: "Opening Keycloak…",
        description: label,
        tone: "info",
      });
      // Same-tab is required for reliable kc_action + redirect_uri round-trips.
      window.location.assign(url);
    },
    [toast],
  );

  /** platform-web requires S256 PKCE — build auth URLs in-browser, never use bare kc_action links. */
  const startKeycloakAction = useCallback(
    async (action: KeycloakAction, label: string) => {
      const redirect =
        redirectUri ?? `${window.location.origin}/settings/security?tab=account`;
      try {
        const url = await buildKeycloakActionUrl(action, redirect);
        startKeycloakUrl(url, label, "same-tab");
      } catch (err) {
        toast.push({
          title: `${label} unavailable`,
          description:
            err instanceof Error
              ? err.message
              : "Could not start Keycloak action (check NEXT_PUBLIC_KEYCLOAK_*).",
          tone: "danger",
        });
      }
    },
    [redirectUri, startKeycloakUrl, toast],
  );

  const identityQuery = useQuery({
    queryKey: idk.myIdentity(),
    queryFn: async () => api.users.identity.get(redirectUri),
    enabled: tab === "account",
  });

  // Strip leftover OIDC callback params after Keycloak kc_action redirect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hasOAuthNoise =
      params.has("code") || params.has("state") || params.has("session_state");
    if (!hasOAuthNoise) return;
    params.delete("code");
    params.delete("state");
    params.delete("session_state");
    params.delete("iss");
    if (!params.get("tab")) params.set("tab", "account");
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
    void qc.invalidateQueries({ queryKey: idk.myIdentity() });
    toast.push({
      title: "Back from Keycloak",
      description: "Refreshing your MFA and credentials…",
      tone: "info",
    });
  }, [qc, idk, toast]);

  useEffect(() => {
    const stored = identityQuery.data?.data?.verification?.phoneE164;
    if (stored && !phoneE164) setPhoneE164(stored);
  }, [identityQuery.data, phoneE164]);

  const sessionsQuery = useQuery({
    queryKey: idk.sessions(),
    queryFn: async () => api.sessions.list(1, 50),
    enabled: tab === "sessions",
  });

  const devicesQuery = useQuery({
    queryKey: idk.devices(),
    queryFn: async () => api.users.devices.list(true),
    enabled: tab === "devices",
  });

  const historyQuery = useQuery({
    queryKey: idk.loginHistory(),
    queryFn: async () => api.users.loginHistory.list(1, 50),
    enabled: tab === "history",
  });

  const tokensQuery = useQuery({
    queryKey: idk.apiTokens(),
    queryFn: async () => api.users.apiTokens.list(),
    enabled: tab === "tokens",
  });

  const identity = identityQuery.data?.data;
  const overview = identity
    ? {
        enabled: identity.mfa.enabled,
        methods: identity.mfa.methods,
        credentials: identity.credentials,
        urls: identity.urls,
        keycloakAvailable: identity.keycloakAvailable,
      }
    : undefined;
  const mfaCredentials = useMemo(
    () =>
      (overview?.credentials ?? []).filter((c) => {
        const type = (c.type || "").toLowerCase();
        return (
          type === "otp" ||
          type === "totp" ||
          type.includes("webauthn") ||
          type.includes("passkey") ||
          type.includes("recovery")
        );
      }),
    [overview?.credentials],
  );

  // After Keycloak enrollment (new tab), refresh MFA/credentials when the user returns.
  useEffect(() => {
    if (tab !== "account") return;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void qc.invalidateQueries({ queryKey: idk.myIdentity() });
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [tab, qc, idk]);

  const sessionsPayload = sessionsQuery.data?.data;
  const sessions = sessionsPayload?.sessions ?? [];

  const revoke = useMutation({
    mutationFn: (sessionId: string) => api.sessions.revoke(sessionId),
    onSuccess: async () => {
      setRevokeId(null);
      toast.push({ title: "Session revoked", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.sessions() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const revokeAll = useMutation({
    mutationFn: () => api.sessions.revokeAll(),
    onSuccess: async () => {
      setRevokeAllOpen(false);
      toast.push({ title: "All sessions revoked", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.sessions() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const deleteCred = useMutation({
    mutationFn: (id: string) => api.users.security.deleteCredential(id),
    onSuccess: async () => {
      setCredDeleteId(null);
      toast.push({ title: "Credential removed", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.myIdentity() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const unlinkIdentity = useMutation({
    mutationFn: (provider: string) => api.users.identity.unlink(provider),
    onSuccess: async () => {
      setUnlinkProvider(null);
      toast.push({ title: "Identity unlinked", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.myIdentity() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const verifyEmail = useMutation({
    mutationFn: () => api.users.identity.verifyEmail(),
    onSuccess: () =>
      toast.push({ title: "Verification email sent", tone: "success" }),
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const resetPassword = useMutation({
    mutationFn: () => api.users.identity.resetPassword(),
    onSuccess: () =>
      toast.push({ title: "Password reset email sent", tone: "success" }),
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const sendPhoneOtp = useMutation({
    mutationFn: () => api.users.identity.sendPhoneOtp(phoneE164.trim()),
    onSuccess: (res) => {
      setPhoneOtpSent(true);
      toast.push({
        title: res.data?.dryRun
          ? "OTP generated (WhatsApp dry-run — check API logs)"
          : "Verification code sent on WhatsApp",
        tone: "success",
      });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const verifyPhoneOtp = useMutation({
    mutationFn: () =>
      api.users.identity.verifyPhoneOtp(phoneE164.trim(), phoneOtp.trim()),
    onSuccess: async () => {
      setPhoneOtp("");
      setPhoneOtpSent(false);
      toast.push({ title: "Phone verified", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.myIdentity() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const trustDevice = useMutation({
    mutationFn: ({ id, trusted }: { id: string; trusted: boolean }) =>
      api.users.devices.trust(id, trusted),
    onSuccess: async () => {
      toast.push({ title: "Device updated", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.devices() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const removeDevice = useMutation({
    mutationFn: (id: string) => api.users.devices.remove(id),
    onSuccess: async () => {
      setDeviceRemoveId(null);
      toast.push({ title: "Device removed", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.devices() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const enrollPush = useMutation({
    mutationFn: () =>
      api.users.devices.enrollPush({
        deviceName: pushName.trim() || "Push device",
        pushToken: pushToken.trim(),
        pushPlatform,
      }),
    onSuccess: async () => {
      toast.push({ title: "Push device enrolled", tone: "success" });
      pushActivity("Push device enrolled", pushName.trim() || pushPlatform);
      setPushToken("");
      await qc.invalidateQueries({ queryKey: idk.devices() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const clearPush = useMutation({
    mutationFn: (id: string) => api.users.devices.clearPush(id),
    onSuccess: async () => {
      toast.push({ title: "Push cleared", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.devices() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const createToken = useMutation({
    mutationFn: () =>
      api.users.apiTokens.create({
        name: tokenName.trim(),
        scopes: tokenScopes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: async (res) => {
      setTokenPlaintext(res.data?.plaintext ?? null);
      setTokenName("");
      toast.push({ title: "API token created", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.apiTokens() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const revokeToken = useMutation({
    mutationFn: (id: string) => api.users.apiTokens.revoke(id),
    onSuccess: async () => {
      setTokenRevokeId(null);
      toast.push({ title: "Token revoked", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.apiTokens() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const devicesPayload = devicesQuery.data?.data;
  const devices = devicesPayload?.devices ?? [];
  const history = historyQuery.data?.data ?? [];
  const tokens = tokensQuery.data?.data?.tokens ?? [];

  const sessionColumns = useMemo<DataTableColumn<SessionInfo>[]>(
    () => [
      {
        id: "device",
        header: "Device",
        cell: (row) => (
          <div>
            <p className="font-medium">
              {[row.browser, row.os].filter(Boolean).join(" / ") ||
                row.device ||
                "Unknown device"}
            </p>
            <p className="font-mono text-[11px] text-[var(--text-muted)]">
            {row.id}
            </p>
          </div>
        ),
      },
      {
        id: "ip",
        header: "IP",
        cell: (row) => row.ipAddress || "—",
      },
      {
        id: "last",
        header: "Last active",
        cell: (row) =>
          fmt(row.lastAccess || row.lastAccessedAt || null),
      },
      {
        id: "started",
        header: "Started",
        cell: (row) => fmt(row.started || row.createdAt || null),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) => (
          <RowActions
            onDelete={() => setRevokeId(row.id)}
            deleteLabel="Révoquer"
          />
        ),
      },
    ],
    [fmt],
  );

  const credentialColumns = useMemo<DataTableColumn<UserCredential>[]>(
    () => [
      {
        id: "type",
        header: "Type",
        cell: (row) => <Badge>{row.type}</Badge>,
      },
      {
        id: "label",
        header: "Label",
        cell: (row) => row.userLabel || "—",
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => fmt(row.createdDate || null),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) => {
          const isPassword = (row.type || "").toLowerCase() === "password";
          return (
            <RowActions
              onDelete={() => setCredDeleteId(row.id)}
              deleteLabel="Supprimer"
              deleteDisabled={isPassword}
            />
          );
        },
      },
    ],
    [fmt],
  );

  const deviceColumns = useMemo<DataTableColumn<UserDevice>[]>(
    () => [
      {
        id: "device",
        header: "Device",
        cell: (row) => (
          <div>
            <p className="font-medium">
              {row.deviceName ||
                [row.browser, row.os].filter(Boolean).join(" / ") ||
                "Unknown device"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {[row.browser, row.os, row.platform].filter(Boolean).join(" · ") ||
                "—"}
            </p>
          </div>
        ),
      },
      {
        id: "ip",
        header: "Last IP",
        cell: (row) => row.lastIp || "—",
      },
      {
        id: "seen",
        header: "Last seen",
        cell: (row) => fmt(row.lastSeenAt),
      },
      {
        id: "trusted",
        header: "Trusted",
        cell: (row) => (
          <Badge tone={row.trusted ? "success" : "default"}>
            {row.trusted ? "Trusted" : "Untrusted"}
          </Badge>
        ),
      },
      {
        id: "push",
        header: "Push",
        cell: (row) =>
          row.pushToken || row.pushEnrolledAt ? (
            <Badge tone="info">{row.pushPlatform || "enrolled"}</Badge>
          ) : (
            "—"
          ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) => {
          const items: RowActionItem[] = [
            {
              id: "trust",
              label: row.trusted ? "Ne plus faire confiance" : "Faire confiance",
              disabled: trustDevice.isPending,
              onClick: () =>
                trustDevice.mutate({ id: row.id, trusted: !row.trusted }),
              icon: row.trusted ? (
                <ShieldOff className="size-[var(--icon-sm)]" aria-hidden />
              ) : (
                <ShieldCheck className="size-[var(--icon-sm)]" aria-hidden />
              ),
            },
          ];
          if (row.pushToken) {
            items.push({
              id: "clear-push",
              label: "Effacer le push",
              disabled: clearPush.isPending,
              onClick: () => clearPush.mutate(row.id),
              icon: <Ban className="size-[var(--icon-sm)]" aria-hidden />,
            });
          }
          items.push({
            id: "remove",
            label: "Supprimer",
            tone: "danger",
            separatorBefore: true,
            onClick: () => setDeviceRemoveId(row.id),
            icon: <Trash2 className="size-[var(--icon-sm)]" aria-hidden />,
          });
          return <RowActions items={items} />;
        },
      },
    ],
    [trustDevice, clearPush, fmt],
  );

  const historyColumns = useMemo<DataTableColumn<UserLoginHistoryEntry>[]>(
    () => [
      {
        id: "when",
        header: "When",
        cell: (row) => fmt(row.createdAt),
      },
      {
        id: "client",
        header: "Client",
        cell: (row) =>
          [row.browser, row.os, row.device].filter(Boolean).join(" · ") || "—",
      },
      {
        id: "ip",
        header: "IP",
        cell: (row) => row.ip || "—",
      },
      {
        id: "result",
        header: "Result",
        cell: (row) => (
          <Badge tone={row.success ? "success" : "danger"}>
            {row.success ? "OK" : "Failed"} · {row.eventType}
          </Badge>
        ),
      },
    ],
    [fmt],
  );

  const tokenColumns = useMemo<DataTableColumn<UserApiToken>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="font-mono text-[11px] text-[var(--text-muted)]">
              {row.tokenPrefix}…
            </p>
          </div>
        ),
      },
      {
        id: "scopes",
        header: "Scopes",
        cell: (row) =>
          row.scopes?.length ? row.scopes.join(", ") : "—",
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => fmt(row.createdAt),
      },
      {
        id: "expires",
        header: "Expires",
        cell: (row) =>
          row.expiresAt ? fmt(row.expiresAt) : "Never",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge tone={row.revokedAt ? "danger" : "success"}>
            {row.revokedAt ? "Revoked" : "Active"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) =>
          row.revokedAt ? null : (
            <RowActions
              onDelete={() => setTokenRevokeId(row.id)}
              deleteLabel="Révoquer"
            />
          ),
      },
    ],
    [fmt],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-hidden">
      <div className="shrink-0">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "account" ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {identityQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : identityQuery.isError ? (
            <ErrorState
              title="Couldn't load identity"
              description={
                identityQuery.error instanceof Error
                  ? identityQuery.error.message
                  : "Try again."
              }
              onRetry={() => void identityQuery.refetch()}
            />
          ) : (
            <>
              <SettingsPanel maxWidth="full">
                <h3 className="mb-2 text-sm font-semibold">Account status</h3>
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <Badge tone={identity?.enabled !== false ? "success" : "danger"}>
                    {identity?.enabled !== false ? "Enabled" : "Disabled / locked"}
                  </Badge>
                  <Badge
                    tone={
                      identity?.verification.emailVerified
                        ? "success"
                        : "warning"
                    }
                  >
                    Email{" "}
                    {identity?.verification.emailVerified
                      ? "verified"
                      : "unverified"}
                  </Badge>
                  <Badge
                    tone={
                      identity?.verification.mfaEnrolled ? "success" : "warning"
                    }
                  >
                    MFA{" "}
                    {identity?.verification.mfaEnrolled
                      ? "enrolled"
                      : "not enrolled"}
                  </Badge>
                  <Badge
                    tone={
                      identity?.verification.phoneVerified
                        ? "success"
                        : "default"
                    }
                  >
                    Phone{" "}
                    {identity?.verification.phoneVerified
                      ? "verified"
                      : "unverified"}
                  </Badge>
                </div>
                {!identity?.verification.emailVerified ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verifyEmail.isPending}
                    onClick={() => verifyEmail.mutate()}
                  >
                    Send verification email
                  </Button>
                ) : null}
              </SettingsPanel>

              <SettingsPanel maxWidth="full">
                <h3 className="mb-2 text-sm font-semibold">Phone verification (KYC)</h3>
                <p className="mb-3 text-sm text-[var(--text-muted)]">
                  Choose your country code, enter the number, then receive a
                  WhatsApp code to confirm.
                  {identity?.verification.phoneVerified && identity?.verification.phoneE164
                    ? ` Currently verified: ${identity.verification.phoneE164}.`
                    : ""}
                </p>
                <div className="grid max-w-md gap-3">
                  <Field label="Phone" htmlFor="kyc-phone">
                    <Input
                      id="kyc-phone"
                      type="tel"
                      value={phoneE164}
                      onChange={(e) => {
                        setPhoneE164(e.target.value);
                        setPhoneOtpSent(false);
                      }}
                      autoComplete="tel"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        sendPhoneOtp.isPending || phoneE164.trim().length < 8
                      }
                      onClick={() => sendPhoneOtp.mutate()}
                    >
                      {sendPhoneOtp.isPending ? "Sending…" : "Send WhatsApp code"}
                    </Button>
                  </div>
                  {phoneOtpSent ? (
                    <>
                      <Field label="Verification code">
                        <Input
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          placeholder="6-digit code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                        />
                      </Field>
                      <Button
                        size="sm"
                        disabled={
                          verifyPhoneOtp.isPending || phoneOtp.trim().length < 6
                        }
                        onClick={() => verifyPhoneOtp.mutate()}
                      >
                        {verifyPhoneOtp.isPending ? "Verifying…" : "Verify phone"}
                      </Button>
                    </>
                  ) : null}
                </div>
              </SettingsPanel>

              <SettingsPanel maxWidth="full">
                <h3 className="mb-2 text-sm font-semibold">Password & account</h3>
                <p className="mb-3 text-sm text-[var(--text-muted)]">
                  Password changes and recovery codes run in Keycloak (Identity
                  SoT). You can open the console or request a reset email.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      void startKeycloakAction(
                        "UPDATE_PASSWORD",
                        "Change password",
                      )
                    }
                  >
                    Change password
                  </Button>
                  <Button
                    variant="outline"
                    disabled={resetPassword.isPending}
                    onClick={() => resetPassword.mutate()}
                  >
                    Email password reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void startKeycloakAction(
                        "CONFIGURE_RECOVERY_AUTHN_CODES",
                        "Recovery codes",
                      )
                    }
                  >
                    Recovery codes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      startKeycloakUrl(
                        overview?.urls.accountConsoleUrl,
                        "Account console",
                        "new-tab",
                      )
                    }
                    disabled={!overview?.urls.accountConsoleUrl}
                  >
                    Open Account Console
                  </Button>
                </div>
                {!overview?.keycloakAvailable ? (
                  <p className="mt-3 text-sm text-amber-700">
                    Keycloak admin is unavailable — enrollment links may still
                    work for signed-in users.
                  </p>
                ) : null}
          </SettingsPanel>

              <SettingsPanel maxWidth="full">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Multi-factor authentication
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Status:{" "}
                      {overview?.enabled || mfaCredentials.length > 0 ? (
                        <Badge tone="success">Enrolled</Badge>
                      ) : (
                        <Badge tone="warning">Not enrolled</Badge>
                      )}{" "}
                      {(overview?.methods ?? []).length > 0
                        ? (overview?.methods ?? []).join(", ")
                        : mfaCredentials.length > 0
                          ? mfaCredentials.map((c) => c.type).join(", ")
                          : "no methods"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        void startKeycloakAction(
                          "CONFIGURE_TOTP",
                          "Set up authenticator",
                        )
                      }
                    >
                      Set up authenticator
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        void startKeycloakAction(
                          "webauthn-register",
                          "Add passkey",
                        )
                      }
                    >
                      Add passkey
                    </Button>
                  </div>
                </div>
                {mfaCredentials.length === 0 ? (
                  <EmptyState
                    title="No MFA methods yet"
                    description="Enroll an authenticator app or passkey. Your password is managed in Account status above."
                  />
                ) : (
                  <DataTable
                    fill={false}
                    columns={credentialColumns}
                    rows={mfaCredentials}
                  />
                )}
              </SettingsPanel>

              <SettingsPanel maxWidth="full">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Linked identities</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Local + federated IdPs (Google, Microsoft, SSO…). Link
                      new providers in Keycloak Account.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      startKeycloakUrl(
                        overview?.urls.linkedAccountsUrl ||
                          overview?.urls.accountConsoleUrl,
                        "Linked accounts",
                        "new-tab",
                      )
                    }
                  >
                    Manage linked accounts
                  </Button>
                </div>
                {(identity?.linkedIdentities ?? []).length === 0 ? (
                  <EmptyState
                    title="No linked identities"
                    description="Local password or an IdP will appear here."
                  />
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {(identity?.linkedIdentities ?? []).map((link) => (
                      <li
                        key={`${link.provider}:${link.providerUserId}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <div>
                          <p className="font-medium">
                            {link.provider}{" "}
                            {link.primary ? (
                              <Badge tone="info">Primary</Badge>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {link.username} · {link.providerUserId}
                          </p>
                        </div>
                        {link.provider !== "local" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnlinkProvider(link.provider)}
                          >
                            Unlink
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </SettingsPanel>
            </>
          )}
        </div>
      ) : null}

      {tab === "sessions" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-3)] overflow-y-auto">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeAllOpen(true)}>
              Revoke all / logout everywhere
            </Button>
          </div>
          {sessionsQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="No sessions"
              description={
                sessionsPayload?.keycloakAvailable === false
                  ? "Keycloak admin unavailable."
                  : "No active Keycloak sessions found."
              }
            />
          ) : (
            <DataTable fill={false} columns={sessionColumns} rows={sessions} />
          )}
        </div>
      ) : null}

      {tab === "devices" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-3)] overflow-y-auto">
          <p className="text-sm text-[var(--text-muted)]">
            Soft device registry synced from Keycloak sessions. Trust is stored
            on the platform; revoking a session still happens under Sessions.
          </p>
          <SettingsPanel maxWidth="full">
            <h3 className="mb-2 text-sm font-semibold">Enroll push device</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Device name">
                <Input
                  value={pushName}
                  onChange={(e) => setPushName(e.target.value)}
                />
              </Field>
              <Field label="Push platform">
                <Select
                  value={pushPlatform}
                  onChange={(e) => setPushPlatform(e.target.value)}
                >
                  <option value="webpush">Web Push</option>
                  <option value="fcm">FCM</option>
                  <option value="apns">APNs</option>
                </Select>
              </Field>
              <Field label="Push token">
                <Input
                  value={pushToken}
                  onChange={(e) => setPushToken(e.target.value)}
                  placeholder="Subscription / device token"
                />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={webPushPending || enrollPush.isPending}
                onClick={() => {
                  setWebPushPending(true);
                  void subscribeWebPush()
                    .then((token) => {
                      setPushPlatform("webpush");
                      setPushToken(token);
                      toast.push({
                        title: "Browser subscribed — click Enroll push",
                        tone: "success",
                      });
                    })
                    .catch((e: Error) =>
                      toast.push({ title: e.message, tone: "danger" }),
                    )
                    .finally(() => setWebPushPending(false));
                }}
              >
                {webPushPending ? "Subscribing…" : "Subscribe this browser"}
              </Button>
              <Button
                disabled={
                  pushToken.trim().length < 8 || enrollPush.isPending
                }
                onClick={() => enrollPush.mutate()}
              >
                {enrollPush.isPending ? "Enrolling…" : "Enroll push"}
              </Button>
            </div>
          </SettingsPanel>
          {devicesQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : devices.length === 0 ? (
            <EmptyState
              title="No devices"
              description={
                devicesPayload?.keycloakAvailable === false
                  ? "Keycloak admin unavailable — open Sessions after Keycloak is up, or wait for a sync."
                  : "No devices recorded yet. Active sessions will appear here after sync."
              }
            />
          ) : (
            <DataTable fill={false} columns={deviceColumns} rows={devices} />
          )}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-3)] overflow-y-auto">
          {historyQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : history.length === 0 ? (
            <EmptyState
              title="No login history"
              description="Successful shell boots record a login (deduped per session)."
            />
          ) : (
            <>
              <p className="text-sm text-[var(--text-muted)]">
                Failed attempts:{" "}
                <span className="font-medium text-[var(--fg)]">
                  {history.filter((h) => !h.success).length}
                </span>{" "}
                · Successful:{" "}
                <span className="font-medium text-[var(--fg)]">
                  {history.filter((h) => h.success).length}
                </span>
                . Tenant lockout thresholds are under{" "}
                <a className="underline" href="/settings/authentication">
                  Authentication
                </a>
                .
              </p>
              <DataTable fill={false} columns={historyColumns} rows={history} />
            </>
          )}
        </div>
      ) : null}

      {tab === "tokens" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-3)] overflow-y-auto">
          <SettingsPanel maxWidth="full">
            <h3 className="mb-2 text-sm font-semibold">Create personal API token</h3>
            <p className="mb-3 text-sm text-[var(--text-muted)]">
              The full token is shown once. Store it securely; only the prefix is
              kept afterwards.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Name">
                <Input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="CI bot"
                />
              </Field>
              <Field
                label="Scopes"
                hint="Comma-separated permissions; empty = full membership"
              >
                <Input
                  value={tokenScopes}
                  onChange={(e) => setTokenScopes(e.target.value)}
                  placeholder="users:read, organizations:read"
                  className="min-w-[16rem]"
                />
              </Field>
                    <Button
                disabled={!tokenName.trim() || createToken.isPending}
                onClick={() => createToken.mutate()}
                    >
                {createToken.isPending ? "Creating…" : "Create token"}
                    </Button>
                  </div>
            {tokenPlaintext ? (
              <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Copy now — shown once
                </p>
                <code className="break-all text-sm">{tokenPlaintext}</code>
              </div>
            ) : null}
          </SettingsPanel>
          {tokensQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : tokens.length === 0 ? (
                <EmptyState
              title="No API tokens"
              description="Create a token for scripts or integrations."
            />
          ) : (
            <DataTable fill={false} columns={tokenColumns} rows={tokens} />
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(unlinkProvider)}
        onOpenChange={(o) => {
          if (!o) setUnlinkProvider(null);
        }}
        title="Unlink identity?"
        description="You will no longer be able to sign in with this provider until you link it again."
        confirmLabel="Unlink"
        tone="danger"
        loading={unlinkIdentity.isPending}
        onConfirm={() => {
          if (unlinkProvider) unlinkIdentity.mutate(unlinkProvider);
        }}
      />
      <ConfirmDialog
        open={Boolean(revokeId)}
        onOpenChange={(o) => {
          if (!o) setRevokeId(null);
        }}
        title="Revoke session?"
        description="The device will need to sign in again."
        confirmLabel="Revoke"
        tone="danger"
        loading={revoke.isPending}
        onConfirm={() => {
          if (revokeId) revoke.mutate(revokeId);
        }}
      />
      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title="Revoke all sessions?"
        description="Signs you out everywhere, including this browser after token denylist."
        confirmLabel="Revoke all"
        tone="danger"
        loading={revokeAll.isPending}
        onConfirm={() => revokeAll.mutate()}
      />
      <ConfirmDialog
        open={Boolean(credDeleteId)}
        onOpenChange={(o) => {
          if (!o) setCredDeleteId(null);
        }}
        title="Remove credential?"
        description="You may lose MFA access if this is your only factor."
        confirmLabel="Remove"
        tone="danger"
        loading={deleteCred.isPending}
        onConfirm={() => {
          if (credDeleteId) deleteCred.mutate(credDeleteId);
        }}
      />
      <ConfirmDialog
        open={Boolean(deviceRemoveId)}
        onOpenChange={(o) => {
          if (!o) setDeviceRemoveId(null);
        }}
        title="Remove device?"
        description="Removes this entry from your soft device list. Active Keycloak sessions are unchanged."
        confirmLabel="Remove"
        tone="danger"
        loading={removeDevice.isPending}
        onConfirm={() => {
          if (deviceRemoveId) removeDevice.mutate(deviceRemoveId);
        }}
      />
      <ConfirmDialog
        open={Boolean(tokenRevokeId)}
        onOpenChange={(o) => {
          if (!o) setTokenRevokeId(null);
        }}
        title="Revoke API token?"
        description="Integrations using this token will stop working immediately."
        confirmLabel="Revoke"
        tone="danger"
        loading={revokeToken.isPending}
        onConfirm={() => {
          if (tokenRevokeId) revokeToken.mutate(tokenRevokeId);
        }}
      />
    </div>
  );
}

export default function SecurityPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Identity & security"
        description="Your Keycloak identity: password, MFA, passkeys, linked IdPs, sessions, and devices. Tenant auth policies live under Authentication."
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
        <FillSection>
          <Suspense fallback={<Skeleton className="min-h-0 w-full flex-1" />}>
            <SecurityPanel />
          </Suspense>
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
