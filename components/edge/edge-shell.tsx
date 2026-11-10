"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings2,
  Shield,
  Store,
  Tags,
  Megaphone,
  Handshake,
  CreditCard,
  Gauge,
  RefreshCw,
  ServerCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/components/edge/workspace-switcher";
import { cn } from "@/lib/utils";
import { useEdgeSession } from "@/providers/edge-session-provider";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const PLATFORM_NAV: NavItem[] = [
  { href: "/edge", label: "Portfolio", icon: LayoutDashboard },
  { href: "/edge/catalog", label: "Catalog", icon: Package },
  { href: "/edge/commercial", label: "Commercial", icon: Tags },
  { href: "/edge/marketing", label: "Marketing", icon: Megaphone },
  { href: "/edge/sales", label: "Sales", icon: Handshake },
  {
    href: "/edge/subscriptions",
    label: "Subscriptions",
    icon: RefreshCw,
  },
  {
    href: "/edge/billing",
    label: "Billing",
    icon: CreditCard,
  },
  {
    href: "/edge/provisioning-requests",
    label: "Provisioning Ops",
    icon: ServerCog,
  },
  {
    href: "/edge/provisioning/registry",
    label: "Registry Management",
    icon: Boxes,
  },
  {
    href: "/edge/provisioning/capacity",
    label: "Placement & Capacity",
    icon: Gauge,
  },
  { href: "/edge/markets", label: "Markets", icon: Store },
  { href: "/edge/readiness", label: "Readiness", icon: CheckCircle2 },
  { href: "/edge/verticals", label: "Verticals", icon: Building2 },
  { href: "/edge/administrators", label: "Administrators", icon: Users },
  { href: "/edge/security", label: "Security", icon: Shield },
  { href: "/edge/audit", label: "Audit", icon: ClipboardList },
  {
    href: "/edge/tenants",
    label: "Tenant Management",
    icon: Building2,
    disabled: true,
  },
];

function workspaceNav(activeVerticalId: string | null): NavItem[] {
  const items: NavItem[] = [
    { href: "/edge/workspace", label: "Overview", icon: LayoutDashboard },
    {
      href: "/edge/workspace/configuration",
      label: "Configuration",
      icon: Settings2,
    },
    {
      href: "/edge/workspace/administration",
      label: "Administration",
      icon: Users,
    },
    { href: "/edge/security", label: "Security", icon: Shield },
  ];
  if (activeVerticalId) {
    items.splice(1, 0, {
      href: `/edge/verticals/${activeVerticalId}/products`,
      label: "Products",
      icon: Package,
    });
    items.splice(2, 0, {
      href: "/edge/commercial",
      label: "Commercial",
      icon: Tags,
    });
  }
  return items;
}

function navClass(active: boolean, disabled?: boolean) {
  return cn(
    "flex min-h-[var(--touch-min)] items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] type-sm transition-colors",
    disabled && "cursor-not-allowed opacity-45",
    !disabled &&
      (active
        ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)]"
        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"),
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-[var(--space-2)]">
      <p className="px-[var(--space-3)] type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {title}
      </p>
      <nav className="flex flex-col gap-0.5" aria-label={title}>
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            !item.disabled &&
            (item.href === "/edge"
              ? pathname === "/edge"
              : pathname === item.href || pathname.startsWith(`${item.href}/`));
          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={navClass(false, true)}
                title="Coming soon"
              >
                <Icon className="size-[var(--icon-md)] shrink-0" aria-hidden />
                <span>{item.label}</span>
              </span>
            );
          }
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={navClass(active)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-[var(--icon-md)] shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function EdgeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const auth = useEdgeSession();
  const { activeVerticalId, workspaces } = useEdgePlatform();
  const hasWorkspace = Boolean(activeVerticalId) || workspaces.length > 0;

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border)] px-[var(--space-4)] py-[var(--space-5)]">
          <p className="type-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Console
          </p>
          <p
            className="mt-1 text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-signin-display), sans-serif" }}
          >
            Okapi Edge
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-[var(--space-6)] overflow-y-auto p-[var(--space-4)]">
          <NavSection
            title="Platform"
            items={PLATFORM_NAV}
            pathname={pathname}
          />
          {hasWorkspace ? (
            <NavSection
              title="Workspace"
              items={workspaceNav(activeVerticalId)}
              pathname={pathname}
            />
          ) : null}
        </div>
        <div className="space-y-[var(--space-3)] border-t border-[var(--border)] p-[var(--space-4)]">
          <WorkspaceSwitcher className="w-full justify-between" />
          <div className="flex items-center justify-between gap-[var(--space-2)]">
            <span className="truncate type-xs text-[var(--text-muted)]">
              {auth.user?.name ?? auth.user?.email ?? "Administrator"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              onClick={() => void auth.logout()}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-5)] py-[var(--space-3)]">
          <p className="type-sm text-[var(--text-secondary)]">
            Edge administration · isolated from ERP
          </p>
          <WorkspaceSwitcher align="end" />
        </header>
        <main id="main-content" className="flex-1 p-[var(--space-6)]">
          {children}
        </main>
      </div>
    </div>
  );
}
