"use client";

import { useMemo, useState } from "react";

export const EMPTY_FILTER = "(Em branco)";

export function useExcelFilters<T, C extends string>(
  rows: T[],
  cell: (row: T, col: C) => string,
) {
  const [sort, setSort] = useState<{ col: C; dir: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Partial<Record<C, string[]>>>({});

  function unique(col: C) {
    return [...new Set(rows.map((row) => cell(row, col)))].sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true }),
    );
  }

  const filtered = useMemo(() => {
    let next = rows.filter((row) =>
      (Object.entries(filters) as Array<[C, string[]]>).every(([col, selected]) => {
        if (!selected) return true;
        return selected.includes(cell(row, col));
      }),
    );
    if (sort) {
      next = [...next].sort((a, b) => {
        const cmp = cell(a, sort.col).localeCompare(cell(b, sort.col), "pt-BR", { numeric: true });
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return next;
  }, [rows, filters, sort, cell]);

  function apply(col: C, next: string[]) {
    const all = unique(col);
    setFilters((current) => {
      const copy = { ...current };
      if (next.length === all.length) delete copy[col];
      else copy[col] = next;
      return copy;
    });
  }

  const hasFilter = Object.keys(filters).length > 0 || Boolean(sort);

  function clear() {
    setFilters({});
    setSort(null);
  }

  return { filtered, filters, unique, apply, hasFilter, clear, setSort };
}
