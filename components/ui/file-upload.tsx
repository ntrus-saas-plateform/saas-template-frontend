"use client";

import { cn } from "@/lib/utils";

type FileUploadProps = {
  accept?: string;
  onFile: (file: File) => void;
  label?: string;
  className?: string;
};

export function FileUpload({
  accept,
  onFile,
  label = "Choose file",
  className,
}: FileUploadProps) {
  return (
    <label
      className={cn(
        "flex min-h-[var(--touch-min)] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-[var(--space-4)] py-[var(--space-6)] type-sm text-[var(--text-secondary)] hover:bg-[var(--bg-app)]",
        className,
      )}
    >
      <span>{label}</span>
      <input
        type="file"
        className="sr-only"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
