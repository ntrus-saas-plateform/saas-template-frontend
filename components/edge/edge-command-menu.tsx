"use client";

/**
 * Edge-scoped command menu (Stripe/Vercel-style jump palette).
 * Captures Ctrl/Cmd+K on /edge* so the ERP palette does not steal focus.
 */
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  Boxes,
  Building2,
  Cable,
  CreditCard,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  ServerCog,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 type-sm text-[var(--text-primary)] data-[selected=true]:bg-[var(--primary-soft)]";

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:type-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--text-muted)]";

type EdgeCommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NAV_COMMANDS: Array<{
  href: string;
  label: string;
  group: string;
  keywords?: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    href: "/edge",
    label: "Portfolio",
    group: "Platform",
    icon: LayoutDashboard,
  },
  { href: "/edge/catalog", label: "Catalog", group: "Platform", icon: Package },
  {
    href: "/edge/billing",
    label: "Billing",
    group: "Platform",
    icon: CreditCard,
  },
  {
    href: "/edge/subscriptions",
    label: "Subscriptions",
    group: "Platform",
    keywords: "plans renewals",
    icon: CreditCard,
  },
  {
    href: "/edge/tenants",
    label: "Tenant Management",
    group: "Tenants",
    icon: Building2,
  },
  {
    href: "/edge/operations",
    label: "Operations",
    group: "Tenants",
    keywords: "alerts health status",
    icon: Activity,
  },
  {
    href: "/edge/verticals",
    label: "Verticals studio",
    group: "Governance",
    keywords: "industry workspace",
    icon: Building2,
  },
  {
    href: "/edge/backends",
    label: "Business Backends",
    group: "Governance",
    keywords: "bb registry",
    icon: ServerCog,
  },
  {
    href: "/edge/provisioning/product-controls",
    label: "BB · Product Control",
    group: "Provisioning",
    keywords: "control plane handshake",
    icon: Cable,
  },
  {
    href: "/edge/provisioning/registry",
    label: "Registry",
    group: "Provisioning",
    icon: Boxes,
  },
  {
    href: "/edge/administrators",
    label: "Administrators",
    group: "Governance",
    icon: Users,
  },
  {
    href: "/edge/security",
    label: "Security",
    group: "Governance",
    icon: Shield,
  },
  {
    href: "/edge/audit",
    label: "Audit",
    group: "Governance",
    icon: Shield,
  },
];

export function EdgeCommandMenu({ open, onOpenChange }: EdgeCommandMenuProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { workspaces, switchWorkspace, activeVerticalId } = useEdgePlatform();
  const [search, setSearch] = useState("");

  const [modKey, setModKey] = useState("Ctrl");
  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform)) setModKey("⌘");
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (!pathname.startsWith("/edge")) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pathname, open, onOpenChange]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof NAV_COMMANDS>();
    for (const item of NAV_COMMANDS) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, []);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setSearch("");
    fn();
  };

  if (!open) return null;

  const createProductHref = activeVerticalId
    ? `/edge/catalog/new?verticalId=${activeVerticalId}`
    : "/edge/catalog/new";

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)]"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mx-auto mt-[12vh] w-full max-w-xl px-4">
        <Command
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] elevation-2"
          label="Edge command menu"
          shouldFilter
        >
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
            <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Jump to page, vertical, or action…"
              className="h-12 w-full bg-transparent type-sm outline-none placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            <kbd className="hidden rounded-md border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center type-sm text-[var(--text-muted)]">
              No matches.
            </Command.Empty>

            <Command.Group heading="Create" className={groupClass}>
              <Command.Item
                value="create vertical new industry"
                className={itemClass}
                onSelect={() =>
                  run(() => router.push("/edge/verticals?create=1"))
                }
              >
                <Plus className="size-4 shrink-0 text-[var(--text-muted)]" />
                <span className="min-w-0 flex-1 truncate">New vertical</span>
              </Command.Item>
              <Command.Item
                value="create product catalog"
                className={itemClass}
                onSelect={() => run(() => router.push(createProductHref))}
              >
                <Plus className="size-4 shrink-0 text-[var(--text-muted)]" />
                <span className="min-w-0 flex-1 truncate">New product</span>
              </Command.Item>
              <Command.Item
                value="create business backend bb"
                className={itemClass}
                onSelect={() => run(() => router.push("/edge/backends"))}
              >
                <Plus className="size-4 shrink-0 text-[var(--text-muted)]" />
                <span className="min-w-0 flex-1 truncate">
                  Register business backend
                </span>
              </Command.Item>
            </Command.Group>

            {workspaces.length > 0 ? (
              <Command.Group heading="Verticals" className={groupClass}>
                {workspaces.map((ws) => {
                  const label =
                    ws.vertical.displayName ??
                    ws.vertical.name ??
                    ws.vertical.code ??
                    ws.vertical.id;
                  const selected = ws.vertical.id === activeVerticalId;
                  return (
                    <Command.Item
                      key={ws.vertical.id}
                      value={`vertical ${label} ${ws.vertical.code ?? ""}`}
                      className={itemClass}
                      onSelect={() =>
                        run(() => {
                          void switchWorkspace(ws.vertical.id);
                        })
                      }
                    >
                      <Building2 className="size-4 shrink-0 text-[var(--text-muted)]" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {selected ? (
                        <span className="type-xs text-[var(--primary)]">
                          Active
                        </span>
                      ) : null}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ) : null}

            {groups.map(([group, items]) => (
              <Command.Group key={group} heading={group} className={groupClass}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/edge"
                      ? pathname === "/edge"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.keywords ?? ""} ${item.href}`}
                      className={cn(itemClass, active && "font-semibold")}
                      onSelect={() => run(() => router.push(item.href))}
                    >
                      <Icon className="size-4 shrink-0 text-[var(--text-muted)]" />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-3 py-2 type-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              navigate
              <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              open
            </span>
            <span className="font-mono text-[10px]">
              {modKey}K to toggle
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
