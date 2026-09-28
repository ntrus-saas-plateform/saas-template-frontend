"use client";

import { useCallback } from "react";
import {
  formatDate,
  formatDateTime,
  type DateTimeFormatOpts,
} from "@/lib/format/datetime";
import { usePreferences } from "@/providers/preferences-provider";

/** Format dates using shell locale + hydrated timezone / time format (§55 USER prefs). */
export function useDateTimeFormat(): {
  formatDateTime: (value: unknown, fallback?: string) => string;
  formatDate: (value: unknown, fallback?: string) => string;
  opts: DateTimeFormatOpts;
} {
  const prefs = usePreferences();
  const opts: DateTimeFormatOpts = {
    locale: prefs.locale,
    timeZone: prefs.timezone || undefined,
    hour12: prefs.hour12,
  };

  return {
    opts,
    formatDateTime: useCallback(
      (value: unknown, fallback = "—") =>
        formatDateTime(value, fallback, opts),
      [opts.locale, opts.timeZone, opts.hour12],
    ),
    formatDate: useCallback(
      (value: unknown, fallback = "—") => formatDate(value, fallback, opts),
      [opts.locale, opts.timeZone],
    ),
  };
}
