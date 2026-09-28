"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { SettingsStages } from "@/components/settings/settings-stages";
import { PermissionGate } from "@/components/shell/permission-gate";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi, type SecurityPolicies } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import Link from "next/link";

const MFA_POLICIES = [
  { value: "optional", label: "Optional" },
  { value: "required_for_admins", label: "Required for admins" },
  { value: "required_for_sensitive_ops", label: "Required for sensitive ops" },
  { value: "required", label: "Required for everyone" },
] as const;

const MFA_METHODS = ["totp", "webauthn", "sms", "email"] as const;
const SSO_OPTIONS = [
  "google",
  "microsoft",
  "apple",
  "ldap",
  "ad",
  "saml",
  "oidc",
] as const;

type FormState = {
  mfaPolicy: string;
  mfaMethods: string[];
  sessionLifetimeMinutes: string;
  idleTimeoutMinutes: string;
  maxSessionDurationMinutes: string;
  rememberMe: boolean;
  sessionConcurrency: string;
  failedLoginThreshold: string;
  accountLockoutMinutes: string;
  passwordMinLength: string;
  passwordRequireUpper: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  ipAllowlist: string;
  ipDenylist: string;
  countryRestrictions: string;
  suspiciousLoginDetection: boolean;
  ssoProviders: string[];
};

function fromPolicies(p: SecurityPolicies): FormState {
  const methods = Array.isArray(p.mfaMethods)
    ? (p.mfaMethods as string[])
    : ["totp"];
  const sso = Array.isArray(p.ssoProviders)
    ? (p.ssoProviders as string[])
    : [];
  const list = (v: unknown) =>
    Array.isArray(v) ? (v as string[]).join(", ") : "";
  return {
    mfaPolicy: typeof p.mfaPolicy === "string" ? p.mfaPolicy : "optional",
    mfaMethods: methods,
    sessionLifetimeMinutes: String(p.sessionLifetimeMinutes ?? 480),
    idleTimeoutMinutes: String(p.idleTimeoutMinutes ?? 30),
    maxSessionDurationMinutes: String(p.maxSessionDurationMinutes ?? 1440),
    rememberMe: p.rememberMe !== false,
    sessionConcurrency: String(p.sessionConcurrency ?? 5),
    failedLoginThreshold: String(p.failedLoginThreshold ?? 5),
    accountLockoutMinutes: String(p.accountLockoutMinutes ?? 15),
    passwordMinLength: String(p.passwordMinLength ?? 12),
    passwordRequireUpper: p.passwordRequireUpper !== false,
    passwordRequireNumber: p.passwordRequireNumber !== false,
    passwordRequireSymbol: p.passwordRequireSymbol !== false,
    ipAllowlist: list(p.ipAllowlist),
    ipDenylist: list(p.ipDenylist),
    countryRestrictions: list(p.countryRestrictions),
    suspiciousLoginDetection: p.suspiciousLoginDetection !== false,
    ssoProviders: sso,
  };
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function AuthenticationPanel() {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(null);

  const policiesQuery = useQuery({
    queryKey: idk.security(),
    queryFn: async () => api.security.getPolicies(),
  });

  useEffect(() => {
    const p = policiesQuery.data?.data;
    if (p && !form) setForm(fromPolicies(p));
  }, [policiesQuery.data, form]);

  const save = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("Form not ready");
      return api.security.patchPolicies({
        mfaPolicy: form.mfaPolicy,
        mfaMethods: form.mfaMethods,
        sessionLifetimeMinutes: Number(form.sessionLifetimeMinutes),
        idleTimeoutMinutes: Number(form.idleTimeoutMinutes),
        maxSessionDurationMinutes: Number(form.maxSessionDurationMinutes),
        rememberMe: form.rememberMe,
        sessionConcurrency: Number(form.sessionConcurrency),
        failedLoginThreshold: Number(form.failedLoginThreshold),
        accountLockoutMinutes: Number(form.accountLockoutMinutes),
        passwordMinLength: Number(form.passwordMinLength),
        passwordRequireUpper: form.passwordRequireUpper,
        passwordRequireNumber: form.passwordRequireNumber,
        passwordRequireSymbol: form.passwordRequireSymbol,
        ipAllowlist: parseCsv(form.ipAllowlist),
        ipDenylist: parseCsv(form.ipDenylist),
        countryRestrictions: parseCsv(form.countryRestrictions).map((c) =>
          c.toUpperCase(),
        ),
        suspiciousLoginDetection: form.suspiciousLoginDetection,
        ssoProviders: form.ssoProviders,
      });
    },
    onSuccess: async () => {
      toast.push({ title: "Authentication policies saved", tone: "success" });
      setForm(null);
      await qc.invalidateQueries({ queryKey: idk.security() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <>
      <PageHeader
        title="Authentication"
        description="Tenant MFA, sessions, lockout, password rules, and SSO policy. Credentials remain in Keycloak."
      />
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Realm brokers:{" "}
        <Link className="underline" href="/settings/identity-providers">
          Identity providers
        </Link>
        . Personal identity:{" "}
        <Link className="underline" href="/settings/security">
          My identity &amp; security
        </Link>
        .
      </p>

      {policiesQuery.isLoading || !form ? (
        <Skeleton className="h-64 w-full" />
      ) : policiesQuery.isError ? (
        <ErrorState
          title="Couldn't load policies"
          description={
            policiesQuery.error instanceof Error
              ? policiesQuery.error.message
              : "Try again."
          }
          onRetry={() => void policiesQuery.refetch()}
        />
      ) : (
        <SettingsStages
          footer={
            <PermissionGate permission="security:update">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Savingâ€¦" : "Save policies"}
              </Button>
            </PermissionGate>
          }
          stages={[
            {
              id: "mfa",
              label: "MFA",
              description: "Policy and allowed methods. Credentials remain in Keycloak.",
              content: (
                <>
                  <Field label="MFA policy">
                    <Select
                      value={form.mfaPolicy}
                      onChange={(e) => set("mfaPolicy", e.target.value)}
                    >
                      {MFA_POLICIES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div>
                    <p className="mb-[var(--space-2)] type-sm font-medium text-[var(--text-secondary)]">
                      Allowed methods
                    </p>
                    <div className="flex flex-wrap gap-[var(--space-3)] type-sm">
                      {MFA_METHODS.map((m) => (
                        <label key={m} className="flex items-center gap-[var(--space-2)]">
                          <input
                            type="checkbox"
                            className="atlas-checkbox"
                            checked={form.mfaMethods.includes(m)}
                            onChange={() =>
                              set("mfaMethods", toggleIn(form.mfaMethods, m))
                            }
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ),
            },
            {
              id: "sessions",
              label: "Sessions",
              description: "Lifetime, idle timeout, and concurrency.",
              content: (
                <>
                  <Field label="Session lifetime (minutes)">
                    <Input
                      type="number"
                      value={form.sessionLifetimeMinutes}
                      onChange={(e) =>
                        set("sessionLifetimeMinutes", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Idle timeout (minutes)">
                    <Input
                      type="number"
                      value={form.idleTimeoutMinutes}
                      onChange={(e) => set("idleTimeoutMinutes", e.target.value)}
                    />
                  </Field>
                  <Field label="Max session duration (minutes)">
                    <Input
                      type="number"
                      value={form.maxSessionDurationMinutes}
                      onChange={(e) =>
                        set("maxSessionDurationMinutes", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Max concurrent sessions">
                    <Input
                      type="number"
                      value={form.sessionConcurrency}
                      onChange={(e) => set("sessionConcurrency", e.target.value)}
                    />
                  </Field>
                  <label className="flex items-center gap-[var(--space-2)] type-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      className="atlas-checkbox"
                      checked={form.rememberMe}
                      onChange={(e) => set("rememberMe", e.target.checked)}
                    />
                    Allow remember-me
                  </label>
                </>
              ),
            },
            {
              id: "lockout",
              label: "Lockout",
              description: "Failed logins and suspicious activity.",
              content: (
                <>
                  <Field label="Failed login threshold">
                    <Input
                      type="number"
                      value={form.failedLoginThreshold}
                      onChange={(e) =>
                        set("failedLoginThreshold", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Account lockout (minutes)">
                    <Input
                      type="number"
                      value={form.accountLockoutMinutes}
                      onChange={(e) =>
                        set("accountLockoutMinutes", e.target.value)
                      }
                    />
                  </Field>
                  <label className="flex items-center gap-[var(--space-2)] type-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      className="atlas-checkbox"
                      checked={form.suspiciousLoginDetection}
                      onChange={(e) =>
                        set("suspiciousLoginDetection", e.target.checked)
                      }
                    />
                    Suspicious login detection (inbox / history signals)
                  </label>
                </>
              ),
            },
            {
              id: "password",
              label: "Password",
              description: "Minimum length and complexity.",
              content: (
                <>
                  <Field label="Minimum length">
                    <Input
                      type="number"
                      value={form.passwordMinLength}
                      onChange={(e) => set("passwordMinLength", e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-col gap-[var(--space-2)] type-sm">
                    {(
                      [
                        ["passwordRequireUpper", "Require uppercase"],
                        ["passwordRequireNumber", "Require number"],
                        ["passwordRequireSymbol", "Require symbol"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-[var(--space-2)]">
                        <input
                          type="checkbox"
                          className="atlas-checkbox"
                          checked={form[key]}
                          onChange={(e) => set(key, e.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </>
              ),
            },
            {
              id: "network",
              label: "Network",
              description: "IP allow/deny lists and country restrictions.",
              columns: 1,
              content: (
                <>
                  <Field label="IP allowlist (comma-separated)">
                    <Input
                      value={form.ipAllowlist}
                      onChange={(e) => set("ipAllowlist", e.target.value)}
                      placeholder="203.0.113.0/24"
                    />
                  </Field>
                  <Field label="IP denylist (comma-separated)">
                    <Input
                      value={form.ipDenylist}
                      onChange={(e) => set("ipDenylist", e.target.value)}
                    />
                  </Field>
                  <Field label="Country restrictions (ISO-2, comma-separated)">
                    <Input
                      value={form.countryRestrictions}
                      onChange={(e) => set("countryRestrictions", e.target.value)}
                      placeholder="BI, FR, KE"
                    />
                  </Field>
                </>
              ),
            },
            {
              id: "sso",
              label: "SSO",
              description:
                "Declares which IdP families the tenant expects. Configure instances in Identity providers.",
              columns: 1,
              content: (
                <div className="flex flex-wrap gap-[var(--space-3)] type-sm">
                  {SSO_OPTIONS.map((p) => (
                    <label key={p} className="flex items-center gap-[var(--space-2)]">
                      <input
                        type="checkbox"
                        className="atlas-checkbox"
                        checked={form.ssoProviders.includes(p)}
                        onChange={() =>
                          set("ssoProviders", toggleIn(form.ssoProviders, p))
                        }
                      />
                      {p}
                    </label>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </>
  );
}

export default function AuthenticationPage() {
  return (
    <PermissionGate permission="security:read">
      <AuthenticationPanel />
    </PermissionGate>
  );
}
