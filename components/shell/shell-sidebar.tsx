"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Calculator,
  Factory,
  Handshake,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeft,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/access/permissions";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { usePreferences } from "@/providers/preferences-provider";
import { useAppContext } from "@/shell/context/app-context";
import { useCommandPalette } from "@/shell/commands/command-palette-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SidebarWorkspaceTools } from "@/components/shell/sidebar-workspace-tools";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  ShoppingCart,
  HeartPulse,
  Handshake,
  Package,
  Calculator,
  Briefcase,
  Shield,
  KeyRound,
  Settings,
  Wallet,
  Truck,
  Factory,
};

function navItemClass(active: boolean, collapsed: boolean) {
  return cn(
    "flex min-h-[var(--touch-min)] items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] type-sm transition-colors",
    active
      ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)]"
      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
    collapsed && "justify-center px-[var(--space-2)]",
  );
}

function FooterLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={navItemClass(active, collapsed)}
    >
      <Icon
        className="size-[var(--icon-md)] shrink-0"
        aria-hidden
      />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ShellSidebar({
  variant = "docked",
  onNavigate,
}: {
  variant?: "docked" | "drawer";
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "/";
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } =
    usePreferences();
  const { capabilities, context } = usePlatform();
  const { apps } = useAppContext();
  const { setOpen } = useCommandPalette();
  const client = useApiClient();
  const [toolQuery, setToolQuery] = useState("");

  useEffect(() => {
    if (variant === "drawer") return;
    const mq = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const apply = () => {
      if (mq.matches) setSidebarCollapsed(true);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [variant, setSidebarCollapsed]);

  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const tenantId = context?.tenantId ?? "";

  const tenantQuery = useQuery({
    queryKey: qk.identity(context?.organizationId).tenant(tenantId || "none"),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async () => identityApi(client).tenants.get(tenantId),
  });

  const tenantLabel =
    tenantQuery.data?.data?.displayName ||
    tenantQuery.data?.data?.legalName ||
    tenantQuery.data?.data?.slug ||
    "Tenant";

  // Shell primary nav = subscribed business apps only (never Core/Identity).
  const navItems = apps
    .filter((a) => a.status === "ACTIVE" && a.id !== "core")
    .flatMap((a) =>
      a.navigation
        .filter((n) => !n.permission || hasPermission(perms, n.permission))
        .filter(
          (n) =>
            n.section !== "settings" && !n.href.startsWith("/settings"),
        )
        .map((n) => ({ ...n, appIcon: a.icon, appId: a.id })),
    );

  const filtered = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [navItems, toolQuery]);

  const sectionOf = (item: (typeof navItems)[number]) =>
    item.section ?? "overview";

  const sections = [
    {
      id: "overview",
      label: "Overview",
      items: filtered.filter((i) => sectionOf(i) === "overview"),
    },
    {
      id: "management",
      label: "Management",
      items: filtered.filter((i) => sectionOf(i) === "management"),
    },
    {
      id: "administration",
      label: "Administration",
      items: filtered.filter((i) => sectionOf(i) === "administration"),
    },
  ].filter((s) => s.items.length > 0);

  const collapsed = variant === "drawer" ? false : sidebarCollapsed;
  const isDrawer = variant === "drawer";
  const coreActive = pathname === "/" || pathname.startsWith("/identity");
  const settingsActive = pathname.startsWith("/settings");

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]",
          isDrawer
            ? "w-full"
            : collapsed
              ? "w-[var(--density-sidebar-collapsed)]"
              : "w-[var(--density-sidebar)]",
        )}
      >
        <div
          className={cn(
            "flex h-[var(--header-height)] items-center gap-[var(--space-2)] border-b border-[var(--border)] px-[var(--space-3)]",
            collapsed && "justify-center px-[var(--space-2)]",
          )}
        >
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] type-sm font-bold text-[var(--on-primary)]"
            aria-hidden
          >
            {(tenantLabel[0] ?? "E").toUpperCase()}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate type-md text-[var(--text-primary)]">
                {tenantLabel}
              </p>
              <p className="truncate type-xs text-[var(--text-muted)]">
                Edge workspace
              </p>
            </div>
          ) : null}
          {!isDrawer ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden shrink-0 md:inline-flex"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            >
              {collapsed ? (
                <PanelLeft className="size-[var(--icon-sm)]" />
              ) : (
                <PanelLeftClose className="size-[var(--icon-sm)]" />
              )}
            </Button>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="border-b border-[var(--border)] px-[var(--space-3)] py-[var(--space-3)]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-[var(--space-2)] top-1/2 size-[var(--icon-sm)] -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={toolQuery}
                onChange={(e) => setToolQuery(e.target.value)}
                placeholder="Rechercher…"
                className="h-[var(--control-height)] w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-app)] pl-8 pr-[var(--space-3)] type-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
          </div>
        ) : (
          <div className="flex justify-center border-b border-[var(--border)] py-[var(--space-2)]">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Rechercher"
              onClick={() => setOpen(true)}
            >
              <Search className="size-[var(--icon-sm)]" />
            </Button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-[var(--space-2)] py-[var(--space-3)]" aria-label="Principal">
          {sections.map((section) => (
            <div key={section.id} className="mb-[var(--space-4)]">
              {!collapsed ? (
                <p className="px-[var(--space-3)] pb-[var(--space-2)] type-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {section.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-[var(--space-1)]">
                {section.items.map((item) => {
                  const Icon = icons[item.appIcon] ?? LayoutDashboard;
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const link = (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={navItemClass(active, collapsed)}
                    >
                      <Icon className="size-[var(--icon-md)] shrink-0" aria-hidden />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                  return (
                    <li key={`${item.appId}-${item.id}`}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {!sections.length && !collapsed ? (
            <p className="px-[var(--space-3)] type-xs text-[var(--text-muted)]">
              Aucun résultat
            </p>
          ) : null}
        </nav>

        <div className="mt-auto flex flex-col gap-[var(--space-1)] border-t border-[var(--border)] px-[var(--space-2)] py-[var(--space-3)]">
          <SidebarWorkspaceTools collapsed={collapsed} />
          <div className="my-[var(--space-1)] h-px bg-[var(--border)]" />
          <FooterLink
            href="/"
            label="Core"
            icon={LayoutDashboard}
            active={coreActive}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          <FooterLink
            href="/settings"
            label="Paramètres"
            icon={Settings}
            active={settingsActive}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        </div>
      </aside>
    </TooltipProvider>
  );
}
