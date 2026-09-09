"use client";

import { useActionState, useState } from "react";
import type { AssetStatus } from "@prisma/client";
import { saveMonitor } from "@/app/actions/monitores";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS, statusLabel } from "@/lib/status";
import { formatPredio } from "@/lib/predios";
import { setorLabel } from "@/lib/alocacao";

type Option = { id: string; nome?: string; codigo?: string; tombo?: string; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; departamentoCodigo: string; departamentoNome: string };
type ComputerOption = {
  id: string;
  tombo: string;
  usuario: string | null;
  status: AssetStatus;
  departamento: { codigo: string; nome: string } | null;
};

export function MonitorForm({
  monitor,
  departments,
  locations,
  computers,
  people = [],
  onSuccess,
}: {
  monitor?: {
    id: string;
    tombo: string;
    serialNumber: string | null;
    fabricante: string | null;
    modelo: string | null;
    tamanho: string | null;
    resolucao: string | null;
    conexoes: string | null;
    status: AssetStatus;
    observacoes: string | null;
    usuario: string | null;
    servidorId: string | null;
    departamentoId: string | null;
    localizacaoId: string | null;
    computadorId: string | null;
  };
  departments: Option[];
  locations: Option[];
  computers: ComputerOption[];
  people?: PersonOption[];
  onSuccess?: () => void;
}) {
  const [computadorId, setComputadorId] = useState(monitor?.computadorId ?? "");
  const linkedComputer = computers.find((item) => item.id === computadorId) ?? null;

  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await saveMonitor(prev, fd);
    if (res.success) onSuccess?.();
    return res;
  }, null);

  return (
    <form action={action} className="grid gap-4">
      {monitor ? <input type="hidden" name="id" value={monitor.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patrimônio">
          <TextInput name="tombo" required defaultValue={monitor?.tombo} placeholder="MON-0001" />
        </Field>
        <Field label="Nº de série">
          <TextInput name="serialNumber" defaultValue={monitor?.serialNumber ?? ""} />
        </Field>
        <Field label="Fabricante">
          <TextInput name="fabricante" defaultValue={monitor?.fabricante ?? ""} />
        </Field>
        <Field label="Modelo">
          <TextInput name="modelo" defaultValue={monitor?.modelo ?? ""} />
        </Field>
        <Field label="Tamanho">
          <TextInput name="tamanho" defaultValue={monitor?.tamanho ?? ""} placeholder='24"' />
        </Field>
        <Field label="Resolução">
          <TextInput name="resolucao" defaultValue={monitor?.resolucao ?? ""} placeholder="1920x1080" />
        </Field>
        <Field label="Conexões">
          <TextInput name="conexoes" defaultValue={monitor?.conexoes ?? ""} placeholder="HDMI, DP" />
        </Field>
        {linkedComputer ? (
          <input type="hidden" name="status" value={linkedComputer.status} />
        ) : (
          <Field label="Status">
            <SearchSelect
              name="status"
              allowEmpty={false}
              placeholder="Pesquisar status…"
              defaultValue={monitor?.status ?? "AVAILABLE"}
              options={STATUS_OPTIONS}
            />
          </Field>
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mover para</p>
      <Field label="Computador" hint="herda usuário, setor e status do PC">
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
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Este monitor ficará com o usuário <span className="font-medium text-slate-900">{linkedComputer.usuario || "não informado"}</span>
          {", o setor "}
          <span className="font-medium text-slate-900">{setorLabel(linkedComputer.departamento) || "não informado"}</span>
          {" e o status "}
          <span className="font-medium text-slate-900">{statusLabel(linkedComputer.status)}</span> do computador.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Setor" hint="quando não estiver em um computador">
            <SearchSelect
              name="departamentoId"
              defaultValue={monitor?.departamentoId ?? ""}
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
              defaultValue={monitor?.localizacaoId ?? ""}
              placeholder="Pesquisar prédio…"
              options={locations.map((item) => ({
                id: item.id,
                label: formatPredio({ nome: item.nome ?? "", cidade: item.cidade, uf: item.uf }),
              }))}
            />
          </Field>
          <Field label="Usuário" hint="opcional">
            <SearchSelect
              name="servidorId"
              defaultValue={monitor?.servidorId ?? ""}
              emptyLabel="Nenhum"
              placeholder="Pesquisar usuário…"
              options={people.map((person) => ({
                id: person.id,
                label: `${person.nome} (${person.departamentoCodigo}. ${person.departamentoNome})`,
              }))}
            />
          </Field>
        </div>
      )}

      <Field label="Observações">
        <TextArea name="observacoes" defaultValue={monitor?.observacoes ?? ""} />
      </Field>
      {state && "error" in state && state.error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
