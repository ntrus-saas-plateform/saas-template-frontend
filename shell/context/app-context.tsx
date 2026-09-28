"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  applicationRegistry,
  resolveAppStatus,
} from "@/shell/applications/registry";
import type {
  AppLifecycleStatus,
  ApplicationManifest,
} from "@/shell/applications/types";
import { usePlatform } from "@/providers/platform-provider";

type ResolvedApp = ApplicationManifest & { status: AppLifecycleStatus };

type AppContextValue = {
  currentAppId: string;
  setCurrentAppId: (id?: string) => void;
  apps: ResolvedApp[];
  currentApp: ResolvedApp;
};

const AppContext = createContext<AppContextValue | null>(null);

function appIdFromPath(pathname: string): string {
  // Identity + settings belong to Core (footer), not a separate shell app.
  if (pathname.startsWith("/identity") || pathname.startsWith("/settings"))
    return "core";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/apps/")) {
    const id = pathname.split("/")[2];
    if (id) return id;
  }
  return "core";
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { capabilities, context } = usePlatform();
  const currentAppId = appIdFromPath(pathname);

  const apps = useMemo(
    () =>
      applicationRegistry.map((m) => ({
        ...m,
        status: resolveAppStatus(m, capabilities, context),
      })),
    [capabilities, context],
  );

  const currentApp = apps.find((a) => a.id === currentAppId) ?? apps[0];

  const value = useMemo(
    () => ({
      currentAppId: currentApp.id,
      setCurrentAppId: () => undefined,
      apps,
      currentApp,
    }),
    [apps, currentApp],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return ctx;
}
