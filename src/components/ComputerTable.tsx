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
import { formatPredio } from "@/lib/predios";
import { setorLabel } from "@/lib/alocacao";

type Row = {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  usuario: string | null;
  departamento: { id: string; nome: string; codigo?: string } | null;
  localizacao: { id: string; nome: string; cidade: string; uf: string | null } | null;
  _count: { monitores: number };
};

type Col = "tombo" | "modelo" | "usuario" | "setor" | "predio" | "status" | "monitores";

function cell(row: Row, col: Col) {
  if (col === "tombo") return row.tombo || EMPTY_FILTER;
  if (col === "modelo") return row.modelo || EMPTY_FILTER;
  if (col === "usuario") return row.usuario || EMPTY_FILTER;
  if (col === "setor") return setorLabel(row.departamento) || EMPTY_FILTER;
  if (col === "predio") return formatPredio(row.localizacao) || EMPTY_FILTER;
  if (col === "status") return statusLabel(row.status);
  return String(row._count.monitores);
}

const COLUMNS: Array<[Col, string, "left" | "right"]> = [
  ["tombo", "Patrimônio", "left"],
  ["modelo", "Modelo", "left"],
  ["usuario", "Usuário", "left"],
  ["setor", "Setor", "left"],
  ["predio", "Prédio", "left"],
  ["status", "Status", "right"],
  ["monitores", "Monitores", "right"],
];

export function ComputerTable({
  computers,
  isAdmin,
}: {
  computers: Row[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const getCell = useCallback((row: Row, col: Col) => cell(row, col), []);
  const { filtered, filters, unique, apply, hasFilter, clear, setSort } = useExcelFilters(computers, getCell);

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
            href="/computadores/novo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            <Plus size={16} /> Novo computador
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
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a, button")) return;
                  router.push(`/computadores/${row.id}`);
                }}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{row.tombo}</td>
                <td className="px-4 py-3 text-slate-600">{row.modelo || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.usuario || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{setorLabel(row.departamento) || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatPredio(row.localizacao) || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-slate-600">{row._count.monitores}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-0.5">
                    <button
                      type="button"
                      className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      title="Mover"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/computadores/${row.id}/mover`);
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
                          router.push(`/computadores/${row.id}/editar`);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum computador encontrado" description="Ajuste os filtros do cabeçalho ou cadastre um novo ativo." /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {computers.length} computadores</p>
    </>
  );
}
