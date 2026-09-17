"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { updateAlocacaoMonitor } from "@/app/actions/monitores";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS } from "@/lib/status";
import { formatPredio } from "@/lib/predios";

type Option = { id: string; nome?: string; codigo?: string; cidade?: string | null; uf?: string | null };
type PersonOption = { id: string; nome: string; matricula?: string | null };

export function MonitorMoveForm({
  monitor,
  departments,
  locations,
  people = [],
  grouped,
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
  };
  departments: Option[];
  locations: Option[];
  people?: PersonOption[];
  grouped?: boolean;
  cancelHref: string;
  onSuccess?: (id?: string) => void;
}) {
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
        Altere usuário, setor, prédio ou status.
        {grouped ? " Alterações de alocação serão sincronizadas com os equipamentos agrupados." : ""}
      </p>
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
