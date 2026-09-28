/**
 * Safe date/time formatting for API payloads that may be ISO, epoch ms, or epoch seconds.
 */

export type DateTimeFormatOpts = {
  locale?: string;
  timeZone?: string;
  hour12?: boolean;
};

function normalizeOpts(
  localeOrOpts?: string | DateTimeFormatOpts,
): DateTimeFormatOpts {
  if (localeOrOpts == null) return {};
  if (typeof localeOrOpts === "string") return { locale: localeOrOpts };
  return localeOrOpts;
}

export function parseApiDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Keycloak / Unix: seconds if small, milliseconds if large
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Pure digits → epoch
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseApiDate(Number(trimmed));
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatDateTime(
  value: unknown,
  fallback = "—",
  localeOrOpts?: string | DateTimeFormatOpts,
): string {
  const d = parseApiDate(value);
  if (!d) return fallback;
  const opts = normalizeOpts(localeOrOpts);
  try {
    return d.toLocaleString(opts.locale, {
      timeZone: opts.timeZone || undefined,
      hour12: opts.hour12,
    });
  } catch {
    return d.toISOString();
  }
}

export function formatDate(
  value: unknown,
  fallback = "—",
  localeOrOpts?: string | DateTimeFormatOpts,
): string {
  const d = parseApiDate(value);
  if (!d) return fallback;
  const opts = normalizeOpts(localeOrOpts);
  try {
    return d.toLocaleDateString(opts.locale, {
      timeZone: opts.timeZone || undefined,
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatRelativeTime(
  value: unknown,
  fallback = "—",
  locale?: string,
): string {
  const d = parseApiDate(value);
  if (!d) return fallback;
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (abs < 60) return rtf.format(Math.round(diffSec), "second");
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  } catch {
    /* fall through */
  }
  return formatDate(d, fallback, locale);
}
