"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { saveDepartamento, deleteDepartamento } from "@/app/actions/organizacao";
import { setorLabel } from "@/lib/alocacao";
import { parentSetorCodigo } from "@/lib/setor-codigo";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";

type Item = {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
  parentId: string | null;
  computadores: number;
  monitores: number;
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

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-[1fr_8rem_8rem_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Lotação</span>
          <span className="text-right">Computadores</span>
          <span className="text-right">Monitores</span>
          <span className="w-28 text-right">Ações</span>
        </div>
        {items.length ? (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[1fr_8rem_8rem_auto] items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50/80"
                style={{ paddingLeft: `${16 + (item.nivel - 1) * 18}px` }}
              >
                <div className="min-w-0">
                  <p className={item.nivel === 1 ? "font-semibold text-slate-900" : "font-medium text-slate-800"}>
                    <span className="mr-1.5 font-normal text-slate-400">{item.codigo}.</span>
                    {item.nome}
                  </p>
                </div>
                <span className="text-right tabular-nums text-slate-600">{item.computadores}</span>
                <span className="text-right tabular-nums text-slate-600">{item.monitores}</span>
                <div className="flex w-28 justify-end gap-1">
                  <Link
                    href={`/visao-geral?setor=${encodeURIComponent(setorLabel(item))}`}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    title="Ver na visão geral"
                  >
                    <Eye size={14} />
                  </Link>
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
              Excluir <strong>{removing.codigo}. {removing.nome}</strong>? Só é permitido se não houver subsetores ou equipamentos vinculados.
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
  const [codigo, setCodigo] = useState(item?.codigo ?? "");
  const parentCodigo = parentSetorCodigo(codigo);
  const parent = parentCodigo ? parents.find((setor) => setor.codigo === parentCodigo) : null;
  const [state, formAction, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await saveDepartamento(prev, fd);
    if (res.success) onSuccess();
    return res;
  }, null);

  return (
    <form action={formAction} className="grid gap-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="parentId" value={parent?.id ?? ""} />
      <Field label="Código" hint="a escala define o lugar">
        <TextInput
          name="codigo"
          required
          value={codigo}
          placeholder="9.2.5"
          onChange={(event) => setCodigo(event.target.value)}
        />
      </Field>
      <Field label="Nome">
        <TextInput name="nome" required defaultValue={item?.nome} />
      </Field>
      <p className="text-sm text-slate-500">
        {parent
          ? `Entra abaixo de ${parent.codigo}. ${parent.nome}.`
          : parentCodigo
            ? `Cadastre primeiro o setor ${parentCodigo}.`
            : "Código sem ponto entra no nível raiz, na ordem da escala."}
      </p>
      {state && "error" in state && state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
