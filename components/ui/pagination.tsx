import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type PaginationProps = {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  className,
}: PaginationProps) {
  const totalPages =
    total != null ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const canPrev = page > 1;
  const canNext =
    totalPages != null ? page < totalPages : Boolean(hasMore);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to =
    total != null ? Math.min(page * pageSize, total) : page * pageSize;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-[var(--space-3)] type-sm text-[var(--text-secondary)]",
        className,
      )}
    >
      <div className="flex items-center gap-[var(--space-2)]">
        <span>Lignes par page</span>
        {onPageSizeChange ? (
          <Select
            aria-label="Lignes par page"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 w-auto min-w-16"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        ) : (
          <span className="font-semibold text-[var(--text-primary)]">{pageSize}</span>
        )}
      </div>
      <div className="flex items-center gap-[var(--space-3)]">
        <span>
          {total != null ? `${from}–${to} sur ${total}` : `Page ${page}`}
        </span>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canPrev}
            aria-label="Première page"
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canPrev}
            aria-label="Page précédente"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <span className="min-w-8 px-[var(--space-2)] text-center font-semibold text-[var(--primary)]">
            {page}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canNext}
            aria-label="Page suivante"
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canNext || totalPages == null}
            aria-label="Dernière page"
            onClick={() => totalPages != null && onPageChange(totalPages)}
          >
            <ChevronsRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
