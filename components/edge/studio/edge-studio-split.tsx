"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EdgeStudioSplit({
  master,
  detail,
  className,
  masterClassName,
  detailClassName,
}: {
  master: ReactNode;
  detail?: ReactNode;
  className?: string;
  masterClassName?: string;
  detailClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-[var(--space-4)] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]",
        className,
      )}
      data-testid="edge-studio-split"
    >
      <div className={cn("min-w-0", masterClassName)}>{master}</div>
      {detail != null ? (
        <aside
          className={cn(
            "min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]",
            detailClassName,
          )}
        >
          {detail}
        </aside>
      ) : null}
    </div>
  );
}
