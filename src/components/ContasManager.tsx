"use client";

import { useActionState, useState } from "react";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { createAccount, deleteAccount, resetAccountPassword, updateAccount } from "@/app/actions/contas";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, TextInput } from "@/components/ui/Field";

type Account = {
  id: string;
  email: string;
  fullName: string;
  contactEmail: string | null;
  role: "ADMIN" | "USER";
  mustChangePassword: boolean;
};

export function ContasManager({ accounts, currentUserId }: { accounts: Account[]; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [revealed, setRevealed] = useState<{ login: string; password: string } | null>(null);
  const [error, setError] = useState("");

  const [createState, createAction, creating] = useActionState(async (_: unknown, fd: FormData) => {
    const res = await createAccount(_, fd);
    if (res.success && res.password && res.login) {
      setOpen(false);
      setRevealed({ login: res.login, password: res.password });
    }
    return res;
  }, null);

  const [editState, editAction, saving] = useActionState(async (_: unknown, fd: FormData) => {
    const res = await updateAccount(_, fd);
    if (res.success) setEditing(null);
    return res;
  }, null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => { setOpen(true); }}>
          <Plus size={16} /> Nova conta
        </Button>
      </div>

      <div className="surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Senha</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{account.email}</td>
                <td className="px-4 py-3 text-slate-600">{account.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{account.contactEmail || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{account.role === "ADMIN" ? "Administrador" : "Usuário"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {account.mustChangePassword ? "Troca obrigatória" : "Ativa"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                      title="Editar"
                      onClick={() => setEditing(account)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                      title="Gerar nova senha"
                      onClick={async () => {
                        setError("");
                        const res = await resetAccountPassword(account.id);
                        if (res.error) setError(res.error);
                        else if (res.password && res.login) setRevealed({ login: res.login, password: res.password });
                      }}
                    >
                      <KeyRound size={14} />
                    </button>
                    {account.id !== currentUserId ? (
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Excluir"
                        onClick={async () => {
                          if (!confirm(`Excluir a conta ${account.email}?`)) return;
                          setError("");
                          const res = await deleteAccount(account.id);
                          if (res.error) setError(res.error);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length ? <EmptyState title="Nenhuma conta cadastrada" /> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <Dialog title="Nova conta" open={open} onClose={() => setOpen(false)}>
        <form action={createAction} className="grid gap-3">
          <Field label="Login">
            <TextInput name="login" required placeholder="nome.sobrenome" />
          </Field>
          <Field label="Nome completo">
            <TextInput name="fullName" required />
          </Field>
          <Field label="E-mail" hint="para envio do código OTP">
            <TextInput name="contactEmail" type="email" required placeholder="nome@dominio.gov.br" />
          </Field>
          <Field label="Perfil">
            <select name="role" defaultValue="USER" className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm">
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Field>
          {createState && "error" in createState && createState.error ? (
            <p className="text-sm text-rose-700">{createState.error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={creating}>{creating ? "Criando…" : "Criar e gerar senha"}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog title="Editar conta" open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? (
          <form action={editAction} className="grid gap-3">
            <input type="hidden" name="id" value={editing.id} />
            <p className="text-sm text-slate-500">Login: <span className="font-medium text-slate-800">{editing.email}</span></p>
            <Field label="Nome completo">
              <TextInput name="fullName" required defaultValue={editing.fullName} />
            </Field>
            <Field label="E-mail">
              <TextInput name="contactEmail" type="email" required defaultValue={editing.contactEmail ?? ""} />
            </Field>
            <Field label="Perfil">
              <select name="role" defaultValue={editing.role} className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm">
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Field>
            {editState && "error" in editState && editState.error ? (
              <p className="text-sm text-rose-700">{editState.error}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <Dialog title="Senha temporária" open={Boolean(revealed)} onClose={() => setRevealed(null)}>
        {revealed ? (
          <div className="grid gap-3">
            <p className="text-sm text-slate-600">
              Anote e entregue ao usuário. No próximo acesso, a troca de senha será obrigatória.
            </p>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              Login: <span className="font-semibold">{revealed.login}</span>
            </p>
            <p className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-lg tracking-wide">
              {revealed.password}
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setRevealed(null)}>Fechar</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
