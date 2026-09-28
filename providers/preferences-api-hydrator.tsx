"use client";

import { useEffect, useRef } from "react";
import { identityApi } from "@/lib/api/identity";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { usePreferences } from "@/providers/preferences-provider";
import { useSessionOverrides } from "@/providers/session-context-provider";
import { isThemeKnown } from "@/lib/themes";

/** One-shot hydrate of USER prefs from API — never overwrites SESSION overrides (§55). */
export function PreferencesApiHydrator() {
  const client = useApiClient();
  const { apiBaseReady } = usePlatform();
  const prefs = usePreferences();
  const sessionOverrides = useSessionOverrides();
  const done = useRef(false);

  useEffect(() => {
    if (!apiBaseReady || done.current) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await identityApi(client).users.preferences.get();
        if (cancelled) return;
        const settings = res.data?.settings ?? {};

        const locale = settings["localization.locale"];
        if (
          (locale === "en" || locale === "fr") &&
          sessionOverrides["localization.locale"] === undefined
        ) {
          prefs.setLocale(locale);
        }
        if (
          typeof settings["ui.sidebarCollapsed"] === "boolean" &&
          sessionOverrides["ui.sidebarCollapsed"] === undefined
        ) {
          prefs.setSidebarCollapsed(settings["ui.sidebarCollapsed"]);
        }
        const theme = settings["ui.theme"];
        if (
          (theme === "system" || theme === "light" || theme === "dark") &&
          sessionOverrides["ui.theme"] === undefined
        ) {
          prefs.setTheme(theme);
        }
        const density = settings["ui.density"];
        if (
          (density === "comfortable" || density === "compact") &&
          sessionOverrides["ui.density"] === undefined
        ) {
          prefs.setDensity(density);
        }
        const motion =
          typeof settings["accessibility.reducedMotion"] === "boolean"
            ? settings["accessibility.reducedMotion"]
            : typeof settings["ui.reducedMotion"] === "boolean"
              ? settings["ui.reducedMotion"]
              : undefined;
        if (
          typeof motion === "boolean" &&
          sessionOverrides["accessibility.reducedMotion"] === undefined &&
          sessionOverrides["ui.reducedMotion"] === undefined
        ) {
          prefs.setReducedMotion(motion);
        }
        const atlas = settings["ui.atlasTheme"];
        if (
          typeof atlas === "string" &&
          isThemeKnown(atlas) &&
          sessionOverrides["ui.atlasTheme"] === undefined
        ) {
          prefs.setAtlasTheme(atlas);
        }
        const tz = settings["localization.timezone"];
        if (
          typeof tz === "string" &&
          tz.length > 0 &&
          sessionOverrides["localization.timezone"] === undefined
        ) {
          prefs.setTimezone(tz);
        }
        const timeFormat = settings["localization.timeFormat"];
        if (
          (timeFormat === "12h" || timeFormat === "24h") &&
          sessionOverrides["localization.timeFormat"] === undefined
        ) {
          prefs.setHour12(timeFormat === "12h");
        }
        done.current = true;
      } catch {
        // keep localStorage defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBaseReady, client, prefs, sessionOverrides]);

  return null;
}
