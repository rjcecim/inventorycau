"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { saveDepartamento, deleteDepartamento } from "@/app/actions/organizacao";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { EmptyState } from "@/components/ui/EmptyState";

type Item = {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
  parentId: string | null;
  servidores: number;
  computadores: number;
};

export function SetoresManager({
  items,
  isAdmin,
}: {
  items: Item[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);
  const [error, setError] = useState("");

  return (
    <>
      {isAdmin ? (
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo setor
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_7rem_8rem_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Lotação</span>
          <span className="text-right">Usuários</span>
          <span className="text-right">Computadores</span>
          <span className="w-24 text-right">{isAdmin ? "Ações" : ""}</span>
        </div>
        {items.length ? (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[1fr_7rem_8rem_auto] items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50/80"
                style={{ paddingLeft: `${16 + (item.nivel - 1) * 18}px` }}
              >
                <div className="min-w-0">
                  <p className={item.nivel === 1 ? "font-semibold text-slate-900" : "font-medium text-slate-800"}>
                    <span className="mr-1.5 font-normal text-slate-400">{item.codigo}.</span>
                    {item.nome}
                  </p>
                </div>
                <span className="text-right tabular-nums text-slate-600">{item.servidores}</span>
                <span className="text-right tabular-nums text-slate-600">{item.computadores}</span>
                <div className="flex w-24 justify-end gap-1">
                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="Editar"
                        onClick={() => { setEditing(item); setOpen(true); }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Excluir"
                        onClick={() => { setError(""); setRemoving(item); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhum setor cadastrado" description="Cadastre o primeiro setor da lotação." />
        )}
      </div>

      <Dialog title={editing ? "Editar setor" : "Novo setor"} open={open} onClose={() => setOpen(false)}>
        <SetorForm
          item={editing}
          parents={items.filter((i) => i.id !== editing?.id)}
          onSuccess={() => setOpen(false)}
        />
      </Dialog>

      <Dialog title="Excluir setor" open={!!removing} onClose={() => setRemoving(null)}>
        {removing ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Excluir <strong>{removing.codigo}. {removing.nome}</strong>? Só é permitido se não houver subsetores, usuários ou equipamentos vinculados.
            </p>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" variant="danger" onClick={async () => {
                const res = await deleteDepartamento(removing.id);
                if (res.error) setError(res.error);
                else setRemoving(null);
              }}>Excluir</Button>
              <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function SetorForm({
  item,
  parents,
  onSuccess,
}: {
  item: Item | null;
  parents: Item[];
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await saveDepartamento(prev, fd);
    if (res.success) onSuccess();
    return res;
  }, null);

  return (
    <form action={formAction} className="grid gap-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="Código" hint="ex.: 9.2.5">
        <TextInput name="codigo" required defaultValue={item?.codigo} placeholder="9.2.5" />
      </Field>
      <Field label="Nome">
        <TextInput name="nome" required defaultValue={item?.nome} />
      </Field>
      <Field label="Setor pai" hint="opcional">
        <SearchSelect
          name="parentId"
          defaultValue={item?.parentId ?? ""}
          emptyLabel="Nenhum (nível raiz)"
          placeholder="Pesquisar setor pai…"
          options={parents.map((p) => ({
            id: p.id,
            label: `${p.codigo}. ${p.nome}`,
          }))}
        />
      </Field>
      {state && "error" in state && state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
