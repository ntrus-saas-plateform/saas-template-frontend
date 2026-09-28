import type { ApiErrorBody, PaginationMeta } from "@/types/platform";
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/bff/csrf-constants";

export class ApiError extends Error {
  readonly status: number;
  readonly body: { error?: ApiErrorBody } | unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiClientOptions = {
  getAccessToken: () => string | undefined | Promise<string | undefined>;
  baseUrl?: string;
  onUnauthorized?: () => void;
};

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function readBrowserCsrf(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function createApiClient(options: ApiClientOptions) {
  const base = options.baseUrl ?? apiBase();

  async function request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<{ data: T; pagination?: PaginationMeta; stats?: Record<string, number> }> {
    const token = await options.getAccessToken();
    const headers = new Headers(init?.headers);
    const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
    if (!headers.has("Content-Type") && init?.body && !isForm) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("X-Correlation-Id", crypto.randomUUID());
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const method = (init?.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const csrf = readBrowserCsrf();
      if (csrf) headers.set(CSRF_HEADER, csrf);
    }

    const url = path.startsWith("http")
      ? path
      : `${base}${path.startsWith("/") ? path : `/${path}`}`;

    const res = await fetch(url, {
      ...init,
      headers,
      credentials: path.startsWith("/api/") ? "include" : init?.credentials,
    });

    const json = (await res.json().catch(() => ({}))) as {
      data?: T;
      pagination?: PaginationMeta;
      stats?: Record<string, number>;
      error?: ApiErrorBody;
    };

    if (res.status === 401) {
      options.onUnauthorized?.();
    }

    if (!res.ok) {
      throw new ApiError(
        json.error?.message ?? res.statusText ?? "Request failed",
        res.status,
        json,
      );
    }

    return {
      data: json.data as T,
      pagination: json.pagination,
      stats: json.stats,
    };
  }

  return {
    get: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    postForm: <T>(path: string, body: FormData, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "POST",
        body,
      }),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
