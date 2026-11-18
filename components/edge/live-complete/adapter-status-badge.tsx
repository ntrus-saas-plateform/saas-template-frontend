"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { edgeApi } from "@/lib/api/edge";
import { cn } from "@/lib/utils";

export type AdapterLabStatus = "LIVE" | "PARTIAL" | "UNAVAILABLE";

const TONES: Record<AdapterLabStatus, "success" | "warning" | "danger"> = {
  LIVE: "success",
  PARTIAL: "warning",
  UNAVAILABLE: "danger",
};

const DEFAULT_TIPS: Record<AdapterLabStatus, string> = {
  LIVE: "Sandbox payment, durable P7, and BB control are configured.",
  PARTIAL: "Some live-complete adapters are configured; lab is not fully LIVE.",
  UNAVAILABLE:
    "Lab needs BILLING_PAYMENT_ADAPTER=sandbox / durable P7 (and BB control URL).",
};

export function AdapterStatusBadge({
  status,
  label,
  title,
  className,
}: {
  status: AdapterLabStatus;
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <span title={title ?? DEFAULT_TIPS[status]} className={cn("inline-flex", className)}>
      <Badge tone={TONES[status]} className="uppercase tracking-wide">
        {label ?? status}
      </Badge>
    </span>
  );
}

/** Fetches lab status; on error shows UNAVAILABLE with setup tip. */
export function LiveCompleteAdapterStatusBadge({
  className,
}: {
  className?: string;
}) {
  const query = useQuery({
    queryKey: ["edge", "live-complete", "status"],
    queryFn: () => edgeApi.getLiveCompleteLabStatus(),
    staleTime: 60_000,
    retry: false,
  });

  const payload = query.data?.data;
  const status: AdapterLabStatus =
    query.isError || !payload
      ? "UNAVAILABLE"
      : payload.mode === "LIVE" ||
          payload.mode === "PARTIAL" ||
          payload.mode === "UNAVAILABLE"
        ? payload.mode
        : "UNAVAILABLE";

  const tip =
    query.isError || !payload
      ? DEFAULT_TIPS.UNAVAILABLE
      : (payload.note ?? DEFAULT_TIPS[status]);

  return (
    <AdapterStatusBadge status={status} title={tip} className={className} />
  );
}
