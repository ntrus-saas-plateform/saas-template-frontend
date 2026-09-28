"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShellSidebar } from "@/components/shell/shell-sidebar";

export function MobileNavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] sm:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)]"
        aria-label="Fermer le menu"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="relative flex h-full w-full flex-col bg-[var(--bg-surface)]"
      >
        <div className="absolute right-[var(--space-3)] top-[var(--space-3)] z-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer le menu"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden />
          </Button>
        </div>
        <ShellSidebar variant="drawer" onNavigate={() => onOpenChange(false)} />
      </div>
    </div>
  );
}

/** @deprecated Use MobileNavDrawer */
export function MobileBottomNav() {
  return null;
}
