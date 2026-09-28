import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "flat";

export function KpiCard({
  label,
  value,
  hint,
  trend,
  trendLabel,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: Trend;
  trendLabel?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const tone =
    trend === "down" ? "danger" : trend === "up" ? "success" : "info";
  return (
    <section className={cn("elevation-0 rounded-[var(--radius-md)] bg-[var(--surface)] p-[var(--space-4)]", className)}>
      <p className="type-sm text-[var(--text-secondary)]">{label}</p>
      <p className="type-2xl mt-[var(--space-1)] text-[var(--text-primary)]">{value}</p>
      {trendLabel || hint ? (
        <p className="mt-[var(--space-2)] inline-flex items-center gap-[var(--space-1)]">
          <span
            className={cn(
              "inline-flex items-center rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-1)] type-xs",
              tone === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
              tone === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
              tone === "info" && "bg-[var(--primary-soft)] text-[var(--primary)]",
            )}
          >
            {trend === "down" ? "↓" : trend === "up" ? "↑" : null} {trendLabel ?? hint}
          </span>
        </p>
      ) : null}
      {icon ? <span className="sr-only">{icon}</span> : null}
    </section>
  );
}
