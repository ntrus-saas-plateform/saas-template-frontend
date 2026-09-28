/** Client error reporting hook (P9). Wire to Sentry/Datadog later. */

type ErrorReport = {
  message: string;
  stack?: string;
  correlationId?: string;
  url?: string;
  extra?: Record<string, unknown>;
};

const buffer: ErrorReport[] = [];

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const rec = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (typeof rec.error?.message === "string" && rec.error.message.trim()) {
      return rec.error.message;
    }
    try {
      const json = JSON.stringify(error);
      if (json && json !== "{}") return json;
    } catch {
      /* ignore */
    }
  }
  return "Unknown client error";
}

export function reportClientError(
  error: unknown,
  extra?: Record<string, unknown>,
) {
  const report: ErrorReport = {
    message: toErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    correlationId:
      typeof crypto !== "undefined" ? crypto.randomUUID() : undefined,
    extra,
  };
  buffer.push(report);
  if (buffer.length > 50) buffer.shift();
  if (process.env.NODE_ENV === "development") {
    // Single string so Next.js error overlay does not render a bare `{}`.
    console.error(
      `[edge-frontend] ${report.message}${report.url ? ` (${report.url})` : ""}`,
      report.extra ?? "",
    );
  }
  // Future: POST /api/telemetry/errors
}

export function getBufferedErrors() {
  return [...buffer];
}

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return () => undefined;
  const onError = (event: ErrorEvent) => {
    reportClientError(event.error ?? event.message);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    reportClientError(event.reason);
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
