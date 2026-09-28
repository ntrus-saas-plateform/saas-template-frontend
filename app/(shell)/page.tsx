"use client";

import Link from "next/link";
import {
  AlertTriangle,
  KeyRound,
  Shield,
  Users,
} from "lucide-react";
import { coreIdentityLinks } from "@/applications/core/manifest";
import { PageHeader } from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/providers/platform-provider";
import { useAppContext } from "@/shell/context/app-context";
import { hasPermission } from "@/lib/access/permissions";

export default function DashboardPage() {
  const { context, capabilities, organizations } = usePlatform();
  const { apps } = useAppContext();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];

  const activeApps = apps.filter((a) => a.status === "ACTIVE");
  const unavailableApps = apps.filter((a) => a.status === "UNAVAILABLE");

  const identityLinks = coreIdentityLinks.filter(
    (link) => !link.permission || hasPermission(perms, link.permission),
  );

  const modules = Object.entries(capabilities?.modules ?? {});
  const enabledModules = modules.filter(([, enabled]) => enabled);
  const disabledModules = modules.filter(([, enabled]) => !enabled);

  const attention: string[] = [];
  if (!context?.organizationId) {
    attention.push(
      "No active organization — select one from the organization switcher.",
    );
  }
  for (const app of unavailableApps.filter((a) => a.id !== "admin")) {
    attention.push(`${app.name} is unavailable for your current permissions.`);
  }

  return (
    <div>
      <PageHeader
        title="Core"
        description="Workspace overview and identity administration for this organization."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold">Session</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">User</dt>
              <dd className="font-medium">{context?.username ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Organization</dt>
              <dd className="font-medium">
                {organizations.find((o) => o.id === context?.organizationId)
                  ?.name ??
                  organizations[0]?.name ??
                  "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Plan</dt>
              <dd className="font-medium">{capabilities?.plan?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--text-muted)]">Permissions</dt>
              <dd className="tabular-nums font-medium">{perms.length}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-[var(--warning)]" />
            Needs attention
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {attention.length ? (
              attention.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No issues detected for this session.</li>
            )}
          </ul>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <div className="mt-3 flex flex-col gap-2">
            <PermissionGate permission="organizations:read">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/identity/organizations">
                  <Users className="size-4" />
                  Open organizations
                </Link>
              </Button>
            </PermissionGate>
            {activeApps
              .filter((a) => a.id !== "core")
              .slice(0, 3)
              .map((app) => (
                <Button
                  key={app.id}
                  asChild
                  variant="ghost"
                  className="justify-start"
                >
                  <Link href={app.href}>{app.name}</Link>
                </Button>
              ))}
          </div>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 md:col-span-2 xl:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="size-4 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-semibold">Identity</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Access, membership, and roles for this workspace
              </p>
            </div>
          </div>
          {identityLinks.length ? (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {identityLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="flex h-full flex-col gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)]/60 px-3 py-3 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                      <KeyRound className="size-3.5 text-[var(--text-muted)]" />
                      {link.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {link.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No identity tools available for your permissions.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 md:col-span-2 xl:col-span-3">
          <h2 className="mb-3 text-sm font-semibold">Module entitlements</h2>
          {modules.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                  Enabled ({enabledModules.length})
                </p>
                {enabledModules.length ? (
                  <ul className="space-y-1 text-sm">
                    {enabledModules.map(([name]) => (
                      <li key={name} className="text-[var(--text-primary)]">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">None</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
                  Not enabled ({disabledModules.length})
                </p>
                {disabledModules.length ? (
                  <ul className="space-y-1 text-sm">
                    {disabledModules.map(([name]) => (
                      <li key={name} className="text-[var(--text-muted)]">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">None</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Capabilities not loaded yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
