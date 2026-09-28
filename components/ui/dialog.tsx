"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  size?: "sm" | "md" | "lg";
  /** When false, body does not scroll — children manage overflow (e.g. one inner list). */
  scrollBody?: boolean;
  dirty?: boolean;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function dialogFocusables(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      !el.closest("[aria-hidden=true]") &&
      el.getAttribute("aria-hidden") !== "true",
  );
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  size = "md",
  scrollBody = true,
  dirty = false,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const dirtyRef = useRef(dirty);
  onOpenChangeRef.current = onOpenChange;
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusInitial = () => {
      const list = dialogFocusables(panel);
      const firstField = list.find((el) =>
        el.matches("input, textarea, select, [role='combobox']"),
      );
      (firstField ?? list[0])?.focus();
    };
    const frame = window.requestAnimationFrame(focusInitial);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (dirtyRef.current) {
          const ok = window.confirm(
            "Des modifications non enregistrées seront perdues. Fermer ?",
          );
          if (!ok) return;
        }
        onOpenChangeRef.current(false);
        return;
      }
      if (e.key !== "Tab") return;
      const list = dialogFocusables(panel);
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus();
    };
  }, [open]);

  const requestClose = () => {
    if (dirtyRef.current) {
      const ok = window.confirm(
        "Des modifications non enregistrées seront perdues. Fermer ?",
      );
      if (!ok) return;
    }
    onOpenChange(false);
  };

  const maxW =
    size === "lg"
      ? "max-w-[720px]"
      : size === "sm"
        ? "max-w-[420px]"
        : "max-w-[560px]";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-4)] max-sm:p-0">
          <motion.button
            type="button"
            aria-label="Fermer la fenêtre"
            className="absolute inset-0 bg-[var(--overlay)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={requestClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            className={cn(
              "relative z-10 flex max-h-[min(100dvh-2rem,880px)] w-full flex-col overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-surface)] elevation-2 max-sm:h-full max-sm:max-h-none max-sm:rounded-none",
              maxW,
              className,
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <div className="flex shrink-0 items-start justify-between gap-[var(--space-3)] border-b border-[var(--border)] px-[var(--space-5)] py-[var(--space-4)]">
              <div className="min-w-0">
                <h2 id={titleId} className="type-md text-[var(--text-primary)]">
                  {title}
                </h2>
                {description ? (
                  <p
                    id={descId}
                    className="mt-[var(--space-1)] max-w-prose type-sm text-[var(--text-secondary)]"
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Fermer"
                onClick={requestClose}
              >
                <X aria-hidden />
              </Button>
            </div>
            <div
              className={cn(
                "min-h-0 flex-1 px-[var(--space-5)] py-[var(--space-5)]",
                scrollBody
                  ? "overflow-y-auto"
                  : "flex flex-col overflow-hidden",
                bodyClassName,
              )}
            >
              {children}
            </div>
            {footer ? (
              <div className="flex shrink-0 items-center justify-end gap-[var(--space-2)] border-t border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-5)] py-[var(--space-3)]">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
