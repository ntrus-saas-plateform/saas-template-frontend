"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppErrorBoundary } from "@/components/shell/error-boundary";
import { MobileNavDrawer } from "@/components/shell/mobile-bottom-nav";
import { OfflineBanner } from "@/components/shell/offline-banner";
import { ObservabilityBootstrap } from "@/components/shell/observability-bootstrap";
import { RouteAccessBoundary } from "@/components/shell/route-access-boundary";
import { RoutePrefetch } from "@/components/shell/route-prefetch";
import { ShellSidebar } from "@/components/shell/shell-sidebar";
import { ShellTopBar } from "@/components/shell/shell-top-bar";
import { TenantBrandingHooks } from "@/components/shell/tenant-branding";
import { cn } from "@/lib/utils";

export function ShellChrome({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const flushWorkspace = pathname.startsWith("/settings");

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-app)]">
      <ObservabilityBootstrap />
      <TenantBrandingHooks />
      <RoutePrefetch />
      <div className="hidden h-dvh shrink-0 sm:block">
        <ShellSidebar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ShellTopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <OfflineBanner />
        <main
          id="main-content"
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            !flushWorkspace &&
              "px-[var(--page-margin)] py-[var(--space-6)]",
          )}
        >
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto",
              flushWorkspace
                ? "overflow-hidden"
                : "mx-auto w-full max-w-[var(--page-max)]",
            )}
          >
            <AppErrorBoundary>
              <RouteAccessBoundary>{children}</RouteAccessBoundary>
            </AppErrorBoundary>
          </div>
        </main>
      </div>
      <MobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />
    </div>
  );
}
