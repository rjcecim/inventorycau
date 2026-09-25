"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExcelFilter } from "@/components/ui/ExcelFilter";
import { Button } from "@/components/ui/Button";
import { statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

type AssetRef = { id: string; tombo: string; modelo: string; serialNumber?: string | null };

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
  computadores?: AssetRef[];
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

function TomboItem({
  href,
  tombo,
  modelo,
  serialNumber,
  showSerial,
}: {
  href: string;
  tombo: string;
  modelo: string;
  serialNumber?: string | null;
  showSerial: boolean;
}) {
  return (
    <span className="inline-flex flex-col">
      <PatrimonioLink href={href} label={tombo} modelo={modelo} />
      {showSerial ? (
        <span className="text-[11px] font-normal leading-tight text-slate-400">{serialNumber || "—"}</span>
      ) : null}
    </span>
  );
}

export function VisaoGeralTable({ rows, initialSetor = "" }: { rows: Row[]; initialSetor?: string }) {
  const [showSerial, setShowSerial] = useState(false);
  const [sort, setSort] = useState<{ col: Col; dir: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Partial<Record<Col, string[]>>>(() =>
    initialSetor ? { setor: [initialSetor] } : {},
  );

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
      <div className="mb-3 flex items-center justify-end gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={showSerial}
          onClick={() => setShowSerial((current) => !current)}
          className="inline-flex items-center gap-2 text-sm text-slate-600"
        >
          <span
            className={cn(
              "relative h-5 w-9 rounded-full transition",
              showSerial ? "bg-brand" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
                showSerial ? "left-4" : "left-0.5",
              )}
            />
          </span>
          Mostrar S/N
        </button>
        {hasFilter ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setFilters({}); setSort(null); }}
          >
            Limpar filtros
          </Button>
        ) : null}
      </div>
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
                    {(row.computadores ?? []).length ? (
                      <span className="flex flex-wrap gap-x-2">
                        {(row.computadores ?? []).map((item, index) => (
                          <span key={item.id}>
                            <TomboItem
                              href={`/computadores/${item.id}`}
                              tombo={item.tombo}
                              modelo={item.modelo}
                              serialNumber={item.serialNumber}
                              showSerial={showSerial}
                            />
                            {!showSerial && index < (row.computadores?.length ?? 0) - 1 ? "," : ""}
                          </span>
                        ))}
                      </span>
                    ) : row.kind === "computer" ? (
                      <PatrimonioLink href={row.href} label={row.computadorTombo} modelo={row.modeloComputador} />
                    ) : (
                      <span className="font-normal text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.modeloComputador || "—"}</td>
                  <td className="px-4 py-3 font-medium">
                    {shown.length ? (
                      <span className="flex flex-wrap gap-x-2">
                        {shown.map((monitor, index) => (
                          <span key={monitor.id}>
                            <TomboItem
                              href={`/monitores/${monitor.id}`}
                              tombo={monitor.tombo}
                              modelo={monitor.modelo}
                              serialNumber={monitor.serialNumber}
                              showSerial={showSerial}
                            />
                            {!showSerial && index < shown.length - 1 ? "," : ""}
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
