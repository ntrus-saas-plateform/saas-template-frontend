"use client";

import type { ReactNode } from "react";
import { EdgeStudioPageHeader } from "@/components/edge/studio/edge-studio-page-header";
import {
  EdgeStudioSectionNav,
  type StudioSectionGroup,
} from "@/components/edge/studio/edge-studio-section-nav";
import { cn } from "@/lib/utils";

export function EdgeStudioShell({
  title,
  description,
  actions,
  groups,
  section,
  onSectionChange,
  children,
  className,
  testId = "edge-studio-shell",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  groups: StudioSectionGroup[];
  section: string;
  onSectionChange: (id: string) => void;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={cn("space-y-[var(--space-5)]", className)}
      data-testid={testId}
      data-studio-shell=""
    >
      <EdgeStudioPageHeader
        title={title}
        description={description}
        actions={actions}
      />
      <div className="flex flex-col gap-[var(--space-5)] lg:flex-row lg:items-start">
        <EdgeStudioSectionNav
          groups={groups}
          value={section}
          onChange={onSectionChange}
        />
        <main className="min-w-0 flex-1 space-y-[var(--space-4)]" data-testid="edge-studio-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export type { StudioSectionGroup, StudioSectionItem } from "@/components/edge/studio/edge-studio-section-nav";
