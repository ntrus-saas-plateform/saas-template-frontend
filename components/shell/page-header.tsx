import type { ReactNode } from "react";
import { Inbox, AlertCircle } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-[var(--space-6)] py-[var(--space-8)] text-center">
      <Inbox className="size-[var(--icon-lg)] text-[var(--text-muted)]" aria-hidden />
      <h2 className="type-md text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-md type-sm text-[var(--text-secondary)]">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-md)] elevation-0 bg-[var(--bg-surface)] p-[var(--space-5)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <AlertCircle className="size-[var(--icon-md)] text-[var(--danger)]" aria-hidden />
        <h2 className="type-md text-[var(--danger)]">{title}</h2>
      </div>
      <p className="max-w-md type-sm text-[var(--text-secondary)]">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}

export type PageHeaderBack = {
  /** Explicit parent route; when omitted the previous history entry is used. */
  href?: string;
  /** Destination used when there is no history to go back to. */
  fallbackHref?: string;
  label?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  crumbs,
  back,
  status,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: string;
  crumbs?: BreadcrumbItem[];
  back?: PageHeaderBack | boolean;
  status?: ReactNode;
  className?: string;
}) {
  const items: BreadcrumbItem[] | undefined =
    crumbs ??
    (breadcrumb
      ? breadcrumb.split(/\s*[>/]\s*/).map((label) => ({ label }))
      : undefined);

  const backConfig: PageHeaderBack | null = back
    ? typeof back === "object"
      ? back
      : (() => {
          const parent = items && items.length > 1 ? items[items.length - 2] : undefined;
          return {
            href: parent?.href,
            fallbackHref: parent?.href,
          };
        })()
    : null;

  return (
    <div className={cn("mb-[var(--space-6)] shrink-0", className)}>
      {backConfig ? (
        <div className="mb-[var(--space-2)]">
          <BackLink
            href={backConfig.href}
            fallbackHref={backConfig.fallbackHref}
            label={backConfig.label}
          />
        </div>
      ) : null}
      {items?.length ? (
        <Breadcrumb items={items} className="mb-[var(--space-2)]" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
        <div className="flex min-w-0 items-center gap-[var(--space-3)]">
          <h1 className="type-xl text-[var(--text-primary)]">{title}</h1>
          {status}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-[var(--space-2)]">
            {actions}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className={cn("mt-[var(--space-1)] max-w-prose type-sm text-[var(--text-secondary)]")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
