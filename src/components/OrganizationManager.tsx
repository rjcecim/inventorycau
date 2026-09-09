"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCidade, UFS } from "@/lib/predios";

type PredioItem = {
  id: string;
  nome: string;
  cidade: string;
  uf: string | null;
  computers: number;
  monitors: number;
};

export function OrganizationManager({
  title,
  items,
  saveAction,
  deleteAction,
  isAdmin,
}: {
  title: string;
  items: PredioItem[];
  saveAction: (state: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteAction: (id: string) => Promise<{ error?: string; success?: boolean }>;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PredioItem | null>(null);
  const [error, setError] = useState("");

  const grouped = items.reduce<Array<{ place: string; items: PredioItem[] }>>((acc, item) => {
    const place = formatCidade(item) || "Cidade não informada";
    const group = acc.find((entry) => entry.place === place);
    if (group) group.items.push(item);
    else acc.push({ place, items: [item] });
    return acc;
  }, []);

  return (
    <>
      {isAdmin ? (
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo
          </Button>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {items.length ? (
          <ul className="divide-y divide-line">
            {grouped.map((group) => (
              <li key={group.place}>
                <p className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.place}
                </p>
                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.nome}</p>
                        <p className="text-xs text-slate-400">
                          {item.computers} computador{item.computers === 1 ? "" : "es"}
                          {" · "}
                          {item.monitors} monitor{item.monitors === 1 ? "" : "es"}
                        </p>
                      </div>
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <Button type="button" variant="secondary" onClick={() => { setEditing(item); setOpen(true); }}>Editar</Button>
                          <Button type="button" variant="ghost" onClick={async () => {
                            const res = await deleteAction(item.id);
                            if (res.error) setError(res.error);
                          }}>Excluir</Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={`Nenhum ${title.toLowerCase()} cadastrado`} description="Cadastre os prédios do órgão, inclusive em outras cidades." />
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <Dialog title={editing ? `Editar ${title.toLowerCase()}` : `Novo ${title.toLowerCase()}`} open={open} onClose={() => setOpen(false)}>
        <OrgForm item={editing} action={saveAction} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function OrgForm({
  item,
  action,
  onSuccess,
}: {
  item: PredioItem | null;
  action: (state: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await action(prev, fd);
    if (res.success) onSuccess();
    return res;
  }, null);

  return (
    <form action={formAction} className="grid gap-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="Nome do prédio">
        <TextInput name="nome" required defaultValue={item?.nome} placeholder="Sede, Anexo, Unidade Regional…" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="Cidade">
          <TextInput name="cidade" required defaultValue={item?.cidade ?? ""} placeholder="Belém" />
        </Field>
        <Field label="UF">
          <SearchSelect
            name="uf"
            required
            emptyLabel="Selecione"
            placeholder="Pesquisar UF…"
            defaultValue={item?.uf ?? ""}
            options={UFS.map((uf) => ({
              id: uf.sigla,
              label: `${uf.sigla} — ${uf.nome}`,
            }))}
          />
        </Field>
      </div>
      {state && "error" in state && state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
