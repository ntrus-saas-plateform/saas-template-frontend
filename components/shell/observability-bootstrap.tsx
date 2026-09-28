"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/observability/errors";

export function ObservabilityBootstrap() {
  useEffect(() => installGlobalErrorHandlers(), []);
  return null;
}
