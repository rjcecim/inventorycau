"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExcelFilter } from "@/components/ui/ExcelFilter";
import { Button } from "@/components/ui/Button";
import { statusLabel } from "@/lib/status";

type AssetRef = { id: string; tombo: string; modelo: string };

type Row = {
  id: string;
  kind: "computer" | "monitor";
  href: string;
  setor: string;
  predio: string;
  computadorTombo: string;
  modeloComputador: string;
  status: AssetStatus;
  usuario: string;
  monitores: AssetRef[];
};

type Col =
  | "setor"
  | "predio"
  | "computador"
  | "modeloComputador"
  | "monitores"
  | "modeloMonitor"
  | "usuario"
  | "status";

const EMPTY = "(Em branco)";

function monitorModelo(monitor: AssetRef) {
  return monitor.modelo.trim() || EMPTY;
}

/** Valores individuais usados no filtro (sem agrupar). */
function tokens(row: Row, col: Col): string[] {
  if (col === "monitores") {
    if (!row.monitores.length) return [EMPTY];
    return row.monitores.map((item) => item.tombo);
  }
  if (col === "modeloMonitor") {
    if (!row.monitores.length) return [EMPTY];
    return [...new Set(row.monitores.map(monitorModelo))];
  }
  if (col === "setor") return [row.setor || EMPTY];
  if (col === "predio") return [row.predio || EMPTY];
  if (col === "computador") return [row.computadorTombo || EMPTY];
  if (col === "modeloComputador") return [row.modeloComputador || EMPTY];
  if (col === "usuario") return [row.usuario || EMPTY];
  if (col === "status") return [statusLabel(row.status)];
  return [EMPTY];
}

function sortKey(row: Row, col: Col) {
  return tokens(row, col).join(", ");
}

function unique(rows: Row[], col: Col) {
  return [...new Set(rows.flatMap((row) => tokens(row, col)))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );
}

function matchesFilter(row: Row, col: Col, selected: string[]) {
  return tokens(row, col).some((token) => selected.includes(token));
}

/** Monitores exibidos na linha conforme os filtros ativos dessas colunas. */
function visibleMonitors(row: Row, filters: Partial<Record<Col, string[]>>) {
  let list = row.monitores;
  const tomboFilter = filters.monitores;
  const modeloFilter = filters.modeloMonitor;

  if (tomboFilter) {
    list = list.filter((item) => tomboFilter.includes(item.tombo));
  }
  if (modeloFilter) {
    list = list.filter((item) => modeloFilter.includes(monitorModelo(item)));
  }
  return list;
}

function PatrimonioLink({ href, label, modelo }: { href: string; label: string; modelo: string }) {
  return (
    <Link className="font-medium text-brand hover:underline" href={href} title={modelo || "Modelo não informado"}>
      {label}
    </Link>
  );
}

export function VisaoGeralTable({ rows }: { rows: Row[] }) {
  const [sort, setSort] = useState<{ col: Col; dir: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Partial<Record<Col, string[]>>>({});

  const filtered = useMemo(() => {
    let next = rows.filter((row) =>
      (Object.entries(filters) as Array<[Col, string[]]>).every(([col, selected]) => {
        if (!selected) return true;
        return matchesFilter(row, col, selected);
      }),
    );
    if (sort) {
      next = [...next].sort((a, b) => {
        const cmp = sortKey(a, sort.col).localeCompare(sortKey(b, sort.col), "pt-BR", { numeric: true });
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return next;
  }, [rows, filters, sort]);

  function apply(col: Col, next: string[]) {
    const all = unique(rows, col);
    setFilters((current) => {
      const copy = { ...current };
      if (next.length === all.length) delete copy[col];
      else copy[col] = next;
      return copy;
    });
  }

  const hasFilter = Object.keys(filters).length > 0 || sort;

  return (
    <>
      {hasFilter ? (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setFilters({}); setSort(null); }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : null}
      <div className="surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left">
            <tr>
              {([
                ["setor", "Setor", "Setor", "left"],
                ["predio", "Prédio", "Prédio", "left"],
                ["computador", "Tombo PC", "Patrimônio do computador", "left"],
                ["modeloComputador", "Modelo PC", "Modelo do computador", "left"],
                ["monitores", "Tombo Monitor", "Patrimônio dos monitores", "left"],
                ["modeloMonitor", "Modelo Monitor", "Modelo do monitor", "left"],
                ["usuario", "Usuário", "Nome do usuário", "right"],
                ["status", "Status", "Status", "right"],
              ] as Array<[Col, string, string, "left" | "right"]>).map(([col, label, title, align]) => (
                <th key={col} className="px-3 py-2">
                  <ExcelFilter
                    label={label}
                    title={title}
                    options={unique(rows, col)}
                    selected={filters[col] ?? unique(rows, col)}
                    active={Boolean(filters[col])}
                    align={align}
                    onApply={(next) => apply(col, next)}
                    onSort={(dir) => setSort({ col, dir })}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const shown = visibleMonitors(row, filters);
              const modelos = [...new Set(shown.map(monitorModelo).filter((item) => item !== EMPTY))];

              return (
                <tr key={row.id} className="border-b border-line last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{row.setor || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.predio || "—"}</td>
                  <td className="px-4 py-3 font-medium">
                    {row.kind === "computer" ? (
                      <PatrimonioLink href={row.href} label={row.computadorTombo} modelo={row.modeloComputador} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.modeloComputador || "—"}</td>
                  <td className="px-4 py-3 font-medium">
                    {shown.length ? (
                      <span className="flex flex-wrap gap-x-2">
                        {shown.map((monitor, index) => (
                          <span key={monitor.id}>
                            <PatrimonioLink href={`/monitores/${monitor.id}`} label={monitor.tombo} modelo={monitor.modelo} />
                            {index < shown.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="font-normal text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{modelos.join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.usuario || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? (
          <EmptyState
            title="Nenhum registro nesta visão"
            description="Ajuste os filtros do cabeçalho ou cadastre equipamentos."
          />
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {filtered.length} de {rows.length} registros
      </p>
    </>
  );
}
