"use client";

import { ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TaskCenter() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Tasks">
          <ListTodo className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Pending tasks</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-3 text-sm text-[var(--text-muted)]">
          No pending tasks
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
