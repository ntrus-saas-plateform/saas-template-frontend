"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { PlatformProvider } from "@/providers/platform-provider";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { PreferencesApiHydrator } from "@/providers/preferences-api-hydrator";
import { SessionContextProvider } from "@/providers/session-context-provider";
import { PersonalizationProvider } from "@/providers/personalization-provider";
import { ModuleThemeProvider } from "@/providers/module-theme-provider";
import { AppContextProvider } from "@/shell/context/app-context";
import { CommandPaletteProvider } from "@/shell/commands/command-palette-context";
import { CommandPalette } from "@/components/shell/command-palette";
import { ToastProvider } from "@/components/feedback/toast";
import dynamic from "next/dynamic";
import { A11yProvider } from "@/providers/a11y-provider";

const AccessibilityFab = dynamic(
  () =>
    import("@/components/a11y/accessibility-fab").then((m) => m.AccessibilityFab),
  { ssr: false },
);

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <SessionContextProvider>
          <ModuleThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <PlatformProvider>
                  <A11yProvider>
                    <PreferencesApiHydrator />
                    <AppContextProvider>
                      <PersonalizationProvider>
                        <CommandPaletteProvider>
                          {children}
                          <CommandPalette />
                          <AccessibilityFab />
                        </CommandPaletteProvider>
                      </PersonalizationProvider>
                    </AppContextProvider>
                  </A11yProvider>
                </PlatformProvider>
              </AuthProvider>
            </ToastProvider>
          </ModuleThemeProvider>
        </SessionContextProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
