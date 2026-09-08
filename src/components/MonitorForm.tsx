"use client";

import { useActionState } from "react";
import type { AssetStatus } from "@prisma/client";
import { saveMonitor } from "@/app/actions/monitores";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { STATUS_ORDER, statusLabel } from "@/lib/status";
import { formatPredio } from "@/lib/predios";

type Option = { id: string; nome?: string; codigo?: string; tombo?: string; hostname?: string | null; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; departamentoCodigo: string; departamentoNome: string };

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
  computers: Option[];
  people?: PersonOption[];
  onSuccess?: () => void;
}) {
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
        <Field label="Status">
          <SelectInput name="status" defaultValue={monitor?.status ?? "AVAILABLE"}>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Usuário cadastrado" hint="opcional">
          <SelectInput name="servidorId" defaultValue={monitor?.servidorId ?? ""}>
            <option value="">Nenhum / informar manualmente</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome} ({person.departamentoCodigo}. {person.departamentoNome})
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Usuário (texto)">
          <TextInput name="usuario" defaultValue={monitor?.usuario ?? ""} />
        </Field>
        <Field label="Setor">
          <SelectInput name="departamentoId" defaultValue={monitor?.departamentoId ?? ""}>
            <option value="">Não informado</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.codigo ? `${item.codigo}. ${item.nome}` : item.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Prédio">
          <SelectInput name="localizacaoId" defaultValue={monitor?.localizacaoId ?? ""}>
            <option value="">Não informado</option>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>{formatPredio({ nome: item.nome ?? "", cidade: item.cidade, uf: item.uf })}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Computador associado">
          <SelectInput name="computadorId" defaultValue={monitor?.computadorId ?? ""}>
            <option value="">Nenhum</option>
            {computers.map((item) => (
              <option key={item.id} value={item.id}>{item.hostname || item.tombo} ({item.tombo})</option>
            ))}
          </SelectInput>
        </Field>
      </div>
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
