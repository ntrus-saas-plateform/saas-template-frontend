"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { RoleMultiSelect } from "@/components/identity/role-multi-select";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function invitationEmailStatus(delivery: {
  sent: boolean;
  provider?: string;
  error?: string | null;
} | null) {
  if (!delivery) return null;
  if (delivery.sent) {
    const via =
      delivery.provider === "resend"
        ? "Resend"
        : delivery.provider === "smtp"
          ? "SMTP"
          : delivery.provider;
    return `Invitation email sent via ${via}.`;
  }
  if (!delivery.provider || delivery.provider === "none") {
    return "Email delivery is not configured. Copy the token or accept link and send it yourself.";
  }
  return delivery.error
    ? `Email could not be sent: ${delivery.error}. Copy the token instead.`
    : "Email could not be sent. Copy the token instead.";
}

export function InviteUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, organizations: platformOrgs } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState(
    context?.organizationId ?? "",
  );
  const [roles, setRoles] = useState<string[]>(["viewer"]);
  const [expiresInHours, setExpiresInHours] = useState("72");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<{
    sent: boolean;
    provider?: string;
    error?: string | null;
  } | null>(null);
  const [copied, setCopied] = useState<"token" | "link" | null>(null);

  useEffect(() => {
    if (!organizationId && context?.organizationId) {
      setOrganizationId(context.organizationId);
    }
  }, [context?.organizationId, organizationId]);

  const orgsQuery = useQuery({
    queryKey: [...idk.organizations(), "invite"],
    queryFn: async () =>
      api.organizations.list(1, 200, { scope: "tenant", tree: true }),
    enabled: open,
  });

  const rolesQuery = useQuery({
    queryKey: idk.roles(),
    queryFn: async () => api.roles.list(1, 100),
    enabled: open,
  });

  const orgOptions = useMemo(() => {
    const fromApi = orgsQuery.data?.data ?? [];
    if (fromApi.length > 0) {
      return fromApi.map((org) => ({
        value: org.id,
        label: org.slug ? `${org.name} · ${org.slug}` : org.name,
      }));
    }
    return platformOrgs.map((org) => ({
      value: org.id,
      label: org.slug ? `${org.name} · ${org.slug}` : org.name,
    }));
  }, [orgsQuery.data?.data, platformOrgs]);

  const reset = () => {
    setCreatedToken(null);
    setEmailDelivery(null);
    setCopied(null);
    setEmail("");
    setRoles(["viewer"]);
    setExpiresInHours("72");
    setOrganizationId(context?.organizationId ?? "");
  };

  const create = useMutation({
    mutationFn: () =>
      api.invitations.create({
        organizationId,
        email: email.trim(),
        roles,
        expiresInHours: Number(expiresInHours) || 72,
      }),
    onSuccess: async (res) => {
      const token = res.data?.token ?? null;
      setCreatedToken(token);
      setEmailDelivery({
        sent: Boolean(res.data?.emailSent),
        provider:
          typeof res.data?.emailProvider === "string"
            ? res.data.emailProvider
            : undefined,
        error:
          typeof res.data?.emailError === "string" ? res.data.emailError : null,
      });
      await qc.invalidateQueries({ queryKey: idk.invitations() });
      await qc.invalidateQueries({ queryKey: idk.users() });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="Invite user"
      description="Send an invitation by email to join an organization."
      footer={
        createdToken ? (
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !isValidEmail(email) ||
                !organizationId ||
                roles.length === 0 ||
                create.isPending
              }
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Sending…" : "Send invitation"}
            </Button>
          </>
        )
      }
    >
      {createdToken ? (
        <div className="space-y-3">
          <p className="type-sm text-[var(--text-secondary)]">
            {invitationEmailStatus(emailDelivery)}
          </p>
          <p className="type-sm text-[var(--text-secondary)]">
            Copy this single-use token now — it will not be shown again.
          </p>
          <code className="block break-all rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-[var(--space-3)] type-xs text-[var(--text-primary)]">
            {createdToken}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(createdToken);
                setCopied("token");
              }}
            >
              {copied === "token" ? "Copied" : "Copy token"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const url = `${window.location.origin}/invite?token=${encodeURIComponent(createdToken)}`;
                await navigator.clipboard.writeText(url);
                setCopied("link");
              }}
            >
              {copied === "link" ? "Copied" : "Copy accept link"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--space-4)]">
          <Field
            label="Email"
            htmlFor="directory-invite-email"
            required
            hint="The invitee must sign in with this address to accept."
          >
            <Input
              id="directory-invite-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Organization" htmlFor="directory-invite-org" required>
            <SearchableSelect
              id="directory-invite-org"
              value={organizationId}
              options={orgOptions}
              placeholder="Search organization…"
              onChange={setOrganizationId}
            />
          </Field>
          <Field
            label="Roles"
            hint="Select at least one role. Viewer is the default."
          >
            <RoleMultiSelect
              roles={rolesQuery.data?.data ?? []}
              selected={roles}
              onChange={setRoles}
            />
          </Field>
          <Field label="Expires in" htmlFor="directory-invite-expiry">
            <Select
              id="directory-invite-expiry"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
            >
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
              <option value="72">72 hours</option>
              <option value="168">7 days</option>
              <option value="336">14 days</option>
            </Select>
          </Field>
          {create.isError ? (
            <p className="type-sm text-[var(--danger)]">
              {create.error instanceof Error
                ? create.error.message
                : "Could not create invitation"}
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
