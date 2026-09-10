"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { saveComputador } from "@/app/actions/computadores";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS } from "@/lib/status";
import { formatPredio } from "@/lib/predios";

type Option = { id: string; nome: string; codigo?: string; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; matricula?: string | null };

export function ComputerForm({
  computer,
  departments,
  locations,
  people = [],
  cancelHref,
  onSuccess,
}: {
  computer?: {
    id: string;
    tombo: string;
    serialNumber: string | null;
    fabricante: string | null;
    modelo: string | null;
    status: AssetStatus;
    processador: string | null;
    memoriaRam: string | null;
    armazenamento: string | null;
    observacoes: string | null;
    usuario: string | null;
    servidorId: string | null;
    departamentoId: string | null;
    localizacaoId: string | null;
  };
  departments: Option[];
  locations: Option[];
  people?: PersonOption[];
  cancelHref?: string;
  onSuccess?: (id?: string) => void;
}) {
  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await saveComputador(prev, fd);
    if (res.success) onSuccess?.(res.id);
    return res;
  }, null);

  return (
    <form action={action} className="grid gap-4">
      {computer ? <input type="hidden" name="id" value={computer.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patrimônio">
          <TextInput name="tombo" required defaultValue={computer?.tombo} placeholder="PC-0001" />
        </Field>
        <Field label="Nº de série" hint="opcional">
          <TextInput name="serialNumber" defaultValue={computer?.serialNumber ?? ""} />
        </Field>
        <Field label="Status">
          <SearchSelect
            name="status"
            allowEmpty={false}
            placeholder="Pesquisar status…"
            defaultValue={computer?.status ?? "AVAILABLE"}
            options={STATUS_OPTIONS}
          />
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
        <Field label="Usuário" hint="opcional">
          <SearchSelect
            name="servidorId"
            defaultValue={computer?.servidorId ?? ""}
            emptyLabel="Nenhum"
            placeholder="Pesquisar usuário…"
            options={people.map((person) => ({
              id: person.id,
              label: person.matricula ? `${person.nome} — ${person.matricula}` : person.nome,
            }))}
          />
        </Field>
        <Field label="Setor">
          <SearchSelect
            name="departamentoId"
            defaultValue={computer?.departamentoId ?? ""}
            placeholder="Pesquisar setor…"
            options={departments.map((item) => ({
              id: item.id,
              label: item.codigo ? `${item.codigo}. ${item.nome}` : item.nome,
            }))}
          />
        </Field>
        <Field label="Prédio">
          <SearchSelect
            name="localizacaoId"
            defaultValue={computer?.localizacaoId ?? ""}
            placeholder="Pesquisar prédio…"
            options={locations.map((item) => ({
              id: item.id,
              label: formatPredio(item),
            }))}
          />
        </Field>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hardware</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Processador"><TextInput name="processador" defaultValue={computer?.processador ?? ""} /></Field>
        <Field label="Memória RAM"><TextInput name="memoriaRam" defaultValue={computer?.memoriaRam ?? ""} placeholder="16 GB" /></Field>
        <Field label="Armazenamento"><TextInput name="armazenamento" defaultValue={computer?.armazenamento ?? ""} placeholder="512 GB SSD" /></Field>
      </div>
      <Field label="Observações">
        <TextArea name="observacoes" defaultValue={computer?.observacoes ?? ""} />
      </Field>
      {state && "error" in state && state.error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      <div className="flex justify-end gap-2">
        {cancelHref ? (
          <Link href={cancelHref} className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line hover:bg-slate-50">
            Cancelar
          </Link>
        ) : null}
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
