"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";

export function OrganizationManager({
  title,
  items,
  extraFields,
  saveAction,
  deleteAction,
  isAdmin,
}: {
  title: string;
  items: Array<{ id: string; nome: string; predio?: string | null; andar?: string | null; sala?: string | null; count: number }>;
  extraFields?: boolean;
  saveAction: (state: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteAction: (id: string) => Promise<{ error?: string; success?: boolean }>;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<(typeof items)[number] | null>(null);
  const [error, setError] = useState("");

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
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{item.nome}</p>
                  {extraFields ? (
                    <p className="text-xs text-slate-500">
                      {[item.predio, item.andar && `Andar ${item.andar}`, item.sala && `Sala ${item.sala}`].filter(Boolean).join(" · ") || "Sem complemento"}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-400">{item.count} computadores</p>
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
        ) : (
          <EmptyState title={`Nenhum ${title.toLowerCase()} cadastrado`} />
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <Dialog title={editing ? `Editar ${title.toLowerCase()}` : `Novo ${title.toLowerCase()}`} open={open} onClose={() => setOpen(false)}>
        <OrgForm extraFields={extraFields} item={editing} action={saveAction} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function OrgForm({
  item,
  extraFields,
  action,
  onSuccess,
}: {
  item: { id: string; nome: string; predio?: string | null; andar?: string | null; sala?: string | null } | null;
  extraFields?: boolean;
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
      <Field label="Nome">
        <TextInput name="nome" required defaultValue={item?.nome} />
      </Field>
      {extraFields ? (
        <>
          <Field label="Prédio"><TextInput name="predio" defaultValue={item?.predio ?? ""} /></Field>
          <Field label="Andar"><TextInput name="andar" defaultValue={item?.andar ?? ""} /></Field>
          <Field label="Sala"><TextInput name="sala" defaultValue={item?.sala ?? ""} /></Field>
        </>
      ) : null}
      {state && "error" in state && state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
