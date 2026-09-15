"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { ExcelFilter } from "@/components/ui/ExcelFilter";
import { EMPTY_FILTER, useExcelFilters } from "@/components/ui/useExcelFilters";
import { downloadCsv } from "@/lib/csv";
import {
  calendarToIso,
  compareCalendar,
  formatCalendarDate,
  parseIsoDate,
  todayCalendar,
} from "@/lib/dates";
import { computeWarranty, matchesWarrantyFilter, type WarrantySituation } from "@/lib/garantia";

export type GarantiaRow = {
  id: string;
  kind: "COMPUTER" | "MONITOR";
  tombo: string;
  fabricante: string | null;
  modelo: string | null;
  setorId: string | null;
  setorLabel: string;
  dataNotaFiscal: string | null;
  dataRecebimento: string | null;
  prazoGarantiaAnos: number | null;
};

type Enriched = GarantiaRow & { warranty: ReturnType<typeof computeWarranty> };

type Col =
  | "tombo"
  | "tipo"
  | "modelo"
  | "setor"
  | "notaFiscal"
  | "recebimento"
  | "prazo"
  | "vencimento"
  | "situacao"
  | "dias";

const COLUMNS: Array<[Col, string, "left" | "right"]> = [
  ["tombo", "Patrimônio", "left"],
  ["tipo", "Tipo", "left"],
  ["modelo", "Modelo", "left"],
  ["setor", "Setor", "left"],
  ["notaFiscal", "Nota fiscal", "left"],
  ["recebimento", "Recebimento", "left"],
  ["prazo", "Prazo", "left"],
  ["vencimento", "Vencimento", "left"],
  ["situacao", "Situação", "left"],
  ["dias", "Dias", "right"],
];

function cell(row: Enriched, col: Col) {
  if (col === "tombo") return row.tombo || EMPTY_FILTER;
  if (col === "tipo") return row.kind === "COMPUTER" ? "Computador" : "Monitor";
  if (col === "modelo") return row.modelo || EMPTY_FILTER;
  if (col === "setor") return row.setorLabel || EMPTY_FILTER;
  if (col === "notaFiscal") return formatCalendarDate(parseIsoDate(row.dataNotaFiscal ?? ""));
  if (col === "recebimento") return formatCalendarDate(row.warranty.receivedAt);
  if (col === "prazo") {
    return row.warranty.years == null ? EMPTY_FILTER : `${row.warranty.years} ano(s)`;
  }
  if (col === "vencimento") return formatCalendarDate(row.warranty.expiresAt);
  if (col === "situacao") return row.warranty.situationLabel;
  return row.warranty.daysLabel === "—" ? EMPTY_FILTER : row.warranty.daysLabel;
}

export function GarantiasReport({
  rows,
  setores,
  initialSituacao = "todas",
}: {
  rows: GarantiaRow[];
  setores: { id: string; label: string }[];
  initialSituacao?: string;
}) {
  const [tipo, setTipo] = useState("todos");
  const [situacao, setSituacao] = useState(initialSituacao);
  const [setor, setSetor] = useState("todos");
  const [vencFrom, setVencFrom] = useState("");
  const [vencTo, setVencTo] = useState("");
  const [refDate, setRefDate] = useState(calendarToIso(todayCalendar()));
  const asOf = parseIsoDate(refDate) ?? todayCalendar();

  const scoped = useMemo(() => {
    const from = parseIsoDate(vencFrom);
    const to = parseIsoDate(vencTo);
    return rows
      .map((row) => ({
        ...row,
        warranty: computeWarranty({
          dataRecebimento: row.dataRecebimento,
          prazoGarantiaAnos: row.prazoGarantiaAnos,
          asOf,
        }),
      }))
      .filter((row) => {
        if (tipo !== "todos" && row.kind !== tipo) return false;
        if (!matchesWarrantyFilter(row.warranty.situation, situacao)) return false;
        if (setor !== "todos" && row.setorId !== setor) return false;
        if (from || to) {
          if (!row.warranty.expiresAt) return false;
          if (from && compareCalendar(row.warranty.expiresAt, from) < 0) return false;
          if (to && compareCalendar(row.warranty.expiresAt, to) > 0) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (!a.warranty.expiresAt && !b.warranty.expiresAt) return a.tombo.localeCompare(b.tombo);
        if (!a.warranty.expiresAt) return 1;
        if (!b.warranty.expiresAt) return -1;
        return compareCalendar(a.warranty.expiresAt, b.warranty.expiresAt);
      });
  }, [rows, asOf, tipo, situacao, setor, vencFrom, vencTo]);

  const getCell = useCallback((row: Enriched, col: Col) => cell(row, col), []);
  const { filtered, filters, unique, apply, hasFilter, clear, setSort } = useExcelFilters(scoped, getCell);

  const totals = {
    total: filtered.length,
    vigente: filtered.filter((row) => row.warranty.isVigente).length,
    vence90: filtered.filter((row) => row.warranty.situation === "vence_90").length,
    vencida: filtered.filter((row) => row.warranty.situation === "vencida").length,
    incompleto: filtered.filter((row) => row.warranty.situation === "incompleto").length,
  };

  return (
    <div className="space-y-4 print:space-y-3">
      <div className="surface grid gap-3 p-4 print:hidden sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Field label="Referência">
          <TextInput type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <select className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="COMPUTER">Computador</option>
            <option value="MONITOR">Monitor</option>
          </select>
        </Field>
        <Field label="Situação">
          <select className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="vigente">Vigentes (inclui 90 dias)</option>
            <option value="vence_90">Vence em até 90 dias</option>
            <option value="vencida">Vencida</option>
            <option value="incompleto">Dados incompletos</option>
          </select>
        </Field>
        <Field label="Setor">
          <select className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm" value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="todos">Todos</option>
            {setores.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Vencimento de">
          <TextInput type="date" value={vencFrom} onChange={(e) => setVencFrom(e.target.value)} />
        </Field>
        <Field label="Vencimento até">
          <TextInput type="date" value={vencTo} onChange={(e) => setVencTo(e.target.value)} />
        </Field>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() =>
              downloadCsv(
                `garantias-${refDate}.csv`,
                ["Patrimônio", "Tipo", "Modelo", "Setor", "Nota fiscal", "Recebimento", "Prazo", "Vencimento", "Situação", "Dias"],
                filtered.map((row) => [
                  row.tombo,
                  row.kind === "COMPUTER" ? "Computador" : "Monitor",
                  row.modelo ?? "",
                  row.setorLabel,
                  formatCalendarDate(parseIsoDate(row.dataNotaFiscal ?? "")),
                  formatCalendarDate(row.warranty.receivedAt),
                  row.warranty.years,
                  formatCalendarDate(row.warranty.expiresAt),
                  row.warranty.situationLabel,
                  row.warranty.daysLabel,
                ]),
              )
            }
          >
            CSV
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <MiniStat label="Total filtrado" value={totals.total} />
        <MiniStat label="Vigentes" value={totals.vigente} tone="ok" />
        <MiniStat label="Até 90 dias" value={totals.vence90} tone="warn" />
        <MiniStat label="Vencidas" value={totals.vencida} tone="bad" />
        <MiniStat label="Incompletos" value={totals.incompleto} />
      </div>

      <div className="flex justify-end print:hidden">
        {hasFilter ? (
          <Button variant="ghost" type="button" onClick={clear}>
            Limpar filtros da tabela
          </Button>
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={`${row.kind}-${row.id}`} className="border-b border-line">
                <td className="px-4 py-3 font-medium">
                  <Link className="text-brand hover:underline" href={row.kind === "COMPUTER" ? `/computadores/${row.id}` : `/monitores/${row.id}`}>
                    {row.tombo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.kind === "COMPUTER" ? "Computador" : "Monitor"}</td>
                <td className="px-4 py-3 text-slate-600">{row.modelo || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.setorLabel || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatCalendarDate(parseIsoDate(row.dataNotaFiscal ?? ""))}</td>
                <td className="px-4 py-3 text-slate-600">{formatCalendarDate(row.warranty.receivedAt)}</td>
                <td className="px-4 py-3 text-slate-600">{row.warranty.years == null ? "—" : `${row.warranty.years} ano(s)`}</td>
                <td className="px-4 py-3 text-slate-600">{formatCalendarDate(row.warranty.expiresAt)}</td>
                <td className="px-4 py-3"><Badge situation={row.warranty.situation} label={row.warranty.situationLabel} /></td>
                <td className="px-4 py-3 text-slate-600">{row.warranty.daysLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-rose-700" : "text-slate-900";
  return (
    <div className="surface p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Badge({ situation, label }: { situation: WarrantySituation; label: string }) {
  const cls =
    situation === "vigente"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : situation === "vence_90"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : situation === "vencida"
          ? "bg-rose-50 text-rose-800 ring-rose-200"
          : "bg-slate-100 text-slate-700 ring-slate-200";
  return <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${cls}`}>{label}</span>;
}
