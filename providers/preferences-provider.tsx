"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/messages";
import { isThemeKnown, type AtlasThemeId } from "@/lib/themes";

export type Theme = "system" | "light" | "dark";
export type Density = "comfortable" | "compact";

export type PreferencesState = {
  locale: Locale;
  sidebarCollapsed: boolean;
  theme: Theme;
  density: Density;
  reducedMotion: boolean;
  atlasTheme: AtlasThemeId;
  timezone: string;
  hour12: boolean;
  setLocale: (l: Locale) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
  setReducedMotion: (v: boolean) => void;
  setAtlasTheme: (id: AtlasThemeId) => void;
  setTimezone: (tz: string) => void;
  setHour12: (v: boolean) => void;
  toggleSidebar: () => void;
};

export const PreferencesContext = createContext<PreferencesState | null>(null);

const LOCALE_KEY = "edge.locale";
const SIDEBAR_KEY = "edge.sidebarCollapsed";
const THEME_KEY = "edge.theme";
const DENSITY_KEY = "edge.density";
const MOTION_KEY = "edge.reducedMotion";
const ATLAS_THEME_KEY = "edge.atlasTheme";
const TIMEZONE_KEY = "edge.timezone";
const HOUR12_KEY = "edge.hour12";

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === "en" || stored === "fr") return stored;
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function readSidebar(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_KEY) === "1";
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function readDensity(): Density {
  if (typeof window === "undefined") return "comfortable";
  const v = localStorage.getItem(DENSITY_KEY);
  if (v === "compact" || v === "comfortable") return v;
  return "comfortable";
}

function readMotion(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MOTION_KEY) === "1";
}

function readAtlasTheme(): AtlasThemeId {
  if (typeof window === "undefined") return "corp-light";
  const v = localStorage.getItem(ATLAS_THEME_KEY);
  return v && isThemeKnown(v) ? v : "corp-light";
}

function readTimezone(): string {
  if (typeof window === "undefined") return "UTC";
  return localStorage.getItem(TIMEZONE_KEY) || "UTC";
}

function readHour12(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HOUR12_KEY) === "1";
}

export function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
}

export function applyPreferencesToDocument(prefs: {
  locale: Locale;
  theme: Theme;
  density: Density;
  reducedMotion: boolean;
}) {
  document.documentElement.setAttribute("lang", prefs.locale);
  applyThemeToDocument(prefs.theme);
  document.documentElement.dataset.density = prefs.density;
  document.documentElement.dataset.reducedMotion = prefs.reducedMotion
    ? "true"
    : "false";
}

/**
 * USER-layer preferences provider (persisted to localStorage).
 * Session overlays (§55) are applied by SessionContextProvider nesting
 * a merged PreferencesContext — setters still write this USER base.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  const [sidebarCollapsed, setSidebarCollapsedState] =
    useState<boolean>(readSidebar);
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [density, setDensityState] = useState<Density>(readDensity);
  const [reducedMotion, setReducedMotionState] = useState(readMotion);
  const [atlasTheme, setAtlasThemeState] = useState<AtlasThemeId>(readAtlasTheme);
  const [timezone, setTimezoneState] = useState(readTimezone);
  const [hour12, setHour12State] = useState(readHour12);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem(MOTION_KEY, reducedMotion ? "1" : "0");
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem(ATLAS_THEME_KEY, atlasTheme);
  }, [atlasTheme]);

  useEffect(() => {
    localStorage.setItem(TIMEZONE_KEY, timezone);
  }, [timezone]);

  useEffect(() => {
    localStorage.setItem(HOUR12_KEY, hour12 ? "1" : "0");
  }, [hour12]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsedState((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<PreferencesState>(
    () => ({
      locale,
      sidebarCollapsed,
      theme,
      density,
      reducedMotion,
      atlasTheme,
      timezone,
      hour12,
      setLocale: setLocaleState,
      setSidebarCollapsed: setSidebarCollapsedState,
      setTheme: setThemeState,
      setDensity: setDensityState,
      setReducedMotion: setReducedMotionState,
      setAtlasTheme: setAtlasThemeState,
      setTimezone: setTimezoneState,
      setHour12: setHour12State,
      toggleSidebar: () => setSidebarCollapsedState((v) => !v),
    }),
    [
      locale,
      sidebarCollapsed,
      theme,
      density,
      reducedMotion,
      atlasTheme,
      timezone,
      hour12,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
