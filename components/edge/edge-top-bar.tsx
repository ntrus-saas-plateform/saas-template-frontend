"use client";

/**
 * Enterprise Edge top bar — Stripe / Vercel density:
 * context (workspace + crumbs) | jump search | create · env · health · inbox · help · account
 */
import {
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Building2,
  Cable,
  Check,
  CircleHelp,
  Copy,
  ExternalLink,
  Keyboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  ServerCog,
  Settings2,
  Shield,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/edge/workspace-switcher";
import { EdgeCommandMenu } from "@/components/edge/edge-command-menu";
import { edgeApi } from "@/lib/api/edge";
import { hasAnyEdgePermission } from "@/lib/edge/permissions";
import { cn } from "@/lib/utils";
import { useEdgeSession } from "@/providers/edge-session-provider";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { OperationsOverview } from "@/types/edge-platform-operations";

function userInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const CRUMB_LABELS: Record<string, string> = {
  edge: "Console",
  catalog: "Catalog",
  verticals: "Verticals",
  backends: "Business Backends",
  tenants: "Tenants",
  billing: "Billing",
  subscriptions: "Subscriptions",
  acquisition: "Acquisition",
  revenue: "Revenue",
  operations: "Operations",
  markets: "Markets",
  readiness: "Readiness",
  administrators: "Administrators",
  security: "Security",
  audit: "Audit",
  commercial: "Commercial",
  marketing: "Marketing",
  sales: "Sales",
  provisioning: "Provisioning",
  "product-controls": "Product Control",
  registry: "Registry",
  capacity: "Capacity",
  workflows: "Workflows",
  infrastructure: "Infrastructure",
  configuration: "Configuration",
  experience: "Experience",
  lifecycle: "Lifecycle",
  onboarding: "Onboarding",
  reconciliation: "Reconciliation",
  agents: "Agents",
  certification: "Certification",
  evidence: "Evidence",
  workspace: "Workspace",
  "provisioning-requests": "Provisioning Ops",
  new: "New",
  products: "Products",
};

function crumbsFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const out: Array<{ href: string; label: string }> = [];
  let acc = "";
  for (const part of parts) {
    acc += `/${part}`;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        part,
      );
    out.push({
      href: acc,
      label: isUuid ? "Detail" : (CRUMB_LABELS[part] ?? part),
    });
  }
  return out;
}

function unwrapOverview(raw: unknown): OperationsOverview | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { data?: OperationsOverview } & Partial<OperationsOverview>;
  if (r.data && typeof r.data === "object" && "availability" in r.data) {
    return r.data;
  }
  if ("availability" in r) return r as OperationsOverview;
  return null;
}

function unwrapAlertItems(raw: unknown): Array<{
  id: string;
  title: string;
  severity: string;
  status: string;
  lastSeenAt?: string;
}> {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as {
    data?: { items?: unknown[] } | unknown[];
    items?: unknown[];
  };
  const page = Array.isArray(r.data)
    ? r.data
    : Array.isArray(r.data?.items)
      ? r.data.items
      : Array.isArray(r.items)
        ? r.items
        : [];
  return page
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      id: String(x.id ?? ""),
      title: String(x.title ?? "Alert"),
      severity: String(x.severity ?? "INFO"),
      status: String(x.status ?? ""),
      lastSeenAt:
        typeof x.lastSeenAt === "string" ? x.lastSeenAt : undefined,
    }))
    .filter((x) => x.id);
}

function healthTone(
  overview: OperationsOverview | null,
  opts?: { loading?: boolean; error?: boolean },
): {
  label: string;
  className: string;
  dot: string;
} {
  if (opts?.loading) {
    return {
      label: "Checking…",
      className: "text-[var(--text-muted)]",
      dot: "bg-[var(--text-muted)]",
    };
  }
  if (opts?.error || !overview) {
    return {
      label: "Systems",
      className: "text-[var(--text-muted)]",
      dot: "bg-[var(--text-muted)]",
    };
  }
  const active = overview.alerts?.activeCount ?? 0;
  const openIncidents = overview.incidents?.openCount ?? 0;
  const major = overview.incidents?.majorCount ?? 0;
  if (
    overview.availability === "UNAVAILABLE" ||
    major > 0 ||
    openIncidents > 2
  ) {
    return {
      label: "Degraded",
      className: "text-[var(--danger)]",
      dot: "bg-[var(--danger)]",
    };
  }
  if (
    overview.availability === "PARTIAL" ||
    active > 0 ||
    openIncidents > 0
  ) {
    return {
      label: active ? `${active} active alert${active > 1 ? "s" : ""}` : "Partial",
      className: "text-[var(--warning)]",
      dot: "bg-[var(--warning)]",
    };
  }
  return {
    label: "All systems nominal",
    className: "text-[var(--success)]",
    dot: "bg-[var(--success)]",
  };
}

function HeaderIconButton({
  label,
  children,
  className,
  ...props
}: ComponentProps<typeof Button> & { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("size-8 text-[var(--text-secondary)]", className)}
          aria-label={label}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function EdgeTopBar({
  onOpenMobileNav,
}: {
  onOpenMobileNav?: () => void;
}) {
  const pathname = usePathname() ?? "/edge";
  const auth = useEdgeSession();
  const { me, permissions, activeWorkspace, activeVerticalId } =
    useEdgePlatform();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const canOpsOverview = hasAnyEdgePermission(permissions, [
    "platform:operations:overview:read",
    "platform:service_catalog:read",
  ]);
  const canAlerts = hasAnyEdgePermission(permissions, [
    "platform:operations:alerts:read",
  ]);

  const healthQ = useQuery({
    queryKey: ["edge", "header", "ops-health", activeVerticalId ?? "all"],
    enabled: canOpsOverview,
    queryFn: () =>
      edgeApi.getOperationsHealth({ verticalId: activeVerticalId ?? undefined }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const alertsQ = useQuery({
    queryKey: ["edge", "header", "alerts"],
    enabled: canAlerts,
    queryFn: () => edgeApi.listOperationalAlerts({ limit: 8 }),
    refetchInterval: 45_000,
    staleTime: 20_000,
  });

  const overview = unwrapOverview(healthQ.data);
  const alerts = unwrapAlertItems(alertsQ.data).filter((a) => {
    const s = a.status.toUpperCase();
    return !["RESOLVED", "CLOSED", "CLEARED", "DONE"].includes(s);
  });
  const health = healthTone(overview, {
    loading: canOpsOverview && healthQ.isLoading,
    error: canOpsOverview && healthQ.isError,
  });
  const alertCount =
    overview?.alerts?.activeCount ??
    (alertsQ.isSuccess ? alerts.length : 0);

  const crumbs = useMemo(() => crumbsFromPath(pathname), [pathname]);
  const displayName =
    auth.user?.name ?? me?.displayName ?? auth.user?.email ?? "Administrator";
  const email = auth.user?.email ?? me?.email ?? null;
  const envLabel =
    process.env.NEXT_PUBLIC_EDGE_ENV_LABEL?.trim() ||
    (process.env.NODE_ENV === "production" ? "Prod" : "Lab");
  const envIsProd =
    envLabel.toLowerCase() === "prod" ||
    envLabel.toLowerCase() === "production";
  const verticalLabel =
    activeWorkspace?.vertical?.displayName ??
    activeWorkspace?.vertical?.name ??
    activeWorkspace?.vertical?.code ??
    null;
  const [modKey] = useState(() =>
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform)
      ? "⌘"
      : "Ctrl",
  );

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <header className="sticky top-0 z-[var(--z-header)] flex h-14 shrink-0 items-center gap-2 overflow-visible border-b border-[var(--border)] bg-[var(--bg-surface)]/90 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--bg-surface)]/80 sm:gap-3 sm:px-4 lg:px-5">
          {/* —— Context zone —— */}
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="lg:hidden">
              <HeaderIconButton
                label="Open navigation"
                onClick={onOpenMobileNav}
              >
                <Menu className="size-4" />
              </HeaderIconButton>
            </div>

            <Link
              href="/edge"
              className="hidden items-center gap-2 rounded-[var(--radius-sm)] px-1 py-0.5 sm:flex lg:hidden"
              aria-label="Okapi Edge home"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-[var(--primary)] text-[10px] font-bold tracking-tight text-[var(--on-primary)]">
                OE
              </span>
            </Link>

            <WorkspaceSwitcher
              align="start"
              className="h-8 max-w-[9.5rem] min-w-0 border-[var(--border)] bg-[var(--bg-surface)] px-2 shadow-none sm:max-w-[14rem] md:max-w-[16rem]"
            />

            <Separator
              orientation="vertical"
              className="mx-0.5 hidden h-5 sm:block"
            />

            <Breadcrumb
              items={crumbs.map((c, i) => ({
                label: c.label,
                href: i === crumbs.length - 1 ? undefined : c.href,
              }))}
              className="hidden min-w-0 max-w-[22vw] truncate xl:block 2xl:max-w-[28vw]"
            />
          </div>

          {/* —— Search zone —— */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="group mx-auto hidden h-8 w-full max-w-md min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)]/80 px-2.5 text-left type-sm text-[var(--text-muted)] transition-[border-color,background-color,box-shadow] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] hover:shadow-[0_0_0_1px_var(--border)] md:flex"
          >
            <Search className="size-3.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="flex-1 truncate">
              Search pages, verticals, actions…
            </span>
            <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] lg:inline-flex">
              {modKey}K
            </kbd>
          </button>

          {/* —— Actions zone —— */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="size-8 border-[var(--border)]"
                      aria-label="Create"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Create</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Create</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/edge/verticals?create=1">
                    <Building2 className="size-4" />
                    Vertical
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      activeVerticalId
                        ? `/edge/catalog/new?verticalId=${activeVerticalId}`
                        : "/edge/catalog/new"
                    }
                  >
                    <Package className="size-4" />
                    Product
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edge/backends">
                    <ServerCog className="size-4" />
                    Business Backend
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edge/tenants">
                    <Building2 className="size-4" />
                    Tenant
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setCmdOpen(true)}>
                  <Search className="size-4" />
                  Jump anywhere
                  <span className="ml-auto font-mono type-xs text-[var(--text-muted)]">
                    {modKey}K
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <HeaderIconButton
              label="Search"
              className="md:hidden"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="size-4" />
            </HeaderIconButton>

            <span
              className={cn(
                "ml-0.5 hidden h-6 items-center rounded-md border px-2 type-xs font-semibold uppercase tracking-[0.1em] sm:inline-flex",
                envIsProd
                  ? "border-[color-mix(in_oklab,var(--danger)_35%,var(--border))] bg-[var(--danger-soft)] text-[var(--danger)]"
                  : "border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] bg-[var(--primary-soft)] text-[var(--primary)]",
              )}
              title={`Runtime environment · ${envLabel}`}
            >
              {envLabel}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden h-8 gap-1.5 px-2 text-[var(--text-secondary)] md:inline-flex"
                >
                  <Link href="/edge/operations" aria-label="Platform status">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        health.dot,
                        healthQ.isFetching && "animate-pulse",
                      )}
                    />
                    <Activity className={cn("size-3.5", health.className)} />
                    <span className="hidden max-w-[7rem] truncate type-xs font-medium xl:inline">
                      {health.label}
                    </span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {healthQ.isError
                  ? "Could not load platform health"
                  : health.label}
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="relative size-8 text-[var(--text-secondary)]"
                      aria-label="Notifications"
                    >
                      <Bell className="size-4" />
                      {alertCount > 0 ? (
                        <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-[var(--danger)] text-[8px] font-bold text-white">
                          {alertCount > 9 ? "9+" : alertCount}
                        </span>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Notifications</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="end"
                className="w-[min(22rem,calc(100vw-1.5rem))]"
              >
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                  <span>Inbox</span>
                  {canAlerts ? (
                    <Link
                      href="/edge/operations"
                      className="font-normal text-[var(--primary)] hover:underline"
                    >
                      Operations
                    </Link>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!canAlerts ? (
                  <div className="px-3 py-4 type-sm text-[var(--text-muted)]">
                    No alert permission for this administrator.
                  </div>
                ) : alertsQ.isLoading ? (
                  <div className="px-3 py-4 type-sm text-[var(--text-muted)]">
                    Loading alerts…
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-start gap-2 px-3 py-4">
                    <p className="type-sm text-[var(--text-muted)]">
                      No open operational alerts.
                    </p>
                    <Link
                      href="/edge/operations"
                      className="type-sm font-medium text-[var(--primary)] hover:underline"
                    >
                      Open operations console
                    </Link>
                  </div>
                ) : (
                  alerts.slice(0, 6).map((a) => (
                    <DropdownMenuItem key={a.id} asChild>
                      <Link
                        href="/edge/operations"
                        className="items-start py-2"
                      >
                        <AlertTriangle
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            a.severity === "CRITICAL" ||
                              a.severity === "HIGH"
                              ? "text-[var(--danger)]"
                              : "text-[var(--warning)]",
                          )}
                        />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-medium">
                            {a.title}
                          </span>
                          <span className="truncate type-xs text-[var(--text-muted)]">
                            {a.severity}
                            {a.lastSeenAt
                              ? ` · ${new Date(a.lastSeenAt).toLocaleString()}`
                              : ""}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-8 text-[var(--text-secondary)]"
                      aria-label="Help and resources"
                    >
                      <CircleHelp className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Help</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Resources</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/edge/provisioning/product-controls">
                    <Cable className="size-4" />
                    BB Product Control
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edge/backends">
                    <ServerCog className="size-4" />
                    Business Backends
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edge/security">
                    <Shield className="size-4" />
                    Security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href="http://localhost:3000/docs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BookOpen className="size-4" />
                    API docs
                    <ExternalLink className="ml-auto size-3.5 opacity-60" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setCmdOpen(true);
                  }}
                >
                  <Keyboard className="size-4" />
                  Keyboard shortcuts
                  <span className="ml-auto font-mono type-xs text-[var(--text-muted)]">
                    {modKey}K
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator
              orientation="vertical"
              className="mx-1 hidden h-5 sm:block"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 rounded-full px-1 sm:pl-1 sm:pr-2.5"
                  aria-label="Account menu"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[10px] font-semibold text-[var(--primary)] ring-1 ring-[var(--border)]">
                    {userInitials(displayName, email)}
                  </span>
                  <span className="hidden max-w-[8rem] truncate type-sm font-medium xl:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[min(18rem,calc(100vw-2rem))]"
              >
                <DropdownMenuLabel>
                  <div className="flex items-start gap-3 py-1">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-semibold text-[var(--primary)]">
                      {userInitials(displayName, email)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-[var(--text-primary)]">
                        {displayName}
                      </span>
                      {email ? (
                        <button
                          type="button"
                          onClick={() => void copyEmail()}
                          className="flex items-center gap-1 truncate text-left font-normal type-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <span className="truncate">{email}</span>
                          {copied ? (
                            <Check className="size-3 shrink-0 text-[var(--success)]" />
                          ) : (
                            <Copy className="size-3 shrink-0 opacity-60" />
                          )}
                        </button>
                      ) : null}
                      <span className="type-xs text-[var(--text-muted)]">
                        {permissions.includes("*") ||
                        permissions.some((p) =>
                          p.includes("SUPER_ADMIN"),
                        )
                          ? "Platform super admin"
                          : permissions.length
                            ? `${permissions.length} permissions`
                            : "Edge administrator"}
                        {verticalLabel ? ` · ${verticalLabel}` : ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/edge/administrators">
                    <UserRound className="size-4" />
                    Administrators
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edge/security">
                    <Settings2 className="size-4" />
                    Security settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/edge/audit">
                    <Shield className="size-4" />
                    Audit log
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setCmdOpen(true);
                  }}
                >
                  <Search className="size-4" />
                  Command menu
                  <span className="ml-auto font-mono type-xs text-[var(--text-muted)]">
                    {modKey}K
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void auth.logout();
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </TooltipProvider>

      <EdgeCommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
