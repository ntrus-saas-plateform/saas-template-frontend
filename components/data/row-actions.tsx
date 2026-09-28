"use client";

import {
  Fragment,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowActionItem = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Destructive styling (delete / revoke / suspend). */
  tone?: "default" | "danger";
  icon?: ReactNode;
  separatorBefore?: boolean;
};

export function RowActions({
  items,
  onEdit,
  onDelete,
  editLabel = "Modifier",
  deleteLabel = "Supprimer",
  editDisabled,
  deleteDisabled,
  menuLabel = "Actions",
  className,
}: {
  /** Prefer this for 2+ custom actions — rendered in a ⋯ menu. */
  items?: RowActionItem[];
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  menuLabel?: string;
  className?: string;
}) {
  const actions: RowActionItem[] = [];

  if (onEdit) {
    actions.push({
      id: "edit",
      label: editLabel,
      onClick: onEdit,
      disabled: editDisabled,
      icon: <Pencil className="size-[var(--icon-sm)]" aria-hidden />,
    });
  }

  for (const item of items ?? []) {
    if (actions.some((a) => a.id === item.id)) continue;
    actions.push(item);
  }

  if (onDelete) {
    actions.push({
      id: "delete",
      label: deleteLabel,
      onClick: onDelete,
      disabled: deleteDisabled,
      tone: "danger",
      icon: <Trash2 className="size-[var(--icon-sm)]" aria-hidden />,
      separatorBefore: Boolean(items?.length || onEdit),
    });
  }

  if (actions.length === 0) return null;

  const stop = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  // Single action: compact icon button (no menu chrome).
  if (actions.length === 1) {
    const only = actions[0]!;
    const isDanger = only.tone === "danger";
    return (
      <div
        className={cn("flex items-center justify-end", className)}
        onClick={stop}
        onKeyDown={stop}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={only.label}
          disabled={only.disabled}
          className={
            isDanger
              ? "text-[var(--danger)] hover:bg-[var(--danger-soft)]"
              : "text-[var(--text-secondary)] hover:text-[var(--primary)]"
          }
          onClick={(e) => {
            e.stopPropagation();
            only.onClick();
          }}
        >
          {only.icon ??
            (isDanger ? <Trash2 aria-hidden /> : <Pencil aria-hidden />)}
        </Button>
      </div>
    );
  }

  // Multiple actions: always a ⋯ overflow menu.
  return (
    <div
      className={cn("flex items-center justify-end", className)}
      onClick={stop}
      onKeyDown={stop}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={menuLabel}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={stop}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={stop}>
          {actions.map((action) => (
            <Fragment key={action.id}>
              {action.separatorBefore ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                disabled={action.disabled}
                className={
                  action.tone === "danger"
                    ? "text-[var(--danger)] data-[highlighted]:bg-[var(--danger-soft)] data-[highlighted]:text-[var(--danger)]"
                    : undefined
                }
                onSelect={() => {
                  if (action.disabled) return;
                  action.onClick();
                }}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
