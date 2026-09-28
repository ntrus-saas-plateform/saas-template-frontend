"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Maximize2, Minimize2, Moon, Sun } from "lucide-react";
import { useA11y } from "@/providers/a11y-provider";
import { useModuleTheme } from "@/providers/module-theme-provider";
import { usePreferences } from "@/providers/preferences-provider";
import { getTheme, siblingTheme, themeFamilies } from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function useFullscreen() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* browser or policy blocked fullscreen */
    }
  }, []);

  return { active, toggle };
}

function toolBtnClass(collapsed: boolean) {
  return cn(
    "flex w-full items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] text-left type-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
    collapsed ? "h-10 justify-center px-[var(--space-2)]" : "h-9",
  );
}

function ToolTipWrap({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!collapsed) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarWorkspaceTools({ collapsed }: { collapsed: boolean }) {
  const { locale } = usePreferences();
  const fr = locale === "fr";
  const { activeTheme, isDarkMode } = useModuleTheme();
  const { applyAtlasTheme } = useA11y();
  const { active: fullscreen, toggle: toggleFullscreen } = useFullscreen();
  const theme = getTheme(activeTheme);

  const pickFamily = (family: string) => {
    const match = themeFamilies
      .find((g) => g.family === family)
      ?.themes.find((t) => t.mode === theme.mode);
    if (match) applyAtlasTheme(match.id);
  };

  const themeTrigger = (
    <button
      type="button"
      className={toolBtnClass(collapsed)}
      aria-label={fr ? "Choisir un thème" : "Choose theme"}
    >
      <span
        aria-hidden
        className="size-3.5 shrink-0 rounded-full border border-[var(--border)]"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0 50%, ${theme.colors.accent} 50% 100%)`,
        }}
      />
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate">{theme.name}</span>
      ) : null}
    </button>
  );

  return (
    <div className="flex flex-col gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{themeTrigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          side={collapsed ? "right" : "top"}
          align="start"
          className="max-h-80 w-64 overflow-y-auto"
        >
          <DropdownMenuLabel>{fr ? "Thèmes" : "Themes"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themeFamilies.map((group) => {
            const sample =
              group.themes.find((t) => t.mode === theme.mode) ?? group.themes[0];
            const selected = group.family === theme.family;
            return (
              <DropdownMenuItem
                key={group.family}
                onSelect={() => pickFamily(group.family)}
                className={cn(
                  selected && "bg-[var(--primary-soft)] font-semibold",
                )}
              >
                <span
                  aria-hidden
                  className="size-3.5 shrink-0 rounded-full border border-[var(--border)]"
                  style={{
                    background: `linear-gradient(135deg, ${sample.colors.primary} 0 50%, ${sample.colors.accent} 50% 100%)`,
                  }}
                />
                <span className="min-w-0 flex-1 truncate">{group.family}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolTipWrap
        collapsed={collapsed}
        label={isDarkMode ? (fr ? "Clair" : "Light") : (fr ? "Sombre" : "Dark")}
      >
        <button
          type="button"
          className={toolBtnClass(collapsed)}
          onClick={() => applyAtlasTheme(siblingTheme(activeTheme))}
          aria-label={
            isDarkMode
              ? fr
                ? "Thème clair"
                : "Light theme"
              : fr
                ? "Thème sombre"
                : "Dark theme"
          }
        >
          {isDarkMode ? (
            <Sun className="size-[var(--icon-sm)] shrink-0" aria-hidden />
          ) : (
            <Moon className="size-[var(--icon-sm)] shrink-0" aria-hidden />
          )}
          {!collapsed ? (
            <span>
              {isDarkMode ? (fr ? "Clair" : "Light") : (fr ? "Sombre" : "Dark")}
            </span>
          ) : null}
        </button>
      </ToolTipWrap>

      <ToolTipWrap
        collapsed={collapsed}
        label={
          fullscreen
            ? fr
              ? "Quitter le plein écran"
              : "Exit fullscreen"
            : fr
              ? "Plein écran"
              : "Fullscreen"
        }
      >
        <button
          type="button"
          className={toolBtnClass(collapsed)}
          onClick={() => void toggleFullscreen()}
          aria-label={
            fullscreen
              ? fr
                ? "Quitter le plein écran"
                : "Exit fullscreen"
              : fr
                ? "Plein écran"
                : "Fullscreen"
          }
        >
          {fullscreen ? (
            <Minimize2 className="size-[var(--icon-sm)] shrink-0" aria-hidden />
          ) : (
            <Maximize2 className="size-[var(--icon-sm)] shrink-0" aria-hidden />
          )}
          {!collapsed ? (
            <span>
              {fullscreen
                ? fr
                  ? "Quitter le plein écran"
                  : "Exit fullscreen"
                : fr
                  ? "Plein écran"
                  : "Fullscreen"}
            </span>
          ) : null}
        </button>
      </ToolTipWrap>
    </div>
  );
}
