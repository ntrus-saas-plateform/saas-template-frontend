"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/messages";
import {
  PreferencesContext,
  applyPreferencesToDocument,
  usePreferences,
  type Density,
  type Theme,
} from "@/providers/preferences-provider";

/**
 * Ephemeral SESSION layer (§55).
 * Overlays USER preferences for this browser tab without writing localStorage
 * or tenant preference stores.
 */
type SessionContextState = {
  sessionOverrides: Readonly<Record<string, unknown>>;
  setSessionOverride: (key: string, value: unknown) => void;
  clearSessionOverrides: () => void;
};

const SessionCtx = createContext<SessionContextState | null>(null);
const STORAGE_KEY = "edge.sessionOverrides";

function readStored(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function asLocale(v: unknown): Locale | null {
  return v === "en" || v === "fr" ? v : null;
}

function asTheme(v: unknown): Theme | null {
  return v === "system" || v === "light" || v === "dark" ? v : null;
}

function asDensity(v: unknown): Density | null {
  return v === "comfortable" || v === "compact" ? v : null;
}

export function SessionContextProvider({ children }: { children: ReactNode }) {
  const userPrefs = usePreferences();
  const [sessionOverrides, setOverrides] =
    useState<Record<string, unknown>>(readStored);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionOverrides));
  }, [sessionOverrides]);

  const merged = useMemo(() => {
    const locale =
      asLocale(sessionOverrides["localization.locale"]) ?? userPrefs.locale;
    const theme = asTheme(sessionOverrides["ui.theme"]) ?? userPrefs.theme;
    const density =
      asDensity(sessionOverrides["ui.density"]) ?? userPrefs.density;
    const reducedMotion =
      typeof sessionOverrides["accessibility.reducedMotion"] === "boolean"
        ? sessionOverrides["accessibility.reducedMotion"]
        : typeof sessionOverrides["ui.reducedMotion"] === "boolean"
          ? sessionOverrides["ui.reducedMotion"]
          : userPrefs.reducedMotion;
    const timezone =
      typeof sessionOverrides["localization.timezone"] === "string" &&
      sessionOverrides["localization.timezone"]
        ? sessionOverrides["localization.timezone"]
        : userPrefs.timezone;
    const hour12 =
      sessionOverrides["localization.timeFormat"] === "12h"
        ? true
        : sessionOverrides["localization.timeFormat"] === "24h"
          ? false
          : userPrefs.hour12;

    return {
      ...userPrefs,
      locale,
      theme,
      density,
      reducedMotion,
      timezone,
      hour12,
      // Setters always persist USER base (never session).
      setLocale: userPrefs.setLocale,
      setTheme: userPrefs.setTheme,
      setDensity: userPrefs.setDensity,
      setReducedMotion: userPrefs.setReducedMotion,
      setSidebarCollapsed: userPrefs.setSidebarCollapsed,
      setAtlasTheme: userPrefs.setAtlasTheme,
      setTimezone: userPrefs.setTimezone,
      setHour12: userPrefs.setHour12,
      toggleSidebar: userPrefs.toggleSidebar,
    };
  }, [userPrefs, sessionOverrides]);

  useEffect(() => {
    applyPreferencesToDocument(merged);
  }, [merged.locale, merged.theme, merged.density, merged.reducedMotion]);

  const setSessionOverride = useCallback((key: string, value: unknown) => {
    setOverrides((prev) => {
      if (value === undefined || value === null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearSessionOverrides = useCallback(() => {
    setOverrides({});
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const sessionValue = useMemo(
    () => ({
      sessionOverrides,
      setSessionOverride,
      clearSessionOverrides,
    }),
    [sessionOverrides, setSessionOverride, clearSessionOverrides],
  );

  return (
    <SessionCtx.Provider value={sessionValue}>
      <PreferencesContext.Provider value={merged}>
        {children}
      </PreferencesContext.Provider>
    </SessionCtx.Provider>
  );
}

export function useSessionContext(): SessionContextState {
  const ctx = useContext(SessionCtx);
  if (!ctx) {
    throw new Error(
      "useSessionContext must be used within SessionContextProvider",
    );
  }
  return ctx;
}

export function useSessionOverrides(): Readonly<Record<string, unknown>> {
  const ctx = useContext(SessionCtx);
  return ctx?.sessionOverrides ?? {};
}
