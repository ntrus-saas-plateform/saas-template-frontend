"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-dropdown)] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] px-[var(--space-2)] py-[var(--space-1)] type-xs text-[var(--text-primary)] elevation-1",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
