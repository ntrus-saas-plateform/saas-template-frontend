"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { BulkActionBar, type BulkAction } from "@/components/data/bulk-action-bar";
import { useSavedViews } from "@/lib/data/saved-views";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  numeric?: boolean;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  hideable?: boolean;
  actions?: boolean;
};

type SortState = { id: string; dir: "asc" | "desc" } | null;

export type DataTableSearch = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export type DataTableAddAction = {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
};

export type DataTablePagination = {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  search,
  toolbar,
  footer,
  pagination,
  onRefresh,
  refreshing,
  addAction,
  onRowClick,
  resourceKey,
  selectable = true,
  bulkActions,
  onSelectionChange,
  sort: controlledSort,
  onSortChange,
  rowNumber = true,
  rowNumberStart,
  columnPicker = false,
  csvExport = false,
  localSearch = true,
  fill = true,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  empty?: ReactNode;
  search?: DataTableSearch;
  toolbar?: ReactNode;
  footer?: ReactNode;
  pagination?: DataTablePagination;
  onRefresh?: () => void;
  refreshing?: boolean;
  addAction?: DataTableAddAction;
  onRowClick?: (row: T) => void;
  resourceKey?: string;
  selectable?: boolean;
  bulkActions?: BulkAction[];
  onSelectionChange?: (ids: string[]) => void;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  rowNumber?: boolean;
  rowNumberStart?: number;
  densityToggle?: boolean;
  columnPicker?: boolean;
  csvExport?: boolean;
  localSearch?: boolean;
  /** Fill parent height; only the table/list body scrolls. Default true for catalog pages. */
  fill?: boolean;
}) {
  const saved = useSavedViews(resourceKey ?? "__none__");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localSort, setLocalSort] = useState<SortState>(null);
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(5);
  const [localQuery, setLocalQuery] = useState("");
  const sort = controlledSort !== undefined ? controlledSort : localSort;

  const visibleIds = useMemo(() => {
    if (!resourceKey || !columnPicker) return columns.map((c) => c.id);
    const stored = saved.view.columns;
    if (!stored?.length) return columns.map((c) => c.id);
    return stored;
  }, [columns, resourceKey, columnPicker, saved.view.columns]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleIds.includes(c.id)),
    [columns, visibleIds],
  );

  const setSort = useCallback(
    (next: SortState) => {
      if (onSortChange) onSortChange(next);
      else setLocalSort(next);
      if (resourceKey) {
        saved.save({ ...saved.view, sort: next });
      }
    },
    [onSortChange, resourceKey, saved],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const aEmpty = av == null || av === "";
      const bEmpty = bv == null || bv === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort, columns]);

  const effectiveSearch = search ??
    (localSearch
      ? {
          value: localQuery,
          onChange: setLocalQuery,
          placeholder: "Rechercher…",
        }
      : undefined);

  const filteredRows = useMemo(() => {
    if (search) return sortedRows;
    const q = localQuery.trim().toLowerCase();
    if (!q) return sortedRows;
    return sortedRows.filter((row) => {
      try {
        return JSON.stringify(row).toLowerCase().includes(q);
      } catch {
        return true;
      }
    });
  }, [sortedRows, search, localQuery]);

  useEffect(() => {
    setLocalPage(1);
  }, [filteredRows.length, localPageSize, localQuery]);

  const usingLocalPagination = !pagination;
  const page = pagination?.page ?? localPage;
  const pageSize = pagination?.pageSize ?? localPageSize;
  const total = pagination?.total ?? filteredRows.length;
  const displayRows = usingLocalPagination
    ? filteredRows.slice((page - 1) * pageSize, page * pageSize)
    : filteredRows;
  const startIndex = rowNumberStart ?? (page - 1) * pageSize + 1;
  const effectivePagination: DataTablePagination = pagination ?? {
    page,
    pageSize,
    total,
    onPageChange: setLocalPage,
    onPageSizeChange: (size) => {
      setLocalPageSize(size);
      setLocalPage(1);
    },
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange?.([...next]);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === displayRows.length) {
        onSelectionChange?.([]);
        return new Set();
      }
      const next = new Set(displayRows.map((r) => r.id));
      onSelectionChange?.([...next]);
      return next;
    });
  };

  const exportCsv = useCallback(() => {
    const headers = visibleColumns.map((c) => c.header);
    const lines = sortedRows.map((row) =>
      visibleColumns
        .map((c) => {
          const v = c.cell(row);
          const text =
            typeof v === "string" || typeof v === "number" ? String(v) : row.id;
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resourceKey ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, visibleColumns, resourceKey]);

  const cycleSort = (colId: string) => {
    if (sort?.id === colId) {
      setSort(sort.dir === "asc" ? { id: colId, dir: "desc" } : null);
    } else {
      setSort({ id: colId, dir: "asc" });
    }
  };

  const alignClass = (col: DataTableColumn<T>) => {
    if (col.numeric || col.align === "right" || col.actions) return "text-right";
    if (col.align === "center") return "text-center";
    return "text-left";
  };

  const chromeRight = onRefresh || addAction || csvExport;
  const chrome =
    effectiveSearch || toolbar || chromeRight ? (
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[var(--space-2)]">
          {effectiveSearch ? (
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="search"
                value={effectiveSearch.value}
                onChange={(e) => effectiveSearch.onChange(e.target.value)}
                placeholder={effectiveSearch.placeholder ?? "Rechercher…"}
                className="h-9 pl-9"
                aria-label={effectiveSearch.placeholder ?? "Rechercher"}
              />
            </div>
          ) : null}
          {toolbar}
        </div>
        {chromeRight ? (
          <div className="flex shrink-0 items-center gap-[var(--space-2)]">
            {csvExport ? (
              <Button type="button" size="sm" variant="outline" onClick={exportCsv}>
                Exporter CSV
              </Button>
            ) : null}
            {onRefresh ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={refreshing ? "animate-spin" : undefined} />
                Rafraîchir
              </Button>
            ) : null}
            {addAction ? (
              <Button
                type="button"
                size="sm"
                onClick={addAction.onClick}
                disabled={addAction.disabled}
              >
                <Plus />
                {addAction.label ?? "Ajouter"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : null;

  const columnToggle =
    columnPicker && resourceKey ? (
      <div className="flex flex-wrap items-center gap-[var(--space-2)] type-xs text-[var(--text-secondary)]">
        <span>Colonnes</span>
        {columns
          .filter((c) => c.hideable !== false)
          .map((c) => {
            const on = visibleIds.includes(c.id);
            return (
              <Checkbox
                key={c.id}
                compact
                checked={on}
                onChange={() => {
                  const next = on
                    ? visibleIds.filter((id) => id !== c.id)
                    : [...visibleIds, c.id];
                  if (next.length === 0) return;
                  saved.save({ ...saved.view, columns: next });
                }}
              >
                {c.header}
              </Checkbox>
            );
          })}
      </div>
    ) : null;

  const bulk = selectable ? (
    <BulkActionBar
      selectedCount={selected.size}
      selectedIds={[...selected]}
      actions={bulkActions ?? []}
      onClear={() => {
        setSelected(new Set());
        onSelectionChange?.([]);
      }}
    />
  ) : null;

  const footerNode = (
    <>
      <Pagination
        page={effectivePagination.page}
        pageSize={effectivePagination.pageSize}
        total={effectivePagination.total}
        hasMore={effectivePagination.hasMore}
        onPageChange={effectivePagination.onPageChange}
        onPageSizeChange={effectivePagination.onPageSizeChange}
        pageSizeOptions={effectivePagination.pageSizeOptions ?? [5, 10, 25, 50]}
      />
      {footer}
    </>
  );

  const showEmpty = !filteredRows.length && empty;

  const bodyScrollClass = cn(
    "overflow-auto",
    fill ? "min-h-0 flex-1 max-h-full" : "max-h-[calc(100dvh-14rem)]",
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-[var(--space-4)]",
        fill && "min-h-0 flex-1",
      )}
    >
      {chrome ? <div className="shrink-0">{chrome}</div> : null}
      {columnToggle ? <div className="shrink-0">{columnToggle}</div> : null}
      {bulk ? <div className="shrink-0">{bulk}</div> : null}
      {showEmpty ? (
        <div className={cn(fill && "min-h-0 flex-1 overflow-auto")}>{empty}</div>
      ) : (
        <>
          <div
            className={cn(
              "hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] sm:block",
              bodyScrollClass,
            )}
          >
            <table className="w-full min-w-[36rem] border-collapse text-left type-sm">
              <thead className="sticky top-0 z-[1]">
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                  {selectable ? (
                    <th className="w-10 px-[var(--space-3)] py-2.5" scope="col">
                      <Checkbox
                        compact
                        aria-label="Tout sélectionner"
                        checked={
                          displayRows.length > 0 &&
                          selected.size === displayRows.length
                        }
                        onChange={toggleAll}
                      />
                    </th>
                  ) : null}
                  {rowNumber ? (
                    <th
                      className="w-12 px-[var(--space-3)] py-2.5 type-xs font-semibold"
                      scope="col"
                    >
                      N°
                    </th>
                  ) : null}
                  {visibleColumns.map((col) => (
                    <th
                      key={col.id}
                      scope="col"
                      className={cn(
                        "px-[var(--space-3)] py-2.5 type-xs font-semibold",
                        alignClass(col),
                        col.className,
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                          onClick={() => cycleSort(col.id)}
                        >
                          {col.header}
                          {sort?.id === col.id ? (
                            sort.dir === "asc" ? (
                              <ArrowUp className="size-3.5" aria-hidden />
                            ) : (
                              <ArrowDown className="size-3.5" aria-hidden />
                            )
                          ) : (
                            <ChevronsUpDown
                              className="size-3.5 opacity-40"
                              aria-hidden
                            />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-[var(--border)] last:border-0",
                      selected.has(row.id) && "bg-[var(--primary-soft)]",
                      onRowClick && "cursor-pointer",
                      "hover:bg-[var(--surface-muted)]",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable ? (
                      <td
                        className="px-[var(--space-3)] py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          compact
                          aria-label={`Sélectionner ${row.id}`}
                          checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                        />
                      </td>
                    ) : null}
                    {rowNumber ? (
                      <td className="px-[var(--space-3)] py-2.5 tabular-nums text-[var(--text-muted)]">
                        {String(startIndex + index).padStart(2, "0")}
                      </td>
                    ) : null}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          "px-[var(--space-3)] py-2.5 text-[var(--text-primary)]",
                          col.numeric && "tabular-nums",
                          alignClass(col),
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={cn("flex flex-col gap-[var(--space-3)] sm:hidden", bodyScrollClass)}>
            {displayRows.map((row, index) => (
              <article
                key={row.id}
                className={cn(
                  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)]",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(row)}
              >
                <div className="mb-[var(--space-3)] flex items-center justify-between gap-2">
                  {selectable ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        compact
                        aria-label={`Sélectionner ${row.id}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                      />
                    </div>
                  ) : (
                    <span />
                  )}
                  {rowNumber ? (
                    <span className="type-xs tabular-nums text-[var(--text-muted)]">
                      N° {String(startIndex + index).padStart(2, "0")}
                    </span>
                  ) : null}
                </div>
                <dl className="flex flex-col gap-[var(--space-3)]">
                  {visibleColumns.map((col) => (
                    <div key={col.id} className="flex flex-col gap-[var(--space-1)]">
                      <dt className="type-xs text-[var(--text-secondary)]">
                        {col.header}
                      </dt>
                      <dd className="type-base text-[var(--text-primary)]">
                        {col.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <div className="shrink-0">{footerNode}</div>
        </>
      )}
      {showEmpty ? <div className="shrink-0">{footerNode}</div> : null}
    </div>
  );
}
