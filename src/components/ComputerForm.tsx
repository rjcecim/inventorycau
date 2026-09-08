"use client";

import { useActionState } from "react";
import type { AssetStatus } from "@prisma/client";
import { saveComputador } from "@/app/actions/computadores";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { STATUS_ORDER, statusLabel } from "@/lib/status";
import { formatPredio } from "@/lib/predios";

type Option = { id: string; nome: string; codigo?: string; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; departamentoCodigo: string; departamentoNome: string };

export function ComputerForm({
  computer,
  departments,
  locations,
  people = [],
  onSuccess,
}: {
  computer?: {
    id: string;
    tombo: string;
    hostname: string | null;
    serialNumber: string | null;
    fabricante: string | null;
    modelo: string | null;
    status: AssetStatus;
    processador: string | null;
    memoriaRam: string | null;
    armazenamento: string | null;
    sistemaOperacional: string | null;
    soVersao: string | null;
    arquitetura: string | null;
    observacoes: string | null;
    usuario: string | null;
    servidorId: string | null;
    departamentoId: string | null;
    localizacaoId: string | null;
  };
  departments: Option[];
  locations: Option[];
  people?: PersonOption[];
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await saveComputador(prev, fd);
    if (res.success) onSuccess?.();
    return res;
  }, null);

  return (
    <form action={action} className="grid gap-4">
      {computer ? <input type="hidden" name="id" value={computer.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patrimônio">
          <TextInput name="tombo" required defaultValue={computer?.tombo} placeholder="PC-0001" />
        </Field>
        <Field label="Hostname" hint="opcional">
          <TextInput name="hostname" defaultValue={computer?.hostname ?? ""} placeholder="CAU-PC-0001" />
        </Field>
        <Field label="Nº de série" hint="opcional">
          <TextInput name="serialNumber" defaultValue={computer?.serialNumber ?? ""} />
        </Field>
        <Field label="Status">
          <SelectInput name="status" defaultValue={computer?.status ?? "AVAILABLE"}>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Fabricante" hint="opcional">
          <TextInput name="fabricante" defaultValue={computer?.fabricante ?? ""} placeholder="Dell" />
        </Field>
        <Field label="Modelo" hint="opcional">
          <TextInput name="modelo" defaultValue={computer?.modelo ?? ""} placeholder="OptiPlex 7010" />
        </Field>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alocação</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Usuário cadastrado" hint="opcional">
          <SelectInput name="servidorId" defaultValue={computer?.servidorId ?? ""}>
            <option value="">Nenhum / informar manualmente</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome} ({person.departamentoCodigo}. {person.departamentoNome})
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Usuário (texto)" hint="se não houver cadastro">
          <TextInput name="usuario" defaultValue={computer?.usuario ?? ""} />
        </Field>
        <Field label="Setor">
          <SelectInput name="departamentoId" defaultValue={computer?.departamentoId ?? ""}>
            <option value="">Não informado</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.codigo ? `${item.codigo}. ${item.nome}` : item.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Prédio">
          <SelectInput name="localizacaoId" defaultValue={computer?.localizacaoId ?? ""}>
            <option value="">Não informado</option>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>{formatPredio(item)}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hardware e sistema</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Processador"><TextInput name="processador" defaultValue={computer?.processador ?? ""} /></Field>
        <Field label="Memória RAM"><TextInput name="memoriaRam" defaultValue={computer?.memoriaRam ?? ""} placeholder="16 GB" /></Field>
        <Field label="Armazenamento"><TextInput name="armazenamento" defaultValue={computer?.armazenamento ?? ""} placeholder="512 GB SSD" /></Field>
        <Field label="Sistema operacional"><TextInput name="sistemaOperacional" defaultValue={computer?.sistemaOperacional ?? ""} placeholder="Windows 11" /></Field>
        <Field label="Versão"><TextInput name="soVersao" defaultValue={computer?.soVersao ?? ""} /></Field>
        <Field label="Arquitetura"><TextInput name="arquitetura" defaultValue={computer?.arquitetura ?? ""} placeholder="x64" /></Field>
      </div>
      <Field label="Observações">
        <TextArea name="observacoes" defaultValue={computer?.observacoes ?? ""} />
      </Field>
      {state && "error" in state && state.error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
