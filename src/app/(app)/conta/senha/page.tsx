"use client";

import { useActionState, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { changeForcedPassword } from "@/app/actions/contas";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/PageHeader";

export default function TrocaObrigatoriaPage() {
  const { data, status, update } = useSession();
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    if (data?.user?.mustChangePassword) return;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard nav para atualizar cookie JWT
    window.location.assign(`${window.location.origin}/`);
  }, [status, data?.user?.mustChangePassword]);

  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    setSuccess("");
    const res = await changeForcedPassword(_, fd);
    if (!("success" in res) || !res.success) return res;

    setSuccess("Senha alterada com sucesso. Abrindo o sistema…");
    try {
      await update({ mustChangePassword: false });
    } catch {
      // A senha já foi salva; seguimos para a home mesmo se a sessão falhar.
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard nav para atualizar cookie JWT
    window.location.assign(`${window.location.origin}/`);
    return res;
  }, null);

  return (
    <>
      <PageHeader
        title="Trocar senha"
        description="Sua senha é temporária. Defina uma senha nova para continuar usando o sistema."
      />
      <form action={action} className="surface grid max-w-lg gap-3 p-5">
        <Field label="Senha temporária atual">
          <TextInput name="current" type="password" required autoComplete="current-password" />
        </Field>
        <Field label="Nova senha">
          <TextInput name="next" type="password" required minLength={6} autoComplete="new-password" />
        </Field>
        <Field label="Confirmar nova senha">
          <TextInput name="confirm" type="password" required minLength={6} autoComplete="new-password" />
        </Field>
        {state && "error" in state && state.error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
            {state.error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || Boolean(success)}>
            {success ? "Abrindo…" : pending ? "Salvando…" : "Definir senha"}
          </Button>
        </div>
      </form>
    </>
  );
}
