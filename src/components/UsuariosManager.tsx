"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { saveServidor, deleteServidor } from "@/app/actions/servidores";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";

type Dept = { id: string; codigo: string; nome: string };
type Person = {
  id: string;
  nome: string;
  email: string | null;
  matricula: string | null;
  cargo: string | null;
  ativo: boolean;
  departamentoId: string;
  departamento: { codigo: string; nome: string };
};

export function UsuariosManager({
  people,
  departments,
  isAdmin,
}: {
  people: Person[];
  departments: Dept[];
  isAdmin: boolean;
}) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return people.filter((p) => {
      if (dept && p.departamentoId !== dept) return false;
      if (!term) return true;
      return [p.nome, p.email, p.matricula, p.cargo, p.departamento.nome]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [people, q, dept]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nome, matrícula, e-mail…"
            className="max-w-sm"
          />
          <SelectInput value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-72">
            <option value="">Todos os setores</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.codigo}. {d.nome}</option>
            ))}
          </SelectInput>
        </div>
        {isAdmin ? (
          <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo usuário
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Status</th>
              {isAdmin ? <th className="px-4 py-3">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((person) => (
              <tr key={person.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{person.nome}</p>
                  {person.email ? <p className="text-xs text-slate-500">{person.email}</p> : null}
                </td>
                <td className="px-4 py-3 text-slate-600">{person.matricula || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{person.cargo || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {person.departamento.codigo}. {person.departamento.nome}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${person.ativo ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"}`}>
                    {person.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                {isAdmin ? (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => { setEditing(person); setOpen(true); }}>
                        Editar
                      </Button>
                      <Button type="button" variant="ghost" onClick={async () => {
                        await deleteServidor(person.id);
                      }}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum usuário encontrado" description="Cadastre pessoas e associe-as a um setor." /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {people.length} usuários</p>

      <Dialog title={editing ? "Editar usuário" : "Novo usuário"} open={open} onClose={() => setOpen(false)}>
        <ServidorForm person={editing} departments={departments} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function ServidorForm({
  person,
  departments,
  onSuccess,
}: {
  person: Person | null;
  departments: Dept[];
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Matrícula" hint="opcional">
          <TextInput name="matricula" defaultValue={person?.matricula ?? ""} />
        </Field>
        <Field label="Cargo" hint="opcional">
          <TextInput name="cargo" defaultValue={person?.cargo ?? ""} />
        </Field>
      </div>
      <Field label="E-mail" hint="opcional">
        <TextInput name="email" type="email" defaultValue={person?.email ?? ""} />
      </Field>
      <Field label="Setor">
        <SelectInput name="departamentoId" required defaultValue={person?.departamentoId ?? ""}>
          <option value="">Selecione…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.codigo}. {d.nome}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Situação">
        <SelectInput name="ativo" defaultValue={person?.ativo === false ? "false" : "true"}>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </SelectInput>
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
