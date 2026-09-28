"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { identityApi } from "@/lib/api/identity";
import { useDateTimeFormat } from "@/lib/format/use-datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";

export function NotificationCenter() {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const { formatDateTime: fmt } = useDateTimeFormat();

  const query = useQuery({
    queryKey: idk.notifications(),
    queryFn: async () => api.users.notifications.list(1, 15),
    refetchInterval: 60_000,
  });

  const items = query.data?.data ?? [];
  const unreadCount = query.data?.stats?.unreadCount ?? 0;

  const markRead = useMutation({
    mutationFn: (id: string) => api.users.notifications.markRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: idk.notifications() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const markAll = useMutation({
    mutationFn: () => api.users.notifications.markAllRead(),
    onSuccess: async () => {
      toast.push({ title: "All marked read", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.notifications() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.users.notifications.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: idk.notifications() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-2">
          <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {query.isLoading ? (
          <div className="px-2 py-3 text-sm text-[var(--text-muted)]">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-2 py-3 text-sm text-[var(--text-muted)]">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => {
              const unread = !n.readAt;
              const href =
                typeof n.payload?.href === "string" ? n.payload.href : null;
              return (
                <DropdownMenuItem
                  key={n.id}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    if (unread) markRead.mutate(n.id);
                  }}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className={unread ? "font-medium" : undefined}>
                      {n.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {unread ? (
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      ) : null}
                      <button
                        type="button"
                        className="text-[11px] text-[var(--text-muted)] underline"
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          remove.mutate(n.id);
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  {n.body ? (
                    <span className="line-clamp-2 text-xs text-[var(--text-muted)]">
                      {n.body}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {fmt(n.createdAt)}
                    {href ? (
                      <>
                        {" · "}
                        <Link
                          href={href}
                          className="underline"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          Open
                        </Link>
                      </>
                    ) : null}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
