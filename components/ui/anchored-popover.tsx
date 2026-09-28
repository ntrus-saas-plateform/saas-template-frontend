"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type AnchorPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function useAnchoredPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  opts?: { minWidth?: number; maxHeightCap?: number },
) {
  const minWidth = opts?.minWidth ?? 0;
  const maxHeightCap = opts?.maxHeightCap ?? 280;
  const [pos, setPos] = useState<AnchorPos>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const pad = 8;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - r.bottom - gap - pad;
    const spaceAbove = r.top - gap - pad;
    const placeBottom = spaceBelow >= 160 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(
      maxHeightCap,
      Math.max(132, placeBottom ? spaceBelow : spaceAbove),
    );
    const width = Math.min(vw - pad * 2, Math.max(r.width, minWidth, 0));
    const left = Math.min(Math.max(pad, r.left), Math.max(pad, vw - width - pad));
    const top = placeBottom
      ? r.bottom + gap
      : Math.max(pad, r.top - gap - maxHeight);
    setPos({ top, left, width, maxHeight });
  }, [anchorRef, minWidth, maxHeightCap]);

  useEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return pos;
}

export function AnchoredPopover({
  open,
  anchorRef,
  onClose,
  children,
  className,
  id,
  role,
  minWidth,
  maxHeightCap,
  "aria-labelledby": ariaLabelledBy,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: (reason: "escape" | "outside") => void;
  children: ReactNode;
  className?: string;
  id?: string;
  role?: string;
  minWidth?: number;
  maxHeightCap?: number;
  "aria-labelledby"?: string;
}) {
  const pos = useAnchoredPosition(open, anchorRef, { minWidth, maxHeightCap });
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panel?.contains(t)) return;
      onClose("outside");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      onClose("escape");
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, anchorRef, panel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={setPanel}
      id={id}
      role={role}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "fixed overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] elevation-2",
        className,
      )}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        zIndex: "var(--z-popover)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
