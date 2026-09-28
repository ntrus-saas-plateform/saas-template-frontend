import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const visible =
    items.length > 4
      ? [items[0]!, { label: "…" }, ...items.slice(-2)]
      : items;

  return (
    <nav aria-label="Fil d'Ariane" className={cn("type-xs text-[var(--text-muted)]", className)}>
      <ol className="flex flex-wrap items-center gap-[var(--space-1)]">
        {visible.map((item, index) => {
          const last = index === visible.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-[var(--space-1)]">
              {index > 0 ? (
                <ChevronRight
                  className="size-[var(--icon-sm)] text-[var(--text-muted)]"
                  aria-hidden
                />
              ) : null}
              {last || !item.href ? (
                <span
                  className={last ? "text-[var(--text-secondary)]" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
