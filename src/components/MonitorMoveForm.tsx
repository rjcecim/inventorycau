"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { updateAlocacaoMonitor } from "@/app/actions/monitores";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS, statusLabel } from "@/lib/status";
import { formatPredio } from "@/lib/predios";
import { setorLabel } from "@/lib/alocacao";

type Option = { id: string; nome?: string; codigo?: string; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; matricula?: string | null };
type ComputerOption = {
  id: string;
  tombo: string;
  usuario: string | null;
  status: AssetStatus;
  departamento: { codigo: string; nome: string } | null;
  localizacao?: { nome: string; cidade?: string | null; uf?: string | null } | null;
};

export function MonitorMoveForm({
  monitor,
  departments,
  locations,
  computers,
  people = [],
  cancelHref,
  onSuccess,
}: {
  monitor: {
    id: string;
    tombo: string;
    status: AssetStatus;
    servidorId: string | null;
    departamentoId: string | null;
    localizacaoId: string | null;
    computadorId: string | null;
  };
  departments: Option[];
  locations: Option[];
  computers: ComputerOption[];
  people?: PersonOption[];
  cancelHref: string;
  onSuccess?: (id?: string) => void;
}) {
  const [computadorId, setComputadorId] = useState(monitor.computadorId ?? "");
  const linkedComputer = computers.find((item) => item.id === computadorId) ?? null;

  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await updateAlocacaoMonitor(prev, fd);
    if (res.success) onSuccess?.(res.id);
    return res;
  }, null);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={monitor.id} />
      <p className="text-sm text-slate-600">
        Movimentação do patrimônio <span className="font-semibold text-slate-900">{monitor.tombo}</span>.
        Associe a um computador ou aloque a setor, usuário e prédio.
      </p>

      <Field label="Computador" hint="ao associar, o monitor copia usuário, setor, prédio e status">
        <SearchSelect
          name="computadorId"
          value={computadorId}
          onChange={setComputadorId}
          emptyLabel="Nenhum — alocar só a um setor"
          placeholder="Pesquisar computador…"
          options={computers.map((item) => ({
            id: item.id,
            label: item.usuario ? `${item.tombo} — ${item.usuario}` : item.tombo,
          }))}
        />
      </Field>

      {linkedComputer ? (
        <>
          <input type="hidden" name="status" value={linkedComputer.status} />
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Este monitor ficará com o usuário{" "}
            <span className="font-medium text-slate-900">{linkedComputer.usuario || "não informado"}</span>
            {", o setor "}
            <span className="font-medium text-slate-900">{setorLabel(linkedComputer.departamento) || "não informado"}</span>
            {", o prédio "}
            <span className="font-medium text-slate-900">{formatPredio(linkedComputer.localizacao) || "não informado"}</span>
            {" e o status "}
            <span className="font-medium text-slate-900">{statusLabel(linkedComputer.status)}</span> deste computador.
          </p>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Usuário" hint="opcional">
            <SearchSelect
              name="servidorId"
              defaultValue={monitor.servidorId ?? ""}
              emptyLabel="Nenhum"
              placeholder="Pesquisar usuário…"
              options={people.map((person) => ({
                id: person.id,
                label: person.matricula ? `${person.nome} — ${person.matricula}` : person.nome,
              }))}
            />
          </Field>
          <Field label="Status">
            <SearchSelect
              name="status"
              allowEmpty={false}
              placeholder="Pesquisar status…"
              defaultValue={monitor.status}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="Setor">
            <SearchSelect
              name="departamentoId"
              defaultValue={monitor.departamentoId ?? ""}
              placeholder="Pesquisar setor…"
              options={departments.map((item) => ({
                id: item.id,
                label: item.codigo ? `${item.codigo}. ${item.nome}` : item.nome ?? "",
              }))}
            />
          </Field>
          <Field label="Prédio">
            <SearchSelect
              name="localizacaoId"
              defaultValue={monitor.localizacaoId ?? ""}
              placeholder="Pesquisar prédio…"
              options={locations.map((item) => ({
                id: item.id,
                label: formatPredio({ nome: item.nome ?? "", cidade: item.cidade, uf: item.uf }),
              }))}
            />
          </Field>
        </div>
      )}

      {state && "error" in state && state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar movimentação"}</Button>
      </div>
    </form>
  );
}
