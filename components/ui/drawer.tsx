"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-[var(--overlay)]" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-full max-w-[480px] flex-col bg-[var(--bg-surface)] elevation-2 outline-none max-sm:max-w-none",
          )}
        >
          <div className="flex h-[var(--header-height)] items-center justify-between gap-[var(--space-3)] border-b border-[var(--border)] px-[var(--space-4)]">
            <Dialog.Title className="type-md text-[var(--text-primary)]">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Fermer">
                <X aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-[var(--space-4)]">{children}</div>
          {footer ? (
            <div className="border-t border-[var(--border)] p-[var(--space-4)]">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
