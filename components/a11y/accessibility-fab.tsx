"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Accessibility, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import {
  DEFAULT_FAB_POSITION,
  useA11y,
  type FabPosition,
  type TextScale,
} from "@/providers/a11y-provider";
import { useModuleTheme } from "@/providers/module-theme-provider";
import { usePreferences } from "@/providers/preferences-provider";
import {
  getTheme,
  siblingTheme,
  themeFamilies,
  type AtlasThemeId,
} from "@/lib/themes";

const SIZE = 56;
const MARGIN = 32;
const STEP = 16;
const STEP_FAST = 48;
const MENU_WIDTH = 340;

function SwitchRow({
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[var(--touch-min)] w-full items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-sm)] px-[var(--space-2)] text-left hover:bg-[var(--surface-muted)]"
    >
      <span className="type-sm text-[var(--text-primary)]">{label}</span>
      <span className="inline-flex items-center gap-[var(--space-2)]">
        <span className="type-xs text-[var(--text-secondary)]" aria-hidden>
          {checked ? onLabel : offLabel}
        </span>
        <span
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-[var(--radius-full)]",
            checked ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-[var(--radius-full)] bg-[var(--bg-surface)] transition-transform",
              checked ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </span>
      </span>
    </button>
  );
}

function clampPosition(pos: FabPosition, vw: number, vh: number): FabPosition {
  const maxY = Math.max(MARGIN, vh - SIZE - MARGIN);
  const y = pos.y < 0 ? maxY : Math.min(maxY, Math.max(MARGIN, pos.y));
  return { edge: pos.edge, y };
}

export function AccessibilityFab() {
  const a11y = useA11y();
  const { locale } = usePreferences();
  const fr = locale === "fr";
  const { activeTheme, isDarkMode } = useModuleTheme();
  const menuId = useId();
  const titleId = useId();
  const familyId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    orig: { x: number; y: number };
  } | null>(null);

  const resolved = useCallback((): {
    left: number;
    top: number;
    edge: "left" | "right";
  } => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pos = clampPosition(a11y.fabPosition, vw, vh);
    const left = pos.edge === "left" ? MARGIN : vw - SIZE - MARGIN;
    const top = pos.y < 0 ? vh - SIZE - MARGIN : pos.y;
    return { left, top, edge: pos.edge };
  }, [a11y.fabPosition]);

  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    edge: "left" | "right";
  }>({ left: 0, top: 0, edge: "right" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const apply = () => setCoords(resolved());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [mounted, resolved]);

  const snapAndSave = (left: number, top: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge: FabPosition["edge"] =
      left + SIZE / 2 < vw / 2 ? "left" : "right";
    const next = clampPosition({ edge, y: top }, vw, vh);
    a11y.setFabPosition(next);
    setCoords({
      left: next.edge === "left" ? MARGIN : vw - SIZE - MARGIN,
      top: next.y,
      edge: next.edge,
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: coords.left, y: coords.top },
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(
      vw - SIZE - MARGIN,
      Math.max(MARGIN, drag.current.orig.x + dx),
    );
    const top = Math.min(
      vh - SIZE - MARGIN,
      Math.max(MARGIN, drag.current.orig.y + dy),
    );
    setCoords((c) => ({ ...c, left, top }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const moved =
      Math.abs(e.clientX - drag.current.startX) > 4 ||
      Math.abs(e.clientY - drag.current.startY) > 4;
    drag.current = null;
    setDragging(false);
    if (moved) snapAndSave(coords.left, coords.top);
    else setMenuOpen((o) => !o);
  };

  const moveBy = (dx: number, dy: number) => {
    snapAndSave(coords.left + dx, coords.top + dy);
  };

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    btnRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (menuOpen) return;
    const step = e.shiftKey ? STEP_FAST : STEP;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveBy(-step, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveBy(step, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveBy(0, -step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveBy(0, step);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMenuOpen(true);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const panel = panelRef.current;
    closeRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeMenu();
        return;
      }
      if (ev.key !== "Tab" || !panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusables.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen, closeMenu]);

  const menuStyle = (() => {
    const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    const compact = vw < 640;
    if (compact) {
      return {
        left: 12,
        right: 12,
        top: undefined as number | undefined,
        bottom: 12,
        width: undefined as number | undefined,
        maxHeight: Math.floor(vh * 0.82),
      };
    }
    const openLeft =
      coords.edge === "right"
        ? coords.left - MENU_WIDTH - 8
        : coords.left + SIZE + 8;
    const left = Math.min(vw - MENU_WIDTH - 8, Math.max(8, openLeft));
    const maxH = Math.min(560, Math.floor(vh * 0.78));
    const top = Math.min(vh - maxH - 8, Math.max(8, coords.top - 8));
    return { left, right: undefined, top, bottom: undefined, width: MENU_WIDTH, maxHeight: maxH };
  })();

  const scales: { id: TextScale; label: string }[] = [
    { id: "normal", label: fr ? "Normal" : "Default" },
    { id: "large", label: fr ? "Grand" : "Large" },
    { id: "xlarge", label: fr ? "Très grand" : "Largest" },
  ];

  const theme = getTheme(activeTheme);

  const onPickTheme = (id: AtlasThemeId) => {
    a11y.applyAtlasTheme(id);
  };

  const onFamilyChange = (family: string) => {
    const group = themeFamilies.find((g) => g.family === family);
    const next =
      group?.themes.find((t) => t.mode === theme.mode) ?? group?.themes[0];
    if (next) onPickTheme(next.id);
  };

  const onToggleMode = (mode: "light" | "dark") => {
    if (theme.mode === mode) return;
    a11y.applyAtlasTheme(siblingTheme(activeTheme));
  };

  if (!mounted) return null;

  const sizePx = `${SIZE}px`;
  const placed = coords.left > 0 || coords.top > 0 || dragging;
  const onLabel = fr ? "Activé" : "On";
  const offLabel = fr ? "Désactivé" : "Off";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={fr ? "Options d'accessibilité" : "Accessibility options"}
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        tabIndex={menuOpen ? -1 : 0}
        className="fixed flex items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary)] text-[var(--on-primary)] elevation-2 touch-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        style={{
          width: sizePx,
          height: sizePx,
          zIndex: "var(--z-a11y)",
          ...(placed
            ? { left: `${coords.left}px`, top: `${coords.top}px` }
            : {
                bottom: "var(--space-6)",
                right:
                  a11y.fabPosition.edge === "left" ? "auto" : "var(--space-6)",
                left:
                  a11y.fabPosition.edge === "left" ? "var(--space-6)" : "auto",
              }),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <Accessibility className="size-7" aria-hidden />
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-[var(--overlay)]"
            style={{ zIndex: "var(--z-a11y)" }}
            aria-label={fr ? "Fermer les options d'accessibilité" : "Close accessibility options"}
            onClick={closeMenu}
          />
          <div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed flex flex-col overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-surface)] elevation-2"
            style={{
              left: menuStyle.left,
              right: menuStyle.right,
              top: menuStyle.top,
              bottom: menuStyle.bottom,
              width: menuStyle.width,
              maxHeight: menuStyle.maxHeight,
              zIndex: "var(--z-a11y)",
            }}
          >
            <div className="flex items-center justify-between gap-[var(--space-2)] border-b border-[var(--border)] px-[var(--space-3)] py-[var(--space-2)]">
              <h2 id={titleId} className="type-md text-[var(--text-primary)]">
                {fr ? "Accessibilité" : "Accessibility"}
              </h2>
              <Button
                ref={closeRef}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={fr ? "Fermer" : "Close"}
                onClick={closeMenu}
              >
                <X aria-hidden />
              </Button>
            </div>

            <div className="overflow-y-auto p-[var(--space-3)]">
              <section className="mb-[var(--space-3)]">
                <h3 className="mb-[var(--space-2)] type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {fr ? "Affichage" : "Display"}
                </h3>
                <p className="mb-[var(--space-1)] type-sm text-[var(--text-secondary)]">
                  {fr ? "Taille du texte" : "Text size"}
                </p>
                <div role="group" aria-label={fr ? "Taille du texte" : "Text size"} className="mb-[var(--space-2)] flex gap-[var(--space-1)]">
                  {scales.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={cn(
                        "min-h-[var(--touch-min)] flex-1 rounded-[var(--radius-sm)] px-[var(--space-2)] type-xs",
                        a11y.textScale === s.id
                          ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)]"
                          : "bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--border)]",
                      )}
                      aria-pressed={a11y.textScale === s.id}
                      onClick={() => a11y.setTextScale(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <SwitchRow
                  label={fr ? "Contraste élevé" : "High contrast"}
                  checked={a11y.highContrast}
                  onChange={a11y.setHighContrast}
                  onLabel={onLabel}
                  offLabel={offLabel}
                />
                <SwitchRow
                  label={fr ? "Curseur agrandi" : "Large cursor"}
                  checked={a11y.largeCursor}
                  onChange={a11y.setLargeCursor}
                  onLabel={onLabel}
                  offLabel={offLabel}
                />
                <SwitchRow
                  label={fr ? "Souligner les liens" : "Underline links"}
                  checked={a11y.underlineLinks}
                  onChange={a11y.setUnderlineLinks}
                  onLabel={onLabel}
                  offLabel={offLabel}
                />
              </section>

              <section className="mb-[var(--space-3)] border-t border-[var(--border)] pt-[var(--space-3)]">
                <h3 className="mb-[var(--space-2)] type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {fr ? "Lecture et mouvement" : "Reading & motion"}
                </h3>
                <SwitchRow
                  label={fr ? "Réduire les animations" : "Reduce motion"}
                  checked={a11y.reducedMotion}
                  onChange={a11y.setReducedMotion}
                  onLabel={onLabel}
                  offLabel={offLabel}
                />
                <SwitchRow
                  label={fr ? "Police dyslexie" : "Dyslexia-friendly font"}
                  checked={a11y.dyslexiaMode}
                  onChange={a11y.setDyslexiaMode}
                  onLabel={onLabel}
                  offLabel={offLabel}
                />
              </section>

              <section className="border-t border-[var(--border)] pt-[var(--space-3)]">
                <h3 className="mb-[var(--space-2)] type-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {fr ? "Apparence" : "Appearance"}
                </h3>
                <label
                  htmlFor={familyId}
                  className="mb-[var(--space-1)] block type-sm text-[var(--text-secondary)]"
                >
                  {fr ? "Palette" : "Theme family"}
                </label>
                <Select
                  id={familyId}
                  value={theme.family}
                  onChange={(e) => onFamilyChange(e.target.value)}
                >
                  {themeFamilies.map((group) => (
                    <option key={group.family} value={group.family}>
                      {group.family}
                    </option>
                  ))}
                </Select>
                <div
                  role="group"
                  aria-label={fr ? "Mode clair ou sombre" : "Light or dark mode"}
                  className="mt-[var(--space-2)] flex gap-[var(--space-1)]"
                >
                  <button
                    type="button"
                    aria-pressed={!isDarkMode}
                    onClick={() => onToggleMode("light")}
                    className={cn(
                      "inline-flex min-h-[var(--touch-min)] flex-1 items-center justify-center gap-[var(--space-1)] rounded-[var(--radius-sm)] type-sm",
                      !isDarkMode
                        ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)]"
                        : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <Sun className="size-3.5" aria-hidden />
                    {fr ? "Clair" : "Light"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={isDarkMode}
                    onClick={() => onToggleMode("dark")}
                    className={cn(
                      "inline-flex min-h-[var(--touch-min)] flex-1 items-center justify-center gap-[var(--space-1)] rounded-[var(--radius-sm)] type-sm",
                      isDarkMode
                        ? "bg-[var(--primary)] font-semibold text-[var(--on-primary)]"
                        : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <Moon className="size-3.5" aria-hidden />
                    {fr ? "Sombre" : "Dark"}
                  </button>
                </div>
                <p className="mt-[var(--space-2)] type-xs text-[var(--text-muted)]">
                  {theme.name}
                </p>
              </section>

              <button
                type="button"
                className="mt-[var(--space-3)] flex min-h-[var(--touch-min)] w-full items-center justify-center rounded-[var(--radius-sm)] type-sm text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  a11y.reset();
                  a11y.setFabPosition(DEFAULT_FAB_POSITION);
                }}
              >
                {fr ? "Réinitialiser" : "Reset preferences"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
