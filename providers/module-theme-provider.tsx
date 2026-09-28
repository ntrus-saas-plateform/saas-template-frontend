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
import { usePathname } from "next/navigation";
import { usePreferences } from "@/providers/preferences-provider";
import {
  derivePalette,
  getTheme,
  isThemeKnown,
  LEGACY_MODULE_TO_THEME,
  mix,
  resolveModuleTheme,
  siblingTheme,
  type AtlasThemeId,
} from "@/lib/themes";

function mixTowardBlack(hex: string, amt: number) {
  return mix(hex, "#000000", amt);
}

type ModuleThemeContextValue = {
  activeTheme: AtlasThemeId;
  setActiveTheme: (id: AtlasThemeId) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ModuleThemeContext = createContext<ModuleThemeContextValue | undefined>(
  undefined,
);

const LEGACY_MODULE_KEY = "edge.moduleTheme.active";
const LEGACY_DARK_KEY = "edge.moduleTheme.dark";

export function applyTheme(themeId: AtlasThemeId) {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  root.classList.toggle("dark", theme.mode === "dark");
  root.setAttribute("data-theme", theme.mode);

  const c = theme.colors;
  const d = derivePalette(theme);
  const vars: Record<string, string> = {
    "--primary": c.primary,
    "--primary-hover": d.primaryHover,
    "--primary-active": mixTowardBlack(c.primary, 0.18),
    "--on-primary": c.onPrimary,
    "--secondary": c.secondary,
    "--on-secondary": "#ffffff",
    "--accent": c.accent,
    "--success": c.success,
    "--warning": c.warning,
    "--danger": c.danger,
    "--info": c.info,
    "--success-soft": d.successSoft,
    "--warning-soft": d.warningSoft,
    "--danger-soft": d.dangerSoft,
    "--info-soft": d.infoSoft,
    "--primary-soft": d.primarySoft,
    "--bg-app": c.bgApp,
    "--bg-surface": c.bgSurface,
    "--bg-elevated": c.bgSurface,
    "--text-primary": c.textPrimary,
    "--text-secondary": c.textSecondary,
    "--text-muted": c.textMuted,
    "--border": c.border,
    "--border-strong": c.borderStrong,
    "--radius": "10px",
    "--radius-sm": "6px",
    "--radius-md": "10px",
    "--elevation-1-shadow": "0 2px 8px rgba(0, 0, 0, 0.08)",
    "--elevation-2-shadow": "0 8px 24px rgba(0, 0, 0, 0.16)",
    "--shadow-sm": "0 2px 8px rgba(0, 0, 0, 0.08)",
    "--shadow-md": "0 8px 24px rgba(0, 0, 0, 0.16)",

    "--background": c.bgApp,
    "--surface": c.bgSurface,
    "--surface-elevated": c.bgSurface,
    "--surface-muted": d.surfaceMuted,
    "--card": c.bgSurface,
    "--foreground": c.textPrimary,
    "--primary-foreground": c.onPrimary,
    "--secondary-foreground": "#ffffff",
    "--accent-foreground": c.onPrimary,
    "--muted-foreground": c.textMuted,
    "--ring": c.primary,
    "--neutral": c.textMuted,
  };

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function ModuleThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const prefs = usePreferences();
  const [legacyTheme, setLegacyTheme] = useState<AtlasThemeId | null>(null);
  const activeTheme = prefs.atlasTheme;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const legacyModule = localStorage.getItem(LEGACY_MODULE_KEY);
    const legacyDark = localStorage.getItem(LEGACY_DARK_KEY) === "1";
    const base = legacyModule ? LEGACY_MODULE_TO_THEME[legacyModule] : undefined;
    if (base) setLegacyTheme(legacyDark ? siblingTheme(base) : base);
  }, []);

  // Migrate legacy module-theme storage once, while keeping later choices global.
  useEffect(() => {
    if (legacyTheme && prefs.atlasTheme === "corp-light") {
      prefs.setAtlasTheme(legacyTheme);
    }
  }, [legacyTheme, prefs]);

  // Route mappings remain available as a reference, but never overwrite a user choice.
  void pathname;
  void resolveModuleTheme;

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const setActiveTheme = useCallback((id: AtlasThemeId) => {
    prefs.setAtlasTheme(id);
  }, [prefs]);

  const toggleDarkMode = useCallback(() => {
    prefs.setAtlasTheme(siblingTheme(prefs.atlasTheme));
  }, [prefs]);

  const value = useMemo<ModuleThemeContextValue>(() => {
    const theme = getTheme(activeTheme);
    return {
      activeTheme,
      setActiveTheme,
      isDarkMode: theme.mode === "dark",
      toggleDarkMode,
    };
  }, [activeTheme, setActiveTheme, toggleDarkMode]);

  return (
    <ModuleThemeContext.Provider value={value}>
      {children}
    </ModuleThemeContext.Provider>
  );
}

export function useModuleTheme() {
  const context = useContext(ModuleThemeContext);
  if (!context) {
    throw new Error("useModuleTheme must be used inside ModuleThemeProvider");
  }
  return context;
}