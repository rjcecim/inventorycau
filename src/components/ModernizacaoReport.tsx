"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  buildModernizationIndexes,
  computeModernization,
  isInModernizationScope,
  type ModernizationSituation,
} from "@/lib/modernizacao";
import { saveApuracaoModernizacao } from "@/app/actions/modernizacao";

export type ModernizacaoRow = {
  id: string;
  kind: "COMPUTER" | "MONITOR";
  tombo: string;
  fabricante: string | null;
  modelo: string | null;
  setorId: string | null;
  setorLabel: string;
  dataRecebimento: string | null;
};

export type ApuracaoResumo = {
  id: string;
  ano: number;
  dataReferencia: string;
  escopo: string;
  observacao: string | null;
  createdDate: string;
  createdByName: string | null;
  resultado: unknown;
  equipamentos: unknown;
};

type Enriched = ModernizacaoRow & { mod: ReturnType<typeof computeModernization> };

type Col =
  | "tombo"
  | "tipo"
  | "modelo"
  | "setor"
  | "recebimento"
  | "prazo"
  | "dataLimite"
  | "situacao"
  | "tempo";

const COLUMNS: Array<[Col, string, "left" | "right"]> = [
  ["tombo", "Patrimônio", "left"],
  ["tipo", "Tipo", "left"],
  ["modelo", "Fabricante / modelo", "left"],
  ["setor", "Setor", "left"],
  ["recebimento", "Recebimento", "left"],
  ["prazo", "Prazo", "left"],
  ["dataLimite", "Data limite", "left"],
  ["situacao", "Situação", "left"],
  ["tempo", "Tempo", "right"],
];

function matchesSituation(situation: ModernizationSituation, filter: string) {
  if (!filter || filter === "todas") return true;
  return situation === filter;
}

function cell(row: Enriched, col: Col) {
  if (col === "tombo") return row.tombo || EMPTY_FILTER;
  if (col === "tipo") return row.kind === "COMPUTER" ? "Computador" : "Monitor";
  if (col === "modelo") {
    return [row.fabricante, row.modelo].filter(Boolean).join(" / ") || EMPTY_FILTER;
  }
  if (col === "setor") return row.setorLabel || EMPTY_FILTER;
  if (col === "recebimento") return formatCalendarDate(row.mod.receivedAt);
  if (col === "prazo") return `${row.mod.years} anos`;
  if (col === "dataLimite") return formatCalendarDate(row.mod.deadline);
  if (col === "situacao") return row.mod.situationLabel;
  return row.mod.daysLabel === "—" ? EMPTY_FILTER : row.mod.daysLabel;
}

export function ModernizacaoReport({
  rows,
  setores,
  apuracoes,
  canSave,
  initialTipo = "todos",
}: {
  rows: ModernizacaoRow[];
  setores: { id: string; label: string }[];
  apuracoes: ApuracaoResumo[];
  canSave: boolean;
  initialTipo?: string;
}) {
  const router = useRouter();
  const todayIso = calendarToIso(todayCalendar());
  const [tipo, setTipo] = useState(initialTipo === "COMPUTER" || initialTipo === "MONITOR" ? initialTipo : "todos");
  const [situacao, setSituacao] = useState("todas");
  const [setor, setSetor] = useState("todos");
  const [refDate, setRefDate] = useState(todayIso);
  const [ano, setAno] = useState(String(todayCalendar().y));
  const [observacao, setObservacao] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedApuracao, setSelectedApuracao] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const asOf = parseIsoDate(refDate) ?? todayCalendar();
  const isSimulation = calendarToIso(asOf) !== todayIso;

  const scoped = useMemo(() => {
    return rows
      .filter((row) => isInModernizationScope({ dataRecebimento: row.dataRecebimento, asOf }))
      .map((row) => ({
        ...row,
        mod: computeModernization({
          kind: row.kind,
          dataRecebimento: row.dataRecebimento,
          asOf,
        }),
      }))
      .filter((row) => {
        if (tipo !== "todos" && row.kind !== tipo) return false;
        if (!matchesSituation(row.mod.situation, situacao)) return false;
        if (setor !== "todos" && row.setorId !== setor) return false;
        return true;
      })
      .sort((a, b) => {
        if (!a.mod.deadline && !b.mod.deadline) return a.tombo.localeCompare(b.tombo);
        if (!a.mod.deadline) return 1;
        if (!b.mod.deadline) return -1;
        return compareCalendar(a.mod.deadline, b.mod.deadline);
      });
  }, [rows, asOf, tipo, situacao, setor]);

  const getCell = useCallback((row: Enriched, col: Col) => cell(row, col), []);
  const { filtered, filters, unique, apply, hasFilter, clear, setSort } = useExcelFilters(scoped, getCell);

  const indexes = buildModernizationIndexes(
    filtered.map((row) => ({ kind: row.kind, dataRecebimento: row.dataRecebimento })),
    asOf,
  );

  const selected = apuracoes.find((item) => item.id === selectedApuracao) ?? null;

  return (
    <div className="space-y-4 print:space-y-3">
      {isSimulation ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
          Simulação com base no cadastro atual e data de referência passada — não reconstrói o histórico daquela data.
          Equipamentos recebidos após {formatCalendarDate(asOf)} ficam fora do escopo.
        </div>
      ) : null}

      <div className="surface grid gap-3 p-4 print:hidden sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Data de referência">
          <TextInput type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <select
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="COMPUTER">Computador</option>
            <option value="MONITOR">Monitor</option>
          </select>
        </Field>
        <Field label="Situação">
          <select
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="no_prazo">Dentro do prazo</option>
            <option value="fora_prazo">Prazo excedido</option>
            <option value="sem_data">Data não informada</option>
          </select>
        </Field>
        <Field label="Setor">
          <select
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
          >
            <option value="todos">Todos</option>
            {setores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() =>
              downloadCsv(
                `modernizacao-${refDate}.csv`,
                [
                  "Patrimônio",
                  "Tipo",
                  "Fabricante/Modelo",
                  "Setor",
                  "Recebimento",
                  "Prazo aplicável",
                  "Data limite",
                  "Situação",
                  "Tempo",
                ],
                filtered.map((row) => [
                  row.tombo,
                  row.kind === "COMPUTER" ? "Computador" : "Monitor",
                  [row.fabricante, row.modelo].filter(Boolean).join(" / "),
                  row.setorLabel,
                  formatCalendarDate(row.mod.receivedAt),
                  `${row.mod.years} anos`,
                  formatCalendarDate(row.mod.deadline),
                  row.mod.situationLabel,
                  row.mod.daysLabel,
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

      <div className="rounded-xl border border-line bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Escopo dos índices abaixo: resultado filtrado desta consulta (não é índice geral oficial do inventário).
        Equipamentos fora do escopo por recebimento posterior à referência não entram.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {indexes.map((item) => (
          <div key={item.kind} className="surface p-4">
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {item.applicable && item.index != null ? `${item.index.toFixed(1)}%` : "Não aplicável"}
            </p>
            {item.provisional ? (
              <p className="mt-1 text-[11px] font-medium text-amber-700">Provisório — faltam datas</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              {item.within} no prazo · {item.outside} excedido · {item.missing} sem data · total {item.total}
            </p>
          </div>
        ))}
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
                  <Link
                    className="text-brand hover:underline"
                    href={row.kind === "COMPUTER" ? `/computadores/${row.id}` : `/monitores/${row.id}`}
                  >
                    {row.tombo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.kind === "COMPUTER" ? "Computador" : "Monitor"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {[row.fabricante, row.modelo].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{row.setorLabel || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatCalendarDate(row.mod.receivedAt)}</td>
                <td className="px-4 py-3 text-slate-600">{row.mod.years} anos</td>
                <td className="px-4 py-3 text-slate-600">{formatCalendarDate(row.mod.deadline)}</td>
                <td className="px-4 py-3">
                  <ModBadge situation={row.mod.situation} label={row.mod.situationLabel} />
                </td>
                <td className="px-4 py-3 text-slate-600">{row.mod.daysLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="surface space-y-4 p-5 print:hidden">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Apurações anuais salvas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Snapshot imutável da medição anual. Alterações posteriores no cadastro não recalculam apurações já
            gravadas.
          </p>
        </div>

        {canSave ? (
          <div className="grid gap-3 rounded-xl border border-line bg-slate-50 p-4 sm:grid-cols-4">
            <Field label="Ano">
              <TextInput value={ano} onChange={(e) => setAno(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Data de referência">
              <TextInput type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
            </Field>
            <Field label="Observação">
              <TextInput value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional" />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full"
                disabled={pending}
                onClick={() => {
                  setMessage(null);
                  setError(null);
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.set("ano", ano);
                    fd.set("dataReferencia", refDate);
                    if (observacao.trim()) fd.set("observacao", observacao.trim());
                    const result = await saveApuracaoModernizacao(null, fd);
                    if (result?.error) setError(result.error);
                    else {
                      setMessage(result?.ok ?? "Apuração salva.");
                      router.refresh();
                    }
                  });
                }}
              >
                {pending ? "Salvando…" : "Salvar apuração do ano"}
              </Button>
            </div>
            {error ? <p className="sm:col-span-4 text-sm text-rose-700">{error}</p> : null}
            {message ? <p className="sm:col-span-4 text-sm text-emerald-700">{message}</p> : null}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Somente administradores podem gravar apurações anuais.</p>
        )}

        {apuracoes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma apuração anual salva ainda.</p>
        ) : (
          <div className="space-y-2">
            {apuracoes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedApuracao((cur) => (cur === item.id ? null : item.id))}
                className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-semibold text-slate-900">Ano {item.ano}</span>
                  <span className="ml-2 text-slate-500">
                    ref. {formatCalendarDate(parseIsoDate(item.dataReferencia))} ·{" "}
                    {item.createdByName || "sistema"}
                  </span>
                </span>
                <span className="text-xs text-brand">{selectedApuracao === item.id ? "Ocultar" : "Ver snapshot"}</span>
              </button>
            ))}
          </div>
        )}

        {selected ? <ApuracaoSnapshot apuracao={selected} /> : null}
      </section>
    </div>
  );
}

function ModBadge({ situation, label }: { situation: ModernizationSituation; label: string }) {
  const cls =
    situation === "no_prazo"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : situation === "fora_prazo"
        ? "bg-rose-50 text-rose-800 ring-rose-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${cls}`}>{label}</span>;
}

function ApuracaoSnapshot({ apuracao }: { apuracao: ApuracaoResumo }) {
  const resultado = Array.isArray(apuracao.resultado) ? apuracao.resultado : [];
  const equipamentos = Array.isArray(apuracao.equipamentos) ? apuracao.equipamentos : [];

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <p className="text-xs text-slate-500">
        Snapshot imutável · escopo {apuracao.escopo} · gravado em{" "}
        {new Date(apuracao.createdDate).toLocaleString("pt-BR")}
        {apuracao.observacao ? ` · ${apuracao.observacao}` : ""}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {resultado.map((item, idx) => {
          const row = item as {
            label?: string;
            summary?: string;
            within?: number;
            outside?: number;
            missing?: number;
            total?: number;
          };
          return (
            <div key={idx} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">{row.label ?? "Categoria"}</p>
              <p className="text-slate-600">{row.summary ?? "—"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {row.within ?? 0} no prazo · {row.outside ?? 0} excedido · {row.missing ?? 0} sem data · total{" "}
                {row.total ?? 0}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">{equipamentos.length} equipamento(s) no snapshot.</p>
    </div>
  );
}
