"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning" | "danger";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastApi = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const icons: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { ...toast, id }]);
    if (toast.tone !== "danger") {
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 5000);
    }
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-[var(--space-6)] right-[var(--space-6)] z-[var(--z-toast)] flex w-80 flex-col gap-[var(--space-2)]"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => {
          const tone = t.tone ?? "info";
          const Icon = icons[tone];
          return (
            <div
              key={t.id}
              role={tone === "danger" ? "alert" : "status"}
              aria-live={tone === "danger" ? "assertive" : "polite"}
              className="pointer-events-auto flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-3)] elevation-1"
            >
              <Icon
                className={cn(
                  "size-[var(--icon-md)] shrink-0",
                  tone === "success" && "text-[var(--success)]",
                  tone === "danger" && "text-[var(--danger)]",
                  tone === "warning" && "text-[var(--warning)]",
                  tone === "info" && "text-[var(--info)]",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="type-sm font-semibold text-[var(--text-primary)]">
                  {t.title}
                </p>
                {t.description ? (
                  <p className="mt-[var(--space-1)] type-xs text-[var(--text-secondary)]">
                    {t.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex size-[var(--touch-min)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                aria-label="Fermer la notification"
                onClick={() => dismiss(t.id)}
              >
                <X className="size-[var(--icon-sm)]" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
