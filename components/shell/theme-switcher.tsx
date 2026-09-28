"use client";

import { useState, type ComponentType } from "react";
import { Check, Copy, Dices, Moon, Palette, Sun } from "lucide-react";
import { useModuleTheme } from "@/providers/module-theme-provider";
import {
  buildThemeCss,
  derivePalette,
  getTheme,
  THEMES,
  themeFamilies,
  TOKEN_LABELS,
  type AtlasThemeId,
} from "@/lib/themes";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ className?: string }>;

function ThemeSwitcherButton({
  icon: Icon,
  children,
  primary,
  onClick,
}: {
  icon: Icon;
  children: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
        primary
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95"
          : "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

export function ThemeSwitcher() {
  const { activeTheme, setActiveTheme, isDarkMode, toggleDarkMode } =
    useModuleTheme();
  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const theme = getTheme(activeTheme);
  const palette = theme.colors;

  const copyCss = async () => {
    const css = buildThemeCss(theme);
    try {
      await navigator.clipboard.writeText(css);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = css;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const copyToken = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 1400);
  };

  const randomTheme = () => {
    const others = THEMES.filter((t) => t.id !== activeTheme);
    setActiveTheme(others[Math.floor(Math.random() * others.length)].id);
  };

  const onPick = (id: AtlasThemeId) => setActiveTheme(id);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-muted)]/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)]">
            <Palette className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Atlas ERP — theme library
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              36 complete themes · live preview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcherButton icon={Dices} onClick={randomTheme}>
            Random
          </ThemeSwitcherButton>
          <ThemeSwitcherButton
            icon={isDarkMode ? Sun : Moon}
            onClick={toggleDarkMode}
          >
            {isDarkMode ? "Light" : "Dark"}
          </ThemeSwitcherButton>
          <ThemeSwitcherButton icon={Copy} primary onClick={copyCss}>
            Export CSS
          </ThemeSwitcherButton>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <nav
          aria-label="Theme families"
          className="max-h-[26rem] space-y-1 overflow-y-auto pr-1"
        >
          {themeFamilies.map((group) => (
            <div key={group.family}>
              <p className="px-2 pb-1 pt-3.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] first:pt-0">
                {group.family}
              </p>
              {group.themes.map((item) => {
                const isActive = item.id === activeTheme;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPick(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                      isActive
                        ? "border border-[var(--primary)] bg-[var(--primary-soft)] font-semibold text-[var(--text-primary)]"
                        : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-[15px] shrink-0 rounded-full border border-[rgba(127,127,127,0.25)]"
                      style={{
                        background: `linear-gradient(135deg, ${item.colors.primary} 0 50%, ${item.colors.accent} 50% 100%)`,
                      }}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9.5px]",
                        isActive
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--surface-muted)] text-[var(--text-muted)]",
                      )}
                    >
                      {item.modeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {theme.name}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {theme.modeLabel} · {theme.family}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {TOKEN_LABELS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => copyToken(palette[key], label)}
                title="Click to copy"
                className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)]/50 px-2 py-1.5 text-left transition-colors hover:border-[var(--border-strong)]"
              >
                <span
                  aria-hidden
                  className="size-[18px] shrink-0 rounded-[5px] border border-[rgba(127,127,127,0.2)]"
                  style={{ background: palette[key] }}
                />
                <span className="flex min-w-0 flex-col">
                  <b className="truncate text-[10.5px] leading-tight text-[var(--text-primary)]">
                    {copiedToken === label ? "Copied" : label}
                  </b>
                  <span className="truncate font-mono text-[10px] leading-tight text-[var(--text-muted)]">
                    {palette[key]}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Export
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-semibold",
                  copied ? "text-[var(--success)]" : "text-[var(--text-muted)]",
                )}
              >
                {copied ? <Check className="size-3" /> : null}
                {copied ? "CSS copied" : ""}
              </span>
            </div>
            <textarea
              readOnly
              value={buildThemeCss(theme)}
              spellCheck={false}
              className="h-44 w-full resize-none rounded-md border border-[var(--border)] bg-[var(--background)] p-2.5 font-mono text-[10.5px] leading-relaxed text-[var(--text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/30"
            />
          </div>

          <p className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/40 px-3 py-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
            Derived tokens:{" "}
            <code className="font-mono">primary-hover</code>,{" "}
            <code className="font-mono">primary-soft</code>,{" "}
            <code className="font-mono">success-soft</code>{" "}
            {derivePalette(theme).primaryHover}
          </p>
        </div>
      </div>
    </div>
  );
}