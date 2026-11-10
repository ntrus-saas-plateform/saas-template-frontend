"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function unwrap<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function asRows(payload: unknown): Record<string, unknown>[] {
  const inner = unwrap<unknown>(payload);
  if (Array.isArray(inner)) return inner as Record<string, unknown>[];
  const items = (inner as { items?: unknown[] } | undefined)?.items;
  return (items as Record<string, unknown>[] | undefined) ?? [];
}

export default function EdgeBillingPortalPage() {
  const { permissions, isLoading } = useEdgePlatform();
  const [accountId, setAccountId] = useState("");

  const canRead = useMemo(
    () =>
      hasEdgePermission(permissions, "platform:billing:portal:read") ||
      hasEdgePermission(permissions, "platform:billing:accounts:read"),
    [permissions],
  );

  const accountsQuery = useQuery({
    queryKey: ["edge", "billing", "accounts", "portal"],
    queryFn: () => edgeApi.listBillingAccounts(),
    enabled: canRead,
  });

  const portalQuery = useQuery({
    queryKey: ["edge", "billing", "portal", accountId],
    queryFn: () => edgeApi.getBillingPortal(accountId),
    enabled: Boolean(accountId) && canRead,
  });

  if (isLoading) return <EdgeLoadingState label="Loading portal…" />;
  if (!canRead) return <EdgeForbiddenState />;

  const accounts = asRows(accountsQuery.data);
  const portal = unwrap<Record<string, unknown>>(portalQuery.data);
  const invoices = asRows(portal?.invoices);
  const payments = asRows(portal?.payments);
  const methods = asRows(portal?.paymentMethods);
  const credits = asRows(portal?.creditNotes);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Customer billing experience
        </p>
        <h1 className="font-display text-3xl tracking-tight">Billing Portal</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Account-scoped invoices, payments, credits, and payment method tokens.
          Pending intents are never shown as collected cash.
        </p>
        <p className="text-sm">
          <Link
            href="/edge/billing"
            className="text-primary underline-offset-2 hover:underline"
          >
            ← Back to Billing Operations
          </Link>
        </p>
      </header>

      <EdgePermissionGate permission="platform:billing:portal:read">
        <label className="grid max-w-md gap-1 text-sm">
          Billing account
          <select
            className={fieldControlClass}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Select account…</option>
            {accounts.map((a) => (
              <option key={String(a.id)} value={String(a.id)}>
                {String(a.accountNumber ?? a.id)} · {String(a.currency)}
              </option>
            ))}
          </select>
        </label>

        {!accountId ? (
          <EdgeEmptyState
            title="Choose a billing account"
            description="Portal data is scoped to one billing account."
          />
        ) : portalQuery.isLoading ? (
          <EdgeLoadingState label="Loading portal…" />
        ) : portalQuery.isError ? (
          <EdgeErrorState
            description={
              (portalQuery.error as EdgeApiError)?.message ?? "Portal failed"
            }
            onRetry={() => void portalQuery.refetch()}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Open balance
                </p>
                <p className="mt-2 font-display text-3xl tabular-nums">
                  {String(portal?.openBalance ?? "0")}{" "}
                  <span className="text-base">{String(portal?.currency)}</span>
                </p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Invoices
                </p>
                <p className="mt-2 font-display text-3xl tabular-nums">
                  {invoices.length}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Payment methods
                </p>
                <p className="mt-2 font-display text-3xl tabular-nums">
                  {methods.length}
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-medium">Invoices</h2>
              {!invoices.length ? (
                <EdgeEmptyState
                  title="No invoices"
                  description="Issued invoices for this account will appear here."
                />
              ) : (
                <ul className="divide-y rounded-xl border border-border/70 text-sm">
                  {invoices.map((inv) => (
                    <li
                      key={String(inv.id)}
                      className="flex justify-between gap-2 p-3"
                    >
                      <span>
                        {String(inv.invoiceNumber)} · due{" "}
                        {String(inv.amountDue)} {String(inv.currency)}
                      </span>
                      <Badge>{String(inv.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium">Payments</h2>
              {!payments.length ? (
                <EdgeEmptyState
                  title="No payments"
                  description="Succeeded and pending intents are listed with honest statuses."
                />
              ) : (
                <ul className="divide-y rounded-xl border border-border/70 text-sm">
                  {payments.map((p) => (
                    <li
                      key={String(p.id)}
                      className="flex justify-between gap-2 p-3"
                    >
                      <span>
                        {String(p.amount)} {String(p.currency)} ·{" "}
                        {String(p.provider)}
                      </span>
                      <Badge>{String(p.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium">Credit notes</h2>
              {!credits.length ? (
                <EdgeEmptyState
                  title="No credit notes"
                  description="Issued credit notes reduce balances without inventing refunds."
                />
              ) : (
                <ul className="divide-y rounded-xl border border-border/70 text-sm">
                  {credits.map((c) => (
                    <li key={String(c.id)} className="p-3">
                      {String(c.creditNoteNumber)} · {String(c.total)}{" "}
                      {String(c.currency)} · {String(c.status)}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium">Payment methods (tokenized)</h2>
              {!methods.length ? (
                <EdgeEmptyState
                  title="No payment methods"
                  description="Only provider tokens are stored — never PAN/CVV."
                />
              ) : (
                <ul className="divide-y rounded-xl border border-border/70 text-sm">
                  {methods.map((m) => (
                    <li key={String(m.id)} className="p-3">
                      {String(m.methodType)} · {String(m.brand ?? "—")} ·••••{" "}
                      {String(m.last4 ?? "----")} · {String(m.status)}
                      {m.isDefault ? " · default" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </EdgePermissionGate>
    </div>
  );
}
