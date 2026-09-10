"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowLeftRight, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExcelFilter } from "@/components/ui/ExcelFilter";
import { EMPTY_FILTER, useExcelFilters } from "@/components/ui/useExcelFilters";
import { statusLabel } from "@/lib/status";
import { monitorAlocacao, setorLabel } from "@/lib/alocacao";
import { formatPredio } from "@/lib/predios";

type Loc = { id?: string; nome: string; cidade?: string | null; uf?: string | null };

type Row = {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  usuario: string | null;
  departamento: { id?: string; nome: string; codigo?: string } | null;
  localizacao: Loc | null;
  computador: {
    id: string;
    tombo: string;
    usuario: string | null;
    status: AssetStatus;
    departamento: { codigo?: string; nome: string } | null;
    localizacao: Loc | null;
  } | null;
};

type Col = "tombo" | "modelo" | "computador" | "usuario" | "setor" | "predio" | "status";

function cell(row: Row, col: Col) {
  const alocacao = monitorAlocacao(row);
  if (col === "tombo") return row.tombo || EMPTY_FILTER;
  if (col === "modelo") return row.modelo || EMPTY_FILTER;
  if (col === "computador") return row.computador?.tombo || EMPTY_FILTER;
  if (col === "usuario") return alocacao.usuario || EMPTY_FILTER;
  if (col === "setor") return setorLabel(alocacao.departamento) || EMPTY_FILTER;
  if (col === "predio") return formatPredio(alocacao.localizacao) || EMPTY_FILTER;
  return statusLabel(alocacao.status);
}

const COLUMNS: Array<[Col, string, "left" | "right"]> = [
  ["tombo", "Patrimônio", "left"],
  ["modelo", "Modelo", "left"],
  ["computador", "Computador", "left"],
  ["usuario", "Usuário", "left"],
  ["setor", "Setor", "left"],
  ["predio", "Prédio", "left"],
  ["status", "Status", "right"],
];

export function MonitorTable({
  monitors,
  isAdmin,
}: {
  monitors: Row[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const getCell = useCallback(cell, []);
  const { filtered, filters, unique, apply, hasFilter, clear, setSort } = useExcelFilters(monitors, getCell);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {hasFilter ? (
          <Button variant="ghost" type="button" onClick={clear}>
            Limpar filtros
          </Button>
        ) : null}
        {isAdmin ? (
          <Link
            href="/monitores/novo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            <Plus size={16} /> Novo monitor
          </Link>
        ) : null}
      </div>
      <div className="surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left">
            <tr>
              {COLUMNS.map(([col, label, align]) => (
                <th key={col} className="px-3 py-2">
                  <ExcelFilter
                    label={label}
                    options={unique(col)}
                    selected={filters[col] ?? unique(col)}
                    active={Boolean(filters[col])}
                    align={align}
                    onApply={(next) => apply(col, next)}
                    onSort={(dir) => setSort({ col, dir })}
                  />
                </th>
              ))}
              <th className="px-3 py-2 text-right">
                <span className="inline-flex items-center whitespace-nowrap rounded-md px-1 py-0.5 text-[11px] font-semibold text-slate-500">
                  Ações
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const alocacao = monitorAlocacao(row);
              return (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    router.push(`/monitores/${row.id}`);
                  }}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{row.tombo}</td>
                  <td className="px-4 py-3 text-slate-600">{row.modelo || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.computador ? (
                      <Link
                        className="font-medium text-brand hover:underline"
                        href={`/computadores/${row.computador.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.computador.tombo}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{alocacao.usuario || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{setorLabel(alocacao.departamento) || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatPredio(alocacao.localizacao) || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={alocacao.status} /></td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="Mover"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/monitores/${row.id}/mover`);
                        }}
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Editar"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/monitores/${row.id}/editar`);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum monitor encontrado" description="Ajuste os filtros do cabeçalho ou cadastre um novo ativo." /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {monitors.length} monitores</p>
    </>
  );
}
