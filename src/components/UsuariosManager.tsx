"use client";

import { useActionState, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { saveServidor, deleteServidor } from "@/app/actions/servidores";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, FilterSearch, TextInput } from "@/components/ui/Field";

type Person = {
  id: string;
  nome: string;
  matricula: string | null;
  cargo: string | null;
};

export function UsuariosManager({
  people,
  isAdmin,
}: {
  people: Person[];
  isAdmin: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return people;
    return people.filter((p) =>
      [p.nome, p.matricula, p.cargo].filter(Boolean).join(" ").toLowerCase().includes(term),
    );
  }, [people, q]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterSearch
          value={q}
          onChange={setQ}
          placeholder="Filtrar esta lista…"
          className="max-w-sm"
        />
        {isAdmin ? (
          <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo usuário
          </Button>
        ) : null}
      </div>

      <div className="surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Nome completo</th>
              <th className="px-4 py-3">Cargo</th>
              {isAdmin ? <th className="px-4 py-3 text-right">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((person) => (
              <tr key={person.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{person.matricula || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{person.nome}</td>
                <td className="px-4 py-3 text-slate-600">{person.cargo || "—"}</td>
                {isAdmin ? (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="Editar"
                        onClick={() => { setEditing(person); setOpen(true); }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Excluir"
                        onClick={async () => {
                          await deleteServidor(person.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <EmptyState title="Nenhum usuário encontrado" description="Cadastre pessoas para associá-las aos equipamentos." />
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {people.length} usuários</p>

      <Dialog title={editing ? "Editar usuário" : "Novo usuário"} open={open} onClose={() => setOpen(false)}>
        <ServidorForm person={editing} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function ServidorForm({
  person,
  onSuccess,
}: {
  person: Person | null;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await saveServidor(prev, fd);
    if (res.success) onSuccess();
    return res;
  }, null);

  return (
    <form action={formAction} className="grid gap-4">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      <Field label="Nome completo">
        <TextInput name="nome" required defaultValue={person?.nome} />
      </Field>
      <Field label="Matrícula">
        <TextInput name="matricula" required defaultValue={person?.matricula ?? ""} />
      </Field>
      <Field label="Cargo" hint="opcional">
        <TextInput name="cargo" defaultValue={person?.cargo ?? ""} />
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
