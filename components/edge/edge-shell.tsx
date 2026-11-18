"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  Cable,
  CheckCircle2,
  ChevronDown,
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
  TrendingUp,
  Gauge,
  RefreshCw,
  Repeat,
  Rocket,
  Scale,
  ServerCog,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Bot,
  Award,
  FileSearch,
  Activity,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EdgeTopBar } from "@/components/edge/edge-top-bar";
import { hasAnyEdgePermission } from "@/lib/edge/permissions";
import { cn } from "@/lib/utils";
import { useEdgeSession } from "@/providers/edge-session-provider";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  /** When set, item is shown only if the user has any of these permissions. */
  requiredAnyPermissions?: string[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Platform",
    items: [
      { href: "/edge", label: "Portfolio", icon: LayoutDashboard },
      { href: "/edge/catalog", label: "Catalog", icon: Package },
      { href: "/edge/commercial", label: "Commercial", icon: Tags },
      { href: "/edge/marketing", label: "Marketing", icon: Megaphone },
      { href: "/edge/sales", label: "Sales", icon: Handshake },
      {
        href: "/edge/acquisition",
        label: "Acquisition",
        icon: ShoppingBag,
        requiredAnyPermissions: [
          "platform:acquisition:read",
          "platform:acquisition:manage",
        ],
      },
      {
        href: "/edge/revenue",
        label: "Revenue",
        icon: TrendingUp,
        requiredAnyPermissions: [
          "platform:revenue:read",
          "platform:business:read",
        ],
      },
      { href: "/edge/subscriptions", label: "Subscriptions", icon: RefreshCw },
      { href: "/edge/billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    title: "Tenants",
    items: [
      {
        href: "/edge/operations",
        label: "Operations",
        icon: Activity,
        requiredAnyPermissions: [
          "platform:operations:overview:read",
          "platform:service_catalog:read",
          "platform:operations:alerts:read",
        ],
      },
      { href: "/edge/tenants", label: "Tenant Management", icon: Building2 },
      {
        href: "/edge/provisioning-requests",
        label: "Provisioning Ops",
        icon: ServerCog,
      },
    ],
  },
  {
    title: "Provisioning",
    items: [
      {
        href: "/edge/provisioning/registry",
        label: "Registry",
        icon: Boxes,
      },
      {
        href: "/edge/provisioning/capacity",
        label: "Placement & Capacity",
        icon: Gauge,
      },
      {
        href: "/edge/provisioning/workflows",
        label: "Workflows",
        icon: Workflow,
      },
      {
        href: "/edge/provisioning/product-controls",
        label: "BB · Product Control",
        icon: Cable,
      },
      {
        href: "/edge/provisioning/infrastructure",
        label: "Infrastructure & DB",
        icon: ServerCog,
      },
      {
        href: "/edge/provisioning/configuration",
        label: "Configuration",
        icon: SlidersHorizontal,
      },
      {
        href: "/edge/provisioning/experience",
        label: "Experience",
        icon: Sparkles,
      },
      {
        href: "/edge/provisioning/readiness",
        label: "Readiness",
        icon: CheckCircle2,
      },
      {
        href: "/edge/provisioning/lifecycle",
        label: "Lifecycle",
        icon: Repeat,
      },
      {
        href: "/edge/provisioning/onboarding",
        label: "Onboarding",
        icon: Rocket,
      },
      {
        href: "/edge/provisioning/reconciliation",
        label: "Reconciliation",
        icon: Scale,
      },
      {
        href: "/edge/provisioning/agents",
        label: "Connectivity Agents",
        icon: Bot,
      },
      {
        href: "/edge/provisioning/certification",
        label: "Certification",
        icon: Award,
      },
      {
        href: "/edge/provisioning/evidence",
        label: "Evidence Viewer",
        icon: FileSearch,
      },
    ],
  },
  {
    title: "Governance",
    items: [
      { href: "/edge/markets", label: "Markets", icon: Store },
      { href: "/edge/readiness", label: "Market readiness", icon: CheckCircle2 },
      { href: "/edge/verticals", label: "Verticals studio", icon: Building2 },
      { href: "/edge/backends", label: "Business Backends", icon: ServerCog },
      { href: "/edge/administrators", label: "Administrators", icon: Users },
      { href: "/edge/security", label: "Security", icon: Shield },
      { href: "/edge/audit", label: "Audit", icon: ClipboardList },
    ],
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

function itemIsActive(pathname: string, href: string) {
  if (href === "/edge") return pathname === "/edge";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContainsPath(pathname: string, items: NavItem[]) {
  return items.some(
    (item) => !item.disabled && itemIsActive(pathname, item.href),
  );
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

function filterNavItems(
  items: NavItem[],
  permissions: string[],
): NavItem[] {
  return items.filter(
    (item) =>
      !item.requiredAnyPermissions?.length ||
      hasAnyEdgePermission(permissions, item.requiredAnyPermissions),
  );
}

function NavSection({
  title,
  items,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  if (!items.length) return null;
  const panelId = `edge-nav-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const activeCount = items.filter(
    (item) => !item.disabled && itemIsActive(pathname, item.href),
  ).length;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-[var(--space-3)] py-2 type-xs font-semibold uppercase tracking-[0.12em] transition-colors",
          open || activeCount
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        {activeCount > 0 && !open ? (
          <span className="rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-[var(--primary)]">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <nav
          id={panelId}
          className="flex flex-col gap-0.5"
          aria-label={title}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = !item.disabled && itemIsActive(pathname, item.href);
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
                onClick={onNavigate}
              >
                <Icon className="size-[var(--icon-md)] shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function EdgeSidebarNav({
  pathname,
  permissions,
  activeVerticalId,
  hasWorkspace,
  onNavigate,
}: {
  pathname: string;
  permissions: string[];
  activeVerticalId: string | null;
  hasWorkspace: boolean;
  onNavigate?: () => void;
}) {
  const sections = useMemo(() => {
    const list = NAV_GROUPS.map((group) => ({
      title: group.title,
      items: filterNavItems(group.items, permissions),
    })).filter((g) => g.items.length > 0);

    if (hasWorkspace) {
      list.push({
        title: "Workspace",
        items: workspaceNav(activeVerticalId),
      });
    }
    return list;
  }, [permissions, hasWorkspace, activeVerticalId]);

  const activeSectionTitle = useMemo(() => {
    const hit = sections.find((s) => groupContainsPath(pathname, s.items));
    return hit?.title ?? sections[0]?.title ?? null;
  }, [pathname, sections]);

  /** Accordion: one open section at a time. */
  const [openTitle, setOpenTitle] = useState<string | null>(activeSectionTitle);

  useEffect(() => {
    if (activeSectionTitle) setOpenTitle(activeSectionTitle);
  }, [activeSectionTitle]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-[var(--space-3)] sm:p-[var(--space-4)]">
      {sections.map((section) => {
        const open = openTitle === section.title;
        return (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            pathname={pathname}
            open={open}
            onToggle={() =>
              setOpenTitle((prev) =>
                prev === section.title ? null : section.title,
              )
            }
            onNavigate={onNavigate}
          />
        );
      })}
    </div>
  );
}

export function EdgeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const auth = useEdgeSession();
  const { activeVerticalId, workspaces, permissions } = useEdgePlatform();
  const hasWorkspace = Boolean(activeVerticalId) || workspaces.length > 0;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="fixed inset-0 z-0 flex overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border)] px-4">
          <Link
            href="/edge"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Okapi Edge home"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-[11px] font-bold tracking-tight text-[var(--on-primary)]">
              OE
            </span>
            <span className="min-w-0">
              <span
                className="block truncate text-[15px] font-bold leading-tight tracking-tight transition-colors group-hover:text-[var(--primary)]"
                style={{
                  fontFamily: "var(--font-signin-display), sans-serif",
                }}
              >
                Okapi Edge
              </span>
              <span className="block truncate type-xs text-[var(--text-muted)]">
                Platform control
              </span>
            </span>
          </Link>
        </div>
        <EdgeSidebarNav
          pathname={pathname}
          permissions={permissions}
          activeVerticalId={activeVerticalId}
          hasWorkspace={hasWorkspace}
        />
        <div className="shrink-0 space-y-[var(--space-2)] border-t border-[var(--border)] p-[var(--space-4)]">
          <div className="flex items-center justify-between gap-[var(--space-2)]">
            <div className="min-w-0">
              <p className="truncate type-sm font-medium text-[var(--text-primary)]">
                {auth.user?.name ?? auth.user?.email ?? "Administrator"}
              </p>
              <p className="truncate type-xs text-[var(--text-muted)]">
                Edge administrator
              </p>
            </div>
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <EdgeTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-[var(--space-4)] sm:p-[var(--space-6)]"
        >
          <div className="mx-auto w-full max-w-[var(--page-max,72rem)]">
            {children}
          </div>
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay)]"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edge navigation"
            className="relative flex h-full w-[min(20rem,100%)] flex-col bg-[var(--bg-surface)] elevation-2"
          >
            <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-[11px] font-bold tracking-tight text-[var(--on-primary)]">
                  OE
                </span>
                <div className="min-w-0">
                  <p
                    className="truncate text-[15px] font-bold leading-tight tracking-tight"
                    style={{
                      fontFamily: "var(--font-signin-display), sans-serif",
                    }}
                  >
                    Okapi Edge
                  </p>
                  <p className="truncate type-xs text-[var(--text-muted)]">
                    Platform control
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <EdgeSidebarNav
              pathname={pathname}
              permissions={permissions}
              activeVerticalId={activeVerticalId}
              hasWorkspace={hasWorkspace}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
