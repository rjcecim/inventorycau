"use client";

import { useActionState } from "react";
import { changeForcedPassword, deleteOwnAccount, updateOwnProfile } from "@/app/actions/contas";
import { roleLabel } from "@/lib/roles";
import { logout } from "@/lib/logout";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

export function MinhaConta({
  fullName,
  login,
  contactEmail,
  role,
}: {
  fullName: string;
  login: string;
  contactEmail: string | null;
  role: string;
}) {
  const [profileState, profileAction, savingProfile] = useActionState(updateOwnProfile, null);
  const [passwordState, passwordAction, savingPassword] = useActionState(changeForcedPassword, null);
  const [deleteState, deleteAction, deleting] = useActionState(async (_: unknown, fd: FormData) => {
    const res = await deleteOwnAccount(_, fd);
    if (res.success) await logout();
    return res;
  }, null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface p-5">
        <h2 className="text-sm font-semibold text-slate-900">Dados da conta</h2>
        <p className="mt-1 text-sm text-slate-500">
          Login: <span className="font-medium text-slate-700">{login}</span> ·{" "}
          {roleLabel(role)}
        </p>
        <form action={profileAction} className="mt-4 grid gap-3">
          <Field label="Nome">
            <TextInput name="fullName" required defaultValue={fullName} />
          </Field>
          <Field label="E-mail" hint="usado na recuperação de senha">
            <TextInput name="contactEmail" type="email" required defaultValue={contactEmail ?? ""} />
          </Field>
          {profileState && "error" in profileState && profileState.error ? (
            <p className="text-sm text-rose-700">{profileState.error}</p>
          ) : null}
          {profileState && "success" in profileState && profileState.success ? (
            <p className="text-sm text-emerald-700">Dados atualizados.</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Salvando…" : "Salvar dados"}
            </Button>
          </div>
        </form>
      </section>

      <section className="surface p-5">
        <h2 className="text-sm font-semibold text-slate-900">Trocar senha</h2>
        <p className="mt-1 text-sm text-slate-500">Informe a senha atual e defina a nova senha.</p>
        <form action={passwordAction} className="mt-4 grid gap-3">
          <Field label="Senha atual">
            <TextInput name="current" type="password" required autoComplete="current-password" />
          </Field>
          <Field label="Nova senha">
            <TextInput name="next" type="password" required minLength={6} autoComplete="new-password" />
          </Field>
          <Field label="Confirmar nova senha">
            <TextInput name="confirm" type="password" required minLength={6} autoComplete="new-password" />
          </Field>
          {passwordState && "error" in passwordState && passwordState.error ? (
            <p className="text-sm text-rose-700">{passwordState.error}</p>
          ) : null}
          {passwordState && "success" in passwordState && passwordState.success ? (
            <p className="text-sm text-emerald-700">Senha alterada com sucesso.</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Alterando…" : "Definir nova senha"}
            </Button>
          </div>
        </form>
      </section>

      <section className="surface p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-rose-800">Excluir conta</h2>
        <p className="mt-1 text-sm text-slate-500">Esta ação é definitiva. Você sairá do sistema imediatamente.</p>
        <form action={deleteAction} className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Senha atual">
            <TextInput name="password" type="password" required />
          </Field>
          <Button type="submit" variant="danger" disabled={deleting}>
            {deleting ? "Excluindo…" : "Excluir minha conta"}
          </Button>
        </form>
        {deleteState && "error" in deleteState && deleteState.error ? (
          <p className="mt-3 text-sm text-rose-700">{deleteState.error}</p>
        ) : null}
      </section>
    </div>
  );
}
