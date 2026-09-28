"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AppWindow,
  Banknote,
  Bell,
  Boxes,
  Building2,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  Code2,
  Cog,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  GitBranch,
  Globe,
  HardDrive,
  Hash,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  MapPin,
  Palette,
  Plug,
  Receipt,
  Scale,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import {
  MY_SETTINGS_LINKS,
  SETTINGS_SECTIONS,
  TENANT_NAV_GROUPS,
  type SettingsSection,
} from "@/lib/settings/sections";
import { hasPermission } from "@/lib/access/permissions";
import { usePreferences } from "@/providers/preferences-provider";
import { usePlatform } from "@/providers/platform-provider";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/form";

type Icon = ComponentType<{ className?: string }>;

const ITEM_ICONS: Record<string, Icon> = {
  profile: UserRound,
  preferences: SlidersHorizontal,
  personalization: LayoutGrid,
  memberships: Users,
  identity: Shield,
  "connected-apps": AppWindow,
  activity: History,
  organization: Building2,
  general: Settings2,
  company: Building2,
  localization: Globe,
  regional: MapPin,
  currency: Banknote,
  fiscal: CalendarRange,
  tax: Receipt,
  numbering: Hash,
  documents: FileText,
  branding: Palette,
  modules: Boxes,
  features: Sparkles,
  users: Users,
  roles: ShieldCheck,
  notifications: Bell,
  integrations: Plug,
  authentication: KeyRound,
  "identity-providers": Fingerprint,
  privacy: Lock,
  compliance: Scale,
  data: Database,
  storage: HardDrive,
  automation: Zap,
  workflow: GitBranch,
  audit: ClipboardList,
  api: Code2,
  webhooks: Webhook,
  billing: CreditCard,
  advanced: Cog,
  commercial: Banknote,
  "inventory-policies": Boxes,
  "process-timeouts": History,
};

const GROUP_ICONS: Record<string, Icon> = {
  account: UserRound,
  organization: Building2,
  workspace: LayoutDashboard,
  locale: Globe,
  people: Users,
  security: Shield,
  operations: GitBranch,
  data: Database,
  developers: Code2,
  billing: CreditCard,
};

function hrefPath(href: string) {
  return href.split("?")[0] ?? href;
}

function hrefTab(href: string) {
  const q = href.split("?")[1];
  if (!q) return null;
  return new URLSearchParams(q).get("tab");
}

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: Icon;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] type-sm transition-colors",
        active
          ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
      )}
    >
      <Icon className="size-[var(--icon-sm)] shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}

function AccordionGroup({
  id,
  label,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  icon: Icon;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-[var(--space-1)] first:mt-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`settings-group-${id}`}
        onClick={() => onToggle(id)}
        className="flex h-8 w-full items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] text-left hover:bg-[var(--surface-muted)]"
      >
        <Icon className="size-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <span className="min-w-0 flex-1 truncate type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-90",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={`settings-group-${id}`} className="flex flex-col gap-0.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = usePreferences();
  const { context, capabilities } = usePlatform();
  const orgId = context?.organizationId;
  const fr = locale === "fr";
  const [openId, setOpenId] = useState<string | null>(null);

  const permissions = useMemo(
    () => [
      ...(capabilities?.permissions ?? []),
      ...(context?.permissions ?? []),
    ],
    [capabilities?.permissions, context?.permissions],
  );

  const isActive = (href: string) => {
    const path = hrefPath(href);
    const tab = hrefTab(href);
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    if (path === "/settings/security") {
      const currentTab = searchParams.get("tab");
      if (tab === "tokens") return currentTab === "tokens";
      return currentTab !== "tokens";
    }
    return true;
  };

  const tenantGroups = useMemo(() => {
    const byId = new Map(SETTINGS_SECTIONS.map((s) => [s.id, s]));
    return TENANT_NAV_GROUPS.map((group) => {
      const items = group.sectionIds
        .map((id) => byId.get(id))
        .filter((s): s is SettingsSection => Boolean(s))
        .filter((s) => hasPermission(permissions, s.permission));
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [permissions]);

  const activeGroupId = useMemo(() => {
    if (MY_SETTINGS_LINKS.some((s) => isActive(s.href))) return "account";
    if (isActive("/settings/organization")) return "organization";
    const tenant = tenantGroups.find((g) => g.items.some((s) => isActive(s.href)));
    return tenant?.id ?? "account";
  }, [pathname, searchParams, tenantGroups]);

  useEffect(() => {
    setOpenId(activeGroupId);
  }, [activeGroupId]);

  const toggleGroup = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  const accountScope = MY_SETTINGS_LINKS.some((s) => isActive(s.href));

  const workspaceHref = useMemo(() => {
    const general = SETTINGS_SECTIONS.find((s) => s.id === "general");
    if (general && hasPermission(permissions, general.permission)) {
      return general.href;
    }
    return orgId ? "/settings/organization" : "/settings/profile";
  }, [permissions, orgId]);

  const mobileOptions = useMemo(() => {
    if (accountScope) {
      return [
        ...MY_SETTINGS_LINKS.map((s) => ({
          href: s.href,
          label: fr ? s.labelFr : s.labelEn,
        })),
        {
          href: workspaceHref,
          label: fr ? "Espace de travail" : "Workspace settings",
        },
      ];
    }
    const mine = [
      {
        href: "/settings/profile",
        label: fr ? "Mon compte" : "My account",
      },
    ];
    const org = orgId
      ? [
          {
            href: "/settings/organization",
            label: fr ? "Organisation" : "Organization",
          },
        ]
      : [];
    const tenant = tenantGroups.flatMap((g) =>
      g.items.map((s) => ({
        href: s.href,
        label: fr ? s.labelFr : s.labelEn,
      })),
    );
    return [...mine, ...org, ...tenant];
  }, [accountScope, fr, orgId, tenantGroups, workspaceHref]);

  const mobileValue =
    mobileOptions.find((o) => isActive(o.href))?.href ??
    mobileOptions[0]?.href ??
    "";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row">
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-4)] py-[var(--space-3)] md:hidden">
        <Select
          id="settings-mobile-nav"
          aria-label={fr ? "Section des paramètres" : "Settings section"}
          value={mobileValue}
          onChange={(e) => router.push(e.target.value)}
        >
          {mobileOptions.map((o) => (
            <option key={o.href} value={o.href}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] md:flex">
        <div className="border-b border-[var(--border)] px-[var(--space-4)] py-[var(--space-4)]">
          <p className="type-md text-[var(--text-primary)]">
            {accountScope
              ? fr
                ? "Mon compte"
                : "My account"
              : fr
                ? "Paramètres"
                : "Settings"}
          </p>
          <p className="mt-0.5 type-xs text-[var(--text-muted)]">
            {accountScope
              ? fr
                ? "Profil, sécurité, préférences"
                : "Profile, security, preferences"
              : fr
                ? "Organisation et espace de travail"
                : "Organization and workspace"}
          </p>
        </div>
        <nav
          aria-label={fr ? "Navigation des paramètres" : "Settings navigation"}
          className="min-h-0 flex-1 overflow-y-auto px-[var(--space-2)] py-[var(--space-3)]"
        >
          {accountScope ? (
            <>
              <div className="flex flex-col gap-0.5">
                {MY_SETTINGS_LINKS.map((s) => (
                  <NavLink
                    key={s.id}
                    href={s.href}
                    active={isActive(s.href)}
                    icon={ITEM_ICONS[s.id] ?? Settings2}
                  >
                    {fr ? s.labelFr : s.labelEn}
                  </NavLink>
                ))}
              </div>
              <div className="mt-[var(--space-4)] border-t border-[var(--border)] pt-[var(--space-3)]">
                <NavLink
                  href={workspaceHref}
                  active={false}
                  icon={LayoutDashboard}
                >
                  {fr ? "Espace de travail" : "Workspace settings"}
                </NavLink>
              </div>
            </>
          ) : (
            <>
              <NavLink
                href="/settings/profile"
                active={false}
                icon={UserRound}
              >
                {fr ? "Mon compte" : "My account"}
              </NavLink>
              <AccordionGroup
                id="organization"
                label={fr ? "Organisation" : "Organization"}
                icon={GROUP_ICONS.organization}
                open={openId === "organization"}
                onToggle={toggleGroup}
              >
                {orgId ? (
                  <NavLink
                    href="/settings/organization"
                    active={isActive("/settings/organization")}
                    icon={ITEM_ICONS.organization}
                  >
                    {fr ? "Paramètres organisation" : "Organization settings"}
                  </NavLink>
                ) : (
                  <p className="px-[var(--space-3)] type-sm text-[var(--text-muted)]">
                    {fr ? "Aucune organisation active" : "No active organization"}
                  </p>
                )}
              </AccordionGroup>

              {tenantGroups.map((group) => (
                <AccordionGroup
                  key={group.id}
                  id={group.id}
                  label={fr ? group.labelFr : group.labelEn}
                  icon={GROUP_ICONS[group.id] ?? Settings2}
                  open={openId === group.id}
                  onToggle={toggleGroup}
                >
                  {group.items.map((s) => (
                    <NavLink
                      key={s.id}
                      href={s.href}
                      active={isActive(s.href)}
                      icon={ITEM_ICONS[s.id] ?? Settings2}
                    >
                      {fr ? s.labelFr : s.labelEn}
                    </NavLink>
                  ))}
                </AccordionGroup>
              ))}
            </>
          )}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-app)]">
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex min-h-0 w-full max-w-[var(--page-max)] flex-1 flex-col px-[var(--page-margin)] py-[var(--space-6)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
